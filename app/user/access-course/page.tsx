"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import { Calendar, Loader2, Clock, PlayCircle, Info, Bug, MessageSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { extractYoutubeVideoId } from "@/lib/utils"

interface Batch {
  id: number
  batch_number: string | null
  custom_batch_time: string | null
  is_predefined_batch: boolean
}

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
  attended: boolean
  completedVideo: boolean
  videoDuration?: number // in seconds
  batches: Batch[] // Array of batch information
  hasAccess?: boolean
  eligibleSubscriptions?: any[]
  batch_number?: string | null
  custom_batch_time?: string | null
  is_predefined_batch?: boolean
  scheduling_type?: string
  subscription_day?: number | null
  subscription_week?: number | null
  video_type?: string // Added to differentiate video sources
  video_duration?: number // Added for consistency with fetched data
}

interface GroupedCourse {
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
  batches: Batch[]
  attended: boolean
  completedVideo: boolean
  videoDuration?: number
  eligibleSubscriptions: any[]
  hasAccess?: boolean
  scheduling_type?: string
  subscription_day?: number | null
  subscription_week?: number | null
}

// Add a new interface for Subscription
interface Subscription {
  id: number
  name: string
  description: string | null
  whatsapp_group_link: string | null
}

function AccessCourseContent() {
  const router = useRouter()
  const [todayCourses, setTodayCourses] = useState<Course[]>([])
  const [groupedTodayCourses, setGroupedTodayCourses] = useState<GroupedCourse[]>([])
  const [upcomingCourses, setUpcomingCourses] = useState<Course[]>([])
  const [groupedUpcomingCourses, setGroupedUpcomingCourses] = useState<GroupedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English")
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(["English"])
  const [viewMode, setViewMode] = useState<"today" | "upcoming">("today")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  // Add these new state variables at the top of the component
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
  const [accessCounts, setAccessCounts] = useState<{ [key: string]: number }>({})

  const searchParams = useSearchParams()
  const [sessionEndedCourseId, setSessionEndedCourseId] = useState<string | null>(null)

  async function getYouTubeDuration(youtubeLink: string): Promise<number> {
    try {
      const videoId = extractYoutubeVideoId(youtubeLink)
      if (!videoId) return 3600

      // Use YouTube oEmbed API to get video info
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      )

      if (!response.ok) return 3600

      // For more accurate duration, we need to load the video in an iframe
      // But for now, we'll use a fallback approach with the IFrame API
      return new Promise((resolve) => {
        const iframe = document.createElement("iframe")
        iframe.style.display = "none"
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
        document.body.appendChild(iframe)

        const checkPlayer = setInterval(() => {
          try {
            // @ts-ignore
            if (iframe.contentWindow?.YT?.Player) {
              // @ts-ignore
              const player = new iframe.contentWindow.YT.Player(iframe, {
                events: {
                  onReady: (event: any) => {
                    const duration = event.target.getDuration()
                    clearInterval(checkPlayer)
                    document.body.removeChild(iframe)
                    resolve(duration || 3600)
                  },
                },
              })
            }
          } catch (e) {
            // Fallback if iframe approach fails
            clearInterval(checkPlayer)
            document.body.removeChild(iframe)
            resolve(3600)
          }
        }, 500)

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkPlayer)
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
          resolve(3600)
        }, 5000)
      })
    } catch (error) {
      console.error("[v0] Error fetching YouTube duration:", error)
      return 3600
    }
  }

  useEffect(() => {
    const endedId = searchParams.get("sessionEnded")
    if (endedId) {
      setSessionEndedCourseId(endedId)
      // Clear the URL parameter after 5 seconds
      setTimeout(() => {
        setSessionEndedCourseId(null)
      }, 5000)
    }
  }, [searchParams])

  const getBatchDisplayName = (batch: Batch): string => {
    if (batch.custom_batch_time) {
      return `Batch ${batch.custom_batch_time}`
    }
    if (batch.batch_number) {
      return getBatchLabel(Number.parseInt(batch.batch_number))
    }
    return "Batch"
  }

  // Combined the fetchCourses and checkSubscriptionDays logic into one useEffect
  useEffect(() => {
    const loadCourses = async () => {
      await fetchCourses()
    }
    loadCourses()

    const checkSubscriptionDays = async () => {
      try {
        await fetch("/api/check-and-update-days", { method: "POST" })
      } catch (error) {
        console.error("[v0] Error checking subscription days:", error)
      }
    }
    checkSubscriptionDays()

    // Set up a timer to refresh the session status every minute
    const intervalId = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1)
    }, 60000)

    return () => clearInterval(intervalId)
  }, [refreshTrigger, selectedLanguage]) // Added selectedLanguage to dependency array

  // Add this useEffect to fetch subscriptions when dialog opens
  useEffect(() => {
    if (showWhatsAppDialog) {
      fetchUserSubscriptions()
    }
  }, [showWhatsAppDialog])

  useEffect(() => {
    // Check if user has already seen the WhatsApp notification
    const hasSeenWhatsAppNotification = localStorage.getItem("hasSeenWhatsAppNotification")

    if (!hasSeenWhatsAppNotification) {
      // Show the dialog after a short delay
      const timer = setTimeout(() => {
        setShowWhatsAppDialog(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  // Group courses by title, date, and language
  const groupCourses = (courses: Course[]): GroupedCourse[] => {
    const grouped: { [key: string]: GroupedCourse } = {}

    courses.forEach((course) => {
      // Create a unique key for each course group
      const key = `${course.title}_${course.scheduled_date}_${course.language}`

      if (!grouped[key]) {
        grouped[key] = {
          title: course.title,
          description: course.description,
          youtube_link: course.youtube_link,
          scheduled_date: course.scheduled_date,
          language: course.language,
          subscription_id: course.subscription_id,
          batches: [],
          attended: course.attended,
          completedVideo: course.completedVideo,
          videoDuration: course.videoDuration,
          eligibleSubscriptions: course.eligibleSubscriptions || [],
          hasAccess: course.hasAccess,
          scheduling_type: course.scheduling_type,
          subscription_day: course.subscription_day,
          subscription_week: course.subscription_week,
        }
      }

      // Add this batch to the course
      grouped[key].batches.push({
        id: course.id,
        batch_number: course.batch_number,
        custom_batch_time: course.custom_batch_time,
        is_predefined_batch: course.is_predefined_batch || false,
      })

      // If any batch is attended, mark the course as attended
      if (course.attended) {
        grouped[key].attended = true
      }

      // If any batch is completed, mark the course as completed
      if (course.completedVideo) {
        grouped[key].completedVideo = true
      }
    })

    return Object.values(grouped)
  }

  // Parse time string to get hours and minutes
  const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
    // Handle formats like "5:30 to 6:30" or "5:30 AM to 6:30 AM"
    const timeMatch = timeStr?.match(/(\d+):(\d+)\s*(AM|PM)?/)
    if (!timeMatch) return { hour: 0, minute: 0 }

    let hour = Number.parseInt(timeMatch[1])
    const minute = Number.parseInt(timeMatch[2])
    const ampm = timeMatch[3]?.toUpperCase()

    // Convert to 24-hour format if needed
    if (ampm === "PM" && hour < 12) hour += 12
    if (ampm === "AM" && hour === 12) hour = 0

    return { hour, minute }
  }

  // Get the scheduled start time for a course batch
  const getScheduledStartTime = (course: GroupedCourse, batch: Batch): Date => {
    const today = new Date(course.scheduled_date)

    let startHour = 0
    let startMinute = 0
    const batch_number = batch.batch_number

    if (batch.is_predefined_batch && batch_number) {
      // Parse predefined batch times
      const batchNum = Number.parseInt(batch.batch_number)
      if (batchNum === 1) {
        startHour = 5
        startMinute = 30 // Morning Batch 1 (5:30 to 6:30)
      } else if (batchNum === 2) {
        startHour = 6
        startMinute = 40 // Morning Batch 2 (6:40 to 7:40)
      } else if (batchNum === 3) {
        startHour = 7
        startMinute = 50 // Morning Batch 3 (7:50 to 8:50)
      } else if (batchNum === 4) {
        startHour = 17
        startMinute = 30 // Evening Batch 4 (5:30 to 6:30)
      } else if (batchNum === 5) {
        startHour = 18
        startMinute = 40 // Evening Batch 5 (6:40 to 7:40)
      } else if (batchNum === 6) {
        startHour = 19
        startMinute = 50 // Evening Batch 6 (7:50 to 8:50)
      }
    } else if (batch.custom_batch_time) {
      // Parse custom batch time
      const { hour, minute } = parseTimeString(batch.custom_batch_time)
      startHour = hour
      startMinute = minute
    }

    today.setHours(startHour, startMinute, 0, 0)
    return today
  }

  const isSessionLive = (course: GroupedCourse, batch: Batch): boolean => {
    const now = new Date()
    const userLocalDate = now.toLocaleDateString("en-CA")
    const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")

    if (scheduledLocalDate !== userLocalDate) {
      return false
    }

    const scheduledStart = getScheduledStartTime(course, batch)

    const duration = course.videoDuration || 3600

    console.log("[v0] Checking session live:", course.title, "Duration:", duration, "Start:", scheduledStart)

    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 1000)

    return now >= scheduledStart && now <= scheduledEnd
  }

  const isSessionEnded = (course: GroupedCourse, batch: Batch): boolean => {
    const now = new Date()
    const userLocalDate = now.toLocaleDateString("en-CA")
    const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")

    if (scheduledLocalDate !== userLocalDate) {
      return false
    }

    const scheduledStart = getScheduledStartTime(course, batch)
    const duration = course.videoDuration || 3600
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 1000)

    // Session ended if current time is after end time
    return now > scheduledEnd
  }

  // Find the active batch in a course
  const findActiveBatch = (course: GroupedCourse): Batch | null => {
    for (const batch of course.batches) {
      if (isSessionLive(course, batch)) {
        return batch
      }
    }
    return null
  }

  // Get time until session starts
  const getTimeUntilSession = (course: GroupedCourse, batch: Batch): string | null => {
    const now = new Date()
    const scheduledStart = getScheduledStartTime(course, batch)

    // If session has already started, return null
    if (now >= scheduledStart) {
      return null
    }

    // Calculate time difference in milliseconds
    const diffMs = scheduledStart.getTime() - now.getTime()

    // Convert to hours and minutes
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  const handleJoinSession = async (course: GroupedCourse) => {
    const activeBatch = findActiveBatch(course)

    if (!activeBatch) {
      toast({
        title: "Session not available",
        description: "This session is not currently active.",
        variant: "destructive",
      })
      return
    }

    if (!course.hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have access to this course. Please subscribe to the required plan.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Navigating to live session player with courseId:", activeBatch.id)
    router.push(`/user/live-session/${activeBatch.id}`)
  }

  // Add this new function to fetch user's subscriptions
  const fetchUserSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true)
      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Get user's active subscriptions with WhatsApp links
      const { data: userSubs, error: subsError } = await supabase
        .from("user_subscriptions")
        .select(`
          subscription_id,
          subscriptions (
            id,
            name,
            description,
            whatsapp_group_link
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true)

      if (subsError) throw subsError

      // Format subscriptions for display
      const formattedSubs: Subscription[] = userSubs
        ?.filter((sub) => sub.subscriptions.whatsapp_group_link)
        .map((sub) => ({
          id: sub.subscriptions.id,
          name: sub.subscriptions.name,
          description: sub.subscriptions.description,
          whatsapp_group_link: sub.subscriptions.whatsapp_group_link,
        }))

      setUserSubscriptions(formattedSubs || [])

      // Fetch access counts for each subscription
      if (formattedSubs && formattedSubs.length > 0) {
        const { data: accessData, error: accessError } = await supabase
          .from("link_usages")
          .select(`
            link_id,
            generated_links(target_ids)
          `)
          .eq("user_id", userId)

        if (!accessError && accessData) {
          const counts: { [key: string]: number } = {}

          // Process access data to count usage per subscription
          accessData.forEach((access) => {
            if (access.generated_links && access.generated_links.target_ids) {
              const targetIds = access.generated_links.target_ids
              if (Array.isArray(targetIds) && targetIds.length > 0) {
                const subId = targetIds[0].toString()
                counts[subId] = (counts[subId] || 0) + 1
              }
            }
          })

          setAccessCounts(counts)
        }
      }
    } catch (error) {
      console.error("Error fetching user subscriptions:", error)
      toast({
        title: "Error",
        description: "Failed to load your subscriptions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  // Add this function to handle subscription selection
  const handleSelectSubscription = async (subscription: Subscription) => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()
      const subId = subscription.id.toString()

      // Check if user has already accessed this subscription's WhatsApp group
      const accessCount = accessCounts[subId] || 0

      if (accessCount >= 1) {
        // User has already used their free access
        toast({
          title: "Access Limit Reached",
          description: "You've already accessed this WhatsApp group. Please contact admin for additional access.",
          variant: "destructive",
        })
        return
      }

      // Generate a one-time use link
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `WhatsApp Group for ${subscription.name}`,
          description: `One-time access link for WhatsApp group`,
          linkType: "whatsapp",
          targetUrl: subscription.whatsapp_group_link,
          targetType: "user",
          targetIds: [userId],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiration
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate WhatsApp access link")
      }

      const data = await response.json()

      // Open the WhatsApp group link
      if (subscription.whatsapp_group_link) {
        // For mobile devices, use location.href for better WhatsApp app integration
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

        if (isMobile) {
          // On mobile, directly navigate to WhatsApp link
          window.location.href = subscription.whatsapp_group_link
        } else {
          // On desktop, open in new tab
          window.open(subscription.whatsapp_group_link, "_blank")
        }

        // Record usage
        await fetch(`/api/links/use/${data.link.token}`, {
          method: "POST",
        })

        // Update local state
        setAccessCounts((prev) => ({
          ...prev,
          [subId]: (prev[subId] || 0) + 1,
        }))
      }

      // Close the dialog
      setShowWhatsAppDialog(false)
    } catch (error) {
      console.error("Error handling subscription selection:", error)
      toast({
        title: "Error",
        description: "Failed to access WhatsApp group. Please try again later.",
        variant: "destructive",
      })
    } finally {
      localStorage.setItem("hasSeenWhatsAppNotification", "true")
    }
  }

  // Modify the function to handle joining the WhatsApp channel
  const handleJoinWhatsApp = () => {
    // Show the subscription selection dialog
    setShowSubscriptionDialog(true)

    // Close the initial WhatsApp notification dialog
    setShowWhatsAppDialog(false)

    // Don't mark as seen yet - we'll do that after they select a subscription
  }

  // Add a function to dismiss the dialog
  const handleDismissWhatsApp = () => {
    localStorage.setItem("hasSeenWhatsAppNotification", "true")
    setShowWhatsAppDialog(false)
  }

  // Update the fetchCourses function to check for full_availability
  async function fetchCourses() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Use local date in YYYY-MM-DD format
      const todayLocalDate = new Date().toLocaleDateString("en-CA")

      console.log("[v0] Fetching courses for date:", todayLocalDate)

      // Debug info
      let debugLog = `Today's date: ${todayLocalDate}\n`

      // Get user's subscriptions to check access - now we get all active subscriptions
      const { data: userSubscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          subscription_id,
          start_date,
          end_date,
          is_active,
          subscription:subscriptions (
            id,
            name,
            description
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true)

      if (subError) throw subError

      // Extract activation_date for subscription_day logic
      const processedSubscriptions =
        userSubscriptions?.map((sub) => ({
          ...sub,
          activation_date: sub.start_date, // Assuming start_date is the activation date
        })) || []

      // Store all active subscription IDs
      const activeSubscriptionIds = processedSubscriptions?.map((sub) => sub.subscription_id) || []

      // All courses respect day-wise schedule now
      const hasFullAvailability = false

      debugLog += `Active subscription IDs: ${JSON.stringify(activeSubscriptionIds)}\n`
      debugLog += `Has full availability: ${hasFullAvailability}\n`

      // Fetch all courses
      const { data: allCourses, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          batches: course_batches(
            id,
            batch_number,
            custom_batch_time,
            is_predefined_batch
          )
        `)
        .order("scheduled_date", { ascending: false })

      if (coursesError) throw coursesError

      console.log("[v0] Total courses fetched:", allCourses?.length)
      console.log("[v0] All courses:", allCourses)

      debugLog += `Total courses fetched: ${allCourses?.length || 0}\n`

      // Get courses for today based on the user's local date
      const todayData =
        allCourses?.filter((course) => {
          // Convert scheduled date to local date for comparison
          if (!course.scheduled_date) return false

          const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")
          const matchesDate = scheduledLocalDate === todayLocalDate

          console.log("[v0] Course:", course.title, "Scheduled:", scheduledLocalDate, "Matches today:", matchesDate)

          return matchesDate
        }) || []

      console.log("[v0] Today's courses after filtering:", todayData.length)
      console.log("[v0] Today's courses:", todayData)

      debugLog += `Today's courses: ${todayData.length}\n`

      // Get upcoming courses based on the user's local date
      const upcomingData =
        allCourses?.filter((course) => {
          // Convert scheduled date to local date for comparison
          if (!course.scheduled_date) return false

          const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")
          return scheduledLocalDate > todayLocalDate
        }) || []

      debugLog += `Upcoming courses: ${upcomingData.length}\n`

      // Fetch user's course attendance records
      const { data: userCourses, error: attendanceError } = await supabase
        .from("user_courses")
        .select("course_id, attended, completed_video")
        .eq("user_id", userId)

      if (attendanceError) throw attendanceError

      const attendanceMap = new Map()
      const completionMap = new Map()
      userCourses?.forEach((record) => {
        attendanceMap.set(record.course_id, record.attended)
        completionMap.set(record.course_id, record.completed_video)
      })

      // Process today's courses
      const processedTodayCourses = await Promise.all(
        todayData?.map(async (course) => {
          // Check if user has access to this course
          let hasAccess = false

          if (!course.subscription_id) {
            // Free course
            hasAccess = true
          } else if (course.scheduling_type === "subscription_day") {
            // Check access based on subscription day
            const userSubscription = processedSubscriptions.find(
              (sub) => sub.subscription_id === course.subscription_id,
            )
            if (userSubscription) {
              hasAccess = isCourseAvailableBySubscriptionDay(course, userSubscription)
            }
          } else if (activeSubscriptionIds.includes(course.subscription_id)) {
            // User has required subscription
            hasAccess = true
          }

          // For courses with subscription requirements, store which subscriptions give access
          let eligibleSubscriptions = []
          if (course.subscription_id) {
            eligibleSubscriptions =
              processedSubscriptions?.filter(
                (sub) => sub.subscription_id === course.subscription_id && sub.is_active,
              ) || []
          }

          // Check if user has already marked attendance
          const attended = attendanceMap.has(course.id) ? attendanceMap.get(course.id) : false
          const completedVideo = completionMap.has(course.id) ? completionMap.get(course.id) : false

          // Set default language if not specified
          const language = course.language || "English"

          let videoDuration = course.video_duration || 3600
          if (course.youtube_link && course.video_type === "youtube") {
            try {
              const actualDuration = await getYouTubeDuration(course.youtube_link)
              videoDuration = actualDuration
              console.log("[v0] Course:", course.title, "Actual YouTube duration:", videoDuration, "seconds")
            } catch (error) {
              console.error("[v0] Error getting duration for", course.title, error)
            }
          } else {
            console.log("[v0] Course:", course.title, "Using database duration:", videoDuration, "seconds")
          }

          return {
            ...course,
            hasAccess,
            eligibleSubscriptions,
            attended,
            completedVideo,
            language,
            videoDuration,
            batches: course.batches || [], // Use fetched batches
          }
        }) || [],
      )

      // Process upcoming courses
      const processedUpcomingCourses = await Promise.all(
        upcomingData?.map(async (course) => {
          let hasAccess = false

          if (!course.subscription_id) {
            // Free course
            hasAccess = true
          } else if (course.scheduling_type === "subscription_day") {
            // Check access based on subscription day
            const userSubscription = processedSubscriptions.find(
              (sub) => sub.subscription_id === course.subscription_id,
            )
            if (userSubscription) {
              hasAccess = isCourseAvailableBySubscriptionDay(course, userSubscription)
            }
          } else if (activeSubscriptionIds.includes(course.subscription_id)) {
            // User has required subscription
            hasAccess = true
          }

          // For courses with subscription requirements, store which subscriptions give access
          let eligibleSubscriptions = []
          if (course.subscription_id) {
            eligibleSubscriptions =
              processedSubscriptions?.filter(
                (sub) => sub.subscription_id === course.subscription_id && sub.is_active,
              ) || []
          }

          // Check if user has already marked attendance
          const attended = attendanceMap.has(course.id) ? attendanceMap.get(course.id) : false
          const completedVideo = completionMap.has(course.id) ? completionMap.get(course.id) : false

          // Set default language if not specified
          const language = course.language || "English"

          let videoDuration = course.video_duration || 3600
          if (course.youtube_link && course.video_type === "youtube") {
            try {
              const actualDuration = await getYouTubeDuration(course.youtube_link)
              videoDuration = actualDuration
              console.log("[v0] Upcoming course:", course.title, "Actual YouTube duration:", videoDuration, "seconds")
            } catch (error) {
              console.error("[v0] Error getting duration for upcoming course", course.title, error)
            }
          } else {
            console.log("[v0] Upcoming course:", course.title, "Using database duration:", videoDuration, "seconds")
          }

          return {
            ...course,
            hasAccess,
            eligibleSubscriptions,
            attended,
            completedVideo,
            language,
            videoDuration,
            batches: course.batches || [], // Use fetched batches
          }
        }) || [],
      )

      setTodayCourses(processedTodayCourses)
      setUpcomingCourses(processedUpcomingCourses)

      // Group today's courses
      const groupedToday = groupCourses(processedTodayCourses)
      setGroupedTodayCourses(groupedToday)

      // Group upcoming courses
      const groupedUpcoming = groupCourses(processedUpcomingCourses)
      setGroupedUpcomingCourses(groupedUpcoming)

      // Set available languages based on today's courses
      const languages = Array.from(new Set(groupedToday.map((course) => course.language)))
      setAvailableLanguages(languages.length > 0 ? languages : ["English"])

      // Set debug info
      debugLog += `Processed today's courses: ${processedTodayCourses.length}\n`
      debugLog += `Processed upcoming courses: ${processedUpcomingCourses.length}\n`
      debugLog += `Grouped today's courses: ${groupedToday.length}\n`
      debugLog += `Grouped upcoming courses: ${groupedUpcoming.length}\n`
      debugLog += `Available languages: ${languages.join(", ")}\n`

      setDebugInfo(debugLog)
    } catch (error: any) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again later.",
        variant: "destructive",
      })
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isCourseAvailableBySubscriptionDay = (course: GroupedCourse, userSubscription: any): boolean => {
    if (!course.scheduling_type || course.scheduling_type !== "subscription_day") {
      return true // Not using subscription day scheduling
    }

    if (!course.subscription_day || !userSubscription.activation_date) {
      return false // Missing required data
    }

    const activationDate = new Date(userSubscription.activation_date)
    const today = new Date()

    // Set both dates to start of day for accurate comparison
    activationDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const daysPassed = Math.floor((today.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24))

    // subscription_day in database is 1-based, but we count from Day 0
    // So if subscription_day is 1, it's available on Day 0 (activation date)
    // If subscription_day is 2, it's available on Day 1 (next day), etc.
    return daysPassed >= course.subscription_day - 1
  }

  return (
    <div className="container mx-auto p-6">
      {/* Hero section with background image */}
      <div
        className="relative bg-cover bg-center py-12 mb-8 rounded-lg overflow-hidden"
        style={{
          backgroundImage: "url('/images/yoga-pattern-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Your Yoga Journey</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Access your scheduled sessions and continue your practice
          </p>
        </div>
      </div>

      <div className="relative pb-12">
        {/* Tab navigation with animated indicator */}
        <div className="relative mb-8 bg-white rounded-lg shadow-md p-2 flex justify-center">
          <div className="flex space-x-2 relative z-10">
            <Button
              variant={viewMode === "today" ? "default" : "ghost"}
              onClick={() => setViewMode("today")}
              className="relative px-6 py-2 rounded-md transition-all duration-300"
              size="lg"
            >
              Today's Sessions
            </Button>
            <Button
              variant={viewMode === "upcoming" ? "default" : "ghost"}
              onClick={() => setViewMode("upcoming")}
              className="relative px-6 py-2 rounded-md transition-all duration-300"
              size="lg"
            >
              Upcoming Sessions
            </Button>
          </div>
        </div>

        {/* Debug information - only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-gray-100 rounded-md">
            <div className="flex items-center mb-2">
              <Bug className="h-4 w-4 mr-2" />
              <h3 className="font-medium">Debug Information</h3>
            </div>
            <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-200 rounded">{debugInfo}</pre>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading your sessions...</p>
          </div>
        ) : (
          <>
            {viewMode === "today" && groupedTodayCourses.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
                <Info className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-amber-800 mb-2">No Sessions Today</h3>
                <p className="text-amber-700">There are no yoga sessions scheduled for today.</p>
              </div>
            )}

            {viewMode === "upcoming" && groupedUpcomingCourses.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-blue-800 mb-2">No Upcoming Sessions</h3>
                <p className="text-blue-700">There are no upcoming yoga sessions scheduled at this time.</p>
              </div>
            )}

            {viewMode === "today" && groupedTodayCourses.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Today's Sessions</h2>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedTodayCourses
                    .filter((course) => course.language === selectedLanguage)
                    .map((course) => {
                      const activeBatch = findActiveBatch(course)
                      const isLive = activeBatch !== null
                      const hasEnded = activeBatch ? isSessionEnded(course, activeBatch) : false

                      // Check availability based on scheduling type
                      let isCourseAvailable = course.hasAccess // Default to existing hasAccess
                      if (course.scheduling_type === "subscription_day") {
                        const userSubscription = userSubscriptions.find((sub) => sub.id === course.subscription_id)
                        if (userSubscription) {
                          isCourseAvailable = isCourseAvailableBySubscriptionDay(course, userSubscription)
                        } else {
                          isCourseAvailable = false // User does not have the required subscription
                        }
                      } else if (course.subscription_id && !course.eligibleSubscriptions?.length) {
                        // If it requires a subscription but no eligible subscriptions found (e.g. expired)
                        isCourseAvailable = false
                      }

                      return (
                        <Card
                          key={`${course.title}_${course.scheduled_date}`}
                          className={`h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                            isLive && isCourseAvailable && !hasEnded
                              ? "border-green-400 shadow-green-100"
                              : hasEnded && isCourseAvailable
                                ? "border-yellow-400 shadow-yellow-100"
                                : isCourseAvailable
                                  ? "border-gray-200"
                                  : "border-red-200"
                          }`}
                        >
                          <div
                            className={`h-3 w-full ${
                              isLive && isCourseAvailable && !hasEnded
                                ? "bg-green-500"
                                : hasEnded && isCourseAvailable
                                  ? "bg-yellow-500"
                                  : isCourseAvailable
                                    ? "bg-gray-200"
                                    : "bg-red-500"
                            }`}
                          ></div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl">{course.title}</CardTitle>
                              {isLive && isCourseAvailable && !hasEnded ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full">
                                  LIVE NOW
                                </Badge>
                              ) : hasEnded && isCourseAvailable ? (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full">
                                  ENDED
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="px-3 py-1 rounded-full">
                                  {isCourseAvailable ? "OFFLINE" : "LOCKED"}
                                </Badge>
                              )}
                            </div>
                            {course.description && (
                              <CardDescription className="mt-2 text-sm">{course.description}</CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="flex-grow pt-2">
                            <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{formatDate(course.scheduled_date)}</span>
                            </div>

                            {/* Join Now button with enhanced styling */}
                            <Button
                              className={`w-full mb-4 py-6 text-base font-medium transition-all duration-300 ${
                                isLive && isCourseAvailable && !hasEnded
                                  ? "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
                                  : hasEnded && isCourseAvailable
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : ""
                              }`}
                              disabled={!isLive || !isCourseAvailable || hasEnded}
                              onClick={() => handleJoinSession(course)}
                            >
                              <PlayCircle className="mr-2 h-5 w-5" />
                              {hasEnded
                                ? "Session Ended"
                                : isLive && isCourseAvailable
                                  ? "Join Live Session"
                                  : "Unavailable"}
                            </Button>

                            <div className="space-y-3">
                              <h3 className="text-sm font-medium flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-primary" />
                                Batch Details:
                              </h3>
                              <div className="space-y-2">
                                {course.batches.map((batch) => {
                                  const batchIsLive = isSessionLive(course, batch)
                                  const timeUntil = getTimeUntilSession(course, batch)
                                  const batchHasEnded = isSessionEnded(course, batch)

                                  return (
                                    <div
                                      key={batch.id}
                                      className={`border rounded-md p-3 transition-all ${
                                        batchIsLive && isCourseAvailable
                                          ? "border-green-300 bg-green-50"
                                          : batchHasEnded && isCourseAvailable
                                            ? "border-yellow-300 bg-yellow-50"
                                            : isCourseAvailable
                                              ? "border-gray-200 hover:border-gray-300"
                                              : "border-red-200"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{getBatchDisplayName(batch)}</span>
                                        {batchIsLive && isCourseAvailable ? (
                                          <Badge className="bg-green-500 text-white">LIVE</Badge>
                                        ) : batchHasEnded && isCourseAvailable ? (
                                          <Badge className="bg-yellow-500 text-white">ENDED</Badge>
                                        ) : (
                                          <Badge variant="outline">OFFLINE</Badge>
                                        )}
                                      </div>

                                      {!batchIsLive && !batchHasEnded && timeUntil && isCourseAvailable && (
                                        <div className="flex items-center text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>Starts in {timeUntil}</span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </CardContent>

                          {!isCourseAvailable && (
                            <CardFooter className="pt-0 bg-amber-50">
                              <Alert className="w-full border-amber-300 bg-amber-50">
                                <AlertDescription className="text-sm flex items-center text-amber-800">
                                  <Info className="h-4 w-4 mr-2 text-amber-500" />
                                  {course.subscription_id ? "Subscription required for access" : "Access not available"}
                                </AlertDescription>
                              </Alert>
                            </CardFooter>
                          )}
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Upcoming Sessions with enhanced styling */}
            {viewMode === "upcoming" && (
              <>
                <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedUpcomingCourses.map((course) => {
                    // Check availability based on scheduling type
                    let isCourseAvailable = course.hasAccess // Default to existing hasAccess
                    if (course.scheduling_type === "subscription_day") {
                      const userSubscription = userSubscriptions.find((sub) => sub.id === course.subscription_id)
                      if (userSubscription) {
                        isCourseAvailable = isCourseAvailableBySubscriptionDay(course, userSubscription)
                      } else {
                        isCourseAvailable = false // User does not have the required subscription
                      }
                    } else if (course.subscription_id && !course.eligibleSubscriptions?.length) {
                      // If it requires a subscription but no eligible subscriptions found (e.g. expired)
                      isCourseAvailable = false
                    }

                    return (
                      <Card
                        key={`${course.title}_${course.scheduled_date}_${course.language}`}
                        className={`h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                          isCourseAvailable ? "border-blue-200" : "border-red-200"
                        }`}
                      >
                        <div className={`h-3 w-full ${isCourseAvailable ? "bg-blue-400" : "bg-red-400"}`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{course.title}</CardTitle>
                            <Badge
                              variant="outline"
                              className={
                                isCourseAvailable
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              }
                            >
                              {isCourseAvailable ? "UPCOMING" : "LOCKED"}
                            </Badge>
                          </div>
                          {course.description && (
                            <CardDescription className="mt-2 text-sm">{course.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="flex-grow pt-2">
                          <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{formatDate(course.scheduled_date)}</span>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-sm font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-blue-500" />
                              Batch Details:
                            </h3>
                            <div className="space-y-2">
                              {course.batches.map((batch) => (
                                <div
                                  key={batch.id}
                                  className={`border rounded-md p-3 transition-all ${
                                    isCourseAvailable
                                      ? "border-gray-200 hover:border-blue-300"
                                      : "border-red-200 hover:border-red-300"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getBatchDisplayName(batch)}</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        isCourseAvailable
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      }
                                    >
                                      {isCourseAvailable ? "SCHEDULED" : "LOCKED"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>

                        {!isCourseAvailable && (
                          <CardFooter className="pt-0 bg-amber-50">
                            <Alert className="w-full border-amber-300 bg-amber-50">
                              <AlertDescription className="text-sm flex items-center text-amber-800">
                                <Info className="h-4 w-4 mr-2 text-amber-500" />
                                {course.subscription_id ? "Subscription required for access" : "Access not available"}
                              </AlertDescription>
                            </Alert>
                          </CardFooter>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Initial WhatsApp Channel Notification */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Join Our WhatsApp Channel</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Stay updated with class schedules, announcements, and yoga tips!
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-green-50 p-4 rounded-lg mb-4 w-full">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600 mr-2"
                >
                  <path d="M3 7.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C21 5.28 21 6.12 21 7.8v8.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8Z"></path>
                  <path d="m7.5 12 3 3 6-6"></path>
                </svg>
                <span className="text-green-800">Get instant notifications</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4 w-full">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600 mr-2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                <span className="text-blue-800">Connect with your yoga community</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg w-full">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600 mr-2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-purple-800">Ask questions directly to instructors</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDismissWhatsApp} className="sm:w-1/2 bg-transparent">
              Remind Me Later
            </Button>
            <Button onClick={handleJoinWhatsApp} className="bg-green-600 hover:bg-green-700 sm:w-1/2">
              Join WhatsApp Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Selection Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Join Your WhatsApp Groups</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Select a subscription to join its WhatsApp group
            </DialogDescription>
          </DialogHeader>

          {loadingSubscriptions ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading your subscriptions...</p>
            </div>
          ) : userSubscriptions.length === 0 ? (
            <div className="py-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No WhatsApp Groups Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                None of your active subscriptions have WhatsApp groups set up.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md mb-4 flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>
                  You can access each WhatsApp group once for free. After that, you'll need to contact an admin for
                  additional access.
                </span>
              </p>

              {userSubscriptions.map((subscription) => {
                const accessCount = accessCounts[subscription.id.toString()] || 0
                const canAccess = accessCount < 1

                return (
                  <div key={subscription.id} className="border rounded-lg p-4 hover:border-green-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{subscription.name}</h3>
                      <Badge
                        className={
                          canAccess
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        {canAccess ? "Available" : "Access Used"}
                      </Badge>
                    </div>
                    {subscription.description && (
                      <p className="text-sm text-muted-foreground mb-3">{subscription.description}</p>
                    )}
                    <Button
                      onClick={() => handleSelectSubscription(subscription)}
                      className="w-full"
                      variant={canAccess ? "default" : "outline"}
                      disabled={!canAccess}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                        <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                        <path d="M9 14a5 5 0 0 0 6 0" />
                      </svg>
                      {canAccess ? "Join WhatsApp Group" : "Contact Admin for Access"}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSubscriptionDialog(false)
                localStorage.setItem("hasSeenWhatsAppNotification", "true")
              }}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AccessCoursePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccessCourseContent />
    </Suspense>
  )
}
