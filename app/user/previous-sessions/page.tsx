"use client"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { PlayCircle, Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/hooks/use-toast"

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  is_predefined_batch: boolean
  batch_number: string | null
  custom_batch_time: string | null
  language: string
}

interface GroupedCourse {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  batches: {
    id: number
    is_predefined_batch: boolean
    batch_number: string | null
    custom_batch_time: string | null
  }[]
}

export default function PreviousSessions() {
  const [previousCourses, setPreviousCourses] = useState<Course[]>([])
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPreviousSessions()
  }, [])

  // Group courses by title, date, and language
  const groupCourses = (courses: Course[]): GroupedCourse[] => {
    const grouped: { [key: string]: GroupedCourse } = {}

    courses.forEach((course) => {
      // Create a unique key for each course group
      const key = `${course.title}_${course.scheduled_date}_${course.language}`

      if (!grouped[key]) {
        grouped[key] = {
          id: course.id, // Use the first course's ID
          title: course.title,
          description: course.description,
          youtube_link: course.youtube_link,
          scheduled_date: course.scheduled_date,
          language: course.language || "English",
          batches: [],
        }
      }

      // Add this batch to the course
      grouped[key].batches.push({
        id: course.id,
        batch_number: course.batch_number,
        custom_batch_time: course.custom_batch_time,
        is_predefined_batch: course.is_predefined_batch,
      })
    })

    return Object.values(grouped)
  }

  async function fetchPreviousSessions() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const supabase = getSupabaseBrowserClient()

      // First, get the user's active subscriptions
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

      // Check if any subscription has full_availability enabled
      const hasFullAvailability = false

      // Calculate dates for fetching previous sessions
      const today = new Date()

      let startDate: Date
      if (hasFullAvailability) {
        // If full availability is enabled, get all courses until subscription end + 10 days
        // Find the latest subscription end date
        const latestEndDate = userSubscriptions?.reduce((latest, sub) => {
          if (!sub.end_date) return latest
          const endDate = new Date(sub.end_date)
          // Add 10 days to the end date
          endDate.setDate(endDate.getDate() + 10)
          return endDate > latest ? endDate : latest
        }, new Date(0))

        // If we have a valid end date, use it, otherwise default to 2 days ago
        if (latestEndDate && latestEndDate > new Date(0)) {
          startDate = new Date(0) // Start from the beginning of time
        } else {
          // Default to 2 days ago if no valid subscription end date
          startDate = new Date(today)
          startDate.setDate(today.getDate() - 2)
        }
      } else {
        // If full availability is disabled, only show the previous 2 days
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 2)
      }

      // Format dates as YYYY-MM-DD
      const todayFormatted = today.toLocaleDateString("en-CA")
      const startDateFormatted = startDate.toLocaleDateString("en-CA")

      // Get all active subscription IDs
      const activeSubscriptionIds = userSubscriptions?.map((sub) => sub.subscription_id) || []

      // Fetch courses based on the date range and subscription access
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .or(
          `subscription_id.is.null,${
            activeSubscriptionIds.length > 0 ? `subscription_id.in.(${activeSubscriptionIds.join(",")})` : ""
          }`,
        )
        .lte("scheduled_date", todayFormatted) // Less than or equal to today (only past sessions)
        .gte("scheduled_date", hasFullAvailability ? "1970-01-01" : startDateFormatted) // All past sessions or just last 2 days
        .order("scheduled_date", { ascending: false })

      if (error) throw error

      const filteredData =
        data?.filter((course) => {
          const scheduledDate = new Date(course.scheduled_date)
          const now = new Date()

          // Get the batch end time
          const batchEndTime = new Date(scheduledDate)

          if (course.is_predefined_batch && course.batch_number) {
            const batchNum = Number.parseInt(course.batch_number)
            let endHour = 0
            let endMinute = 0

            // Calculate end times (each batch is 60 minutes)
            if (batchNum === 1) {
              endHour = 6
              endMinute = 30
            } else if (batchNum === 2) {
              endHour = 7
              endMinute = 40
            } else if (batchNum === 3) {
              endHour = 8
              endMinute = 50
            } else if (batchNum === 4) {
              endHour = 18
              endMinute = 30
            } else if (batchNum === 5) {
              endHour = 19
              endMinute = 40
            } else if (batchNum === 6) {
              endHour = 20
              endMinute = 50
            }

            batchEndTime.setHours(endHour, endMinute, 0, 0)
          } else if (course.custom_batch_time) {
            const timeMatch = course.custom_batch_time.match(/(\d+):(\d+)\s*(AM|PM)/)
            if (timeMatch) {
              let hours = Number.parseInt(timeMatch[1])
              const minutes = Number.parseInt(timeMatch[2])
              const period = timeMatch[3]

              if (period === "PM" && hours !== 12) hours += 12
              if (period === "AM" && hours === 12) hours = 0

              batchEndTime.setHours(hours, minutes + 60, 0, 0) // Add 60 minutes duration
            }
          }

          // Only show if the batch end time has passed
          return now > batchEndTime
        }) || []

      setPreviousCourses(filteredData)

      // Group courses by title, date, and language
      const grouped = groupCourses(filteredData)
      setGroupedCourses(grouped)
    } catch (error) {
      console.error("Error fetching previous sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load previous sessions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Toggle expanded state for a course
  const toggleExpanded = (courseId: number) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null)
    } else {
      setExpandedCourseId(courseId)
    }
  }

  // Handle watching a previous session
  const handleWatchSession = (courseId: number) => {
    router.push(`/user/video-player/${courseId}`)
  }

  // Get batch time display
  const getBatchTimeDisplay = (course: GroupedCourse) => {
    if (course.batches.length === 0) return "No batch information"

    const batch = course.batches[0]
    if (batch.is_predefined_batch && batch.batch_number) {
      return `Batch ${batch.batch_number}`
    } else if (!batch.is_predefined_batch && batch.custom_batch_time) {
      return batch.custom_batch_time
    }
    return "Time not specified"
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Hero section with background */}
        <div
          className="relative bg-cover bg-center py-12 mb-8 rounded-xl overflow-hidden"
          style={{
            backgroundImage: "url('/images/forest-pattern-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="container relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Previous Sessions</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {groupedCourses.length > 0
                ? "Watch your past yoga sessions anytime"
                : "Watch any sessions from the past two days that you may have missed"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-muted-foreground">Loading previous sessions...</p>
          </div>
        ) : groupedCourses.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-medium text-amber-800 mb-2">No Previous Sessions Available</h3>
            <p className="text-amber-700 max-w-md mx-auto">
              There aren't any past sessions available for you to watch right now.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                {groupedCourses.map((course) => (
                  <Collapsible
                    key={`${course.title}_${course.scheduled_date}_${course.language}`}
                    open={expandedCourseId === course.id}
                    onOpenChange={() => toggleExpanded(course.id)}
                    className="border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left">
                        <div>
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(course.scheduled_date)}</span>
                            <Badge variant="outline" className="ml-2 bg-white">
                              {course.language}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="default"
                            size="sm"
                            className="mr-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWatchSession(course.id)
                            }}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            View Session
                          </Button>
                          <Button variant="ghost" size="sm">
                            {expandedCourseId === course.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className="p-4">
                        {course.description && (
                          <p className="mb-6 text-gray-700 italic border-l-4 border-gray-200 pl-3">
                            {course.description}
                          </p>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                            <span className="text-gray-700">Date: {formatDate(course.scheduled_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-gray-500" />
                            <span className="text-gray-700">Time: {getBatchTimeDisplay(course)}</span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {course.language}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <Button
                            variant="default"
                            className="flex items-center"
                            onClick={() => handleWatchSession(course.id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            View Session
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </TabsContent>

              <TabsContent value="grid" className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedCourses.map((course) => (
                    <Card
                      key={`${course.title}_${course.scheduled_date}_${course.language}`}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Session Thumbnail */}
                      <div className="relative aspect-video bg-gradient-to-r from-purple-100 to-blue-100 overflow-hidden flex items-center justify-center">
                        <div className="text-center p-4">
                          <h3 className="text-xl font-semibold text-gray-800">{course.title}</h3>
                          <p className="text-sm text-gray-600 mt-2">{formatDate(course.scheduled_date)}</p>
                        </div>
                      </div>

                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{course.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(course.scheduled_date)}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {course.language}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {course.description && (
                          <p className="mb-4 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{getBatchTimeDisplay(course)}</span>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0">
                        <Button className="w-full" onClick={() => handleWatchSession(course.id)}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          View Session
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
