"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { cn, isValidYoutubeUrl } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { extractPosesFromVideo } from "@/lib/client-pose-extractor"

// Update the component to include multiple batches functionality and video type selection
export default function CreateCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [zoomMeetingId, setZoomMeetingId] = useState("")
  const [zoomPasscode, setZoomPasscode] = useState("")
  const [zoomJoinUrl, setZoomJoinUrl] = useState("") // Add state for Zoom join URL
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isPredefinedBatch, setIsPredefinedBatch] = useState(true)
  const [isScheduledSession, setIsScheduledSession] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [customBatches, setCustomBatches] = useState<{ id: string; time: string }[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"])
  const [subscriptions, setSubscriptions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dbConnectionStatus, setDbConnectionStatus] = useState<"unknown" | "success" | "error">("unknown")
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schedulingType, setSchedulingType] = useState<"date" | "day" | "week">("date")
  const [subscriptionDay, setSubscriptionDay] = useState<number>(1)
  const [subscriptionWeek, setSubscriptionWeek] = useState<number>(1)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())
  const [videoType, setVideoType] = useState<"youtube" | "zoom">("youtube")
  const [instructorVideoFile, setInstructorVideoFile] = useState<File | null>(null)
  const [processingPose, setProcessingPose] = useState(false)
  const [poseProgress, setPoseProgress] = useState(0)
  const [poseSessionId, setPoseSessionId] = useState<string | null>(null)
  const [poseError, setPoseError] = useState("")
  const [totalFramesUploaded, setTotalFramesUploaded] = useState(0)
  const [poseProcessingStatus, setPoseProcessingStatus] = useState("")
  const [instructorVideoUrl, setInstructorVideoUrl] = useState<string>("")

  const handleDateSelect = (date: Date | undefined) => {
    setScheduledDate(date)
  }

  // Available languages
  const availableLanguages = ["English", "Hindi", "Kannada"]

  // Generate a unique ID for custom batches
  const generateId = () => `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  useEffect(() => {
    fetchSubscriptions()

    // Check for subscription ID in URL query params
    const params = new URLSearchParams(window.location.search)
    const subscriptionParam = params.get("subscription")
    if (subscriptionParam) {
      // setSubscriptionId(subscriptionParam)
      // console.log(`Pre-selected subscription ID: ${subscriptionParam}`)
    }

    testDatabaseConnection()
  }, [])

  // Handle scheduled session toggle
  useEffect(() => {
    if (isScheduledSession) {
      // Select all predefined batches when scheduled session is enabled
      setSelectedBatches(["1", "2", "3", "4", "5", "6"])
      setIsPredefinedBatch(true)
    } else if (isPredefinedBatch) {
      // Reset to empty selection when turning off scheduled session
      setSelectedBatches([])
    }
  }, [isScheduledSession])

  // Test database connection
  async function testDatabaseConnection() {
    try {
      console.log("Testing database connection...")
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("courses").select("id").limit(1)

      if (error) {
        console.error("Database connection error:", error)
        setDbConnectionStatus("error")
        setDbErrorMessage(error.message)
        return false
      }

      console.log("Database connection successful, found courses:", data)
      setDbConnectionStatus("success")
      setDbErrorMessage(null)
      return true
    } catch (e) {
      console.error("Exception testing database:", e)
      setDbConnectionStatus("error")
      setDbErrorMessage(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  async function fetchSubscriptions() {
    try {
      console.log("Fetching subscriptions...")
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("id, name")

      if (error) {
        console.error("Error fetching subscriptions:", error)
        throw error
      }

      console.log("Fetched subscriptions:", data)
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Exception fetching subscriptions:", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Log all form values for debugging
    console.log("Validating form with values:", {
      title,
      youtubeLink,
      zoomMeetingId,
      date,
      selectedLanguages,
      isPredefinedBatch,
      selectedBatches,
      customBatches,
      videoType,
    })

    if (!title.trim()) newErrors.title = "Title is required"

    if (videoType === "youtube") {
      if (!youtubeLink.trim()) {
        newErrors.youtubeLink = "YouTube link is required"
      } else if (!isValidYoutubeUrl(youtubeLink)) {
        console.error("Invalid YouTube URL:", youtubeLink)
        newErrors.youtubeLink = "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=XXXX)"
      }
    } else if (videoType === "zoom") {
      if (!zoomMeetingId.trim()) {
        newErrors.zoom = "Zoom Meeting ID is required"
      }
    }

    if (!date) newErrors.date = "Date is required"
    if (selectedLanguages.length === 0) newErrors.languages = "Please select at least one language"

    if (isPredefinedBatch) {
      if (selectedBatches.length === 0) {
        newErrors.batches = "Please select at least one batch"
      }
    } else {
      if (customBatches.length === 0) {
        newErrors.customBatches = "Please add at least one custom batch time"
      } else {
        // Validate each custom batch
        const invalidBatches = customBatches.filter((batch) => !batch.time.trim())
        if (invalidBatches.length > 0) {
          newErrors.customBatches = "All custom batch times must be filled"
        }
      }
    }

    setErrors(newErrors)
    console.log("Validation errors:", newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addCustomBatch = () => {
    setCustomBatches([...customBatches, { id: generateId(), time: "" }])
  }

  const removeCustomBatch = (id: string) => {
    setCustomBatches(customBatches.filter((batch) => batch.id !== id))
  }

  const updateCustomBatchTime = (id: string, time: string) => {
    setCustomBatches(customBatches.map((batch) => (batch.id === id ? { ...batch, time } : batch)))
  }

  const handleBatchToggle = (batchNumber: string) => {
    if (selectedBatches.includes(batchNumber)) {
      setSelectedBatches(selectedBatches.filter((b) => b !== batchNumber))
    } else {
      setSelectedBatches([...selectedBatches, batchNumber])
    }
  }

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      // Only remove if it's not the last language
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== language))
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language])
    }
  }

  const processPoseVideo = async (videoFile: File) => {
    setProcessingPose(true)
    setPoseProcessingStatus("Starting pose extraction...")
    setPoseSessionId(null)

    try {
      const tempCourseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log("[v0] Generated temp course ID:", tempCourseId)

      let totalFramesUploaded = 0
      let sessionId: string | null = null

      const onProgress = (progress: number) => {
        setPoseProcessingStatus(`Processing video: ${progress.toFixed(0)}%`)
        console.log(`[v0] Extraction progress: ${progress.toFixed(1)}%`)
      }

      const onBatchReady = async (batch: any[]) => {
        console.log(`[v0] Uploading batch of ${batch.length} frames (total so far: ${totalFramesUploaded})`)

        const response = await fetch("/api/ai/save-pose-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: tempCourseId,
            videoName: videoFile.name,
            videoUrl: youtubeLink || instructorVideoUrl, // Use youtubeLink from form
            poses: batch,
            is_final: false,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to upload pose batch")
        }

        if (result.sessionId) {
          sessionId = result.sessionId
        }

        if (result.totalFrames) {
          totalFramesUploaded = result.totalFrames
          console.log(`[v0] Total frames now: ${totalFramesUploaded}`)
        }
      }

      await extractPosesFromVideo(videoFile, onProgress, onBatchReady)

      console.log(`[v0] Pose extraction complete. Session ID: ${sessionId}, Total frames: ${totalFramesUploaded}`)
      setPoseSessionId(sessionId)
      setPoseProgress(100)
    } catch (error) {
      console.error("[v0] Error processing pose video:", error)
      setPoseError(error instanceof Error ? error.message : "Failed to process video")
    } finally {
      setProcessingPose(false)
    }
  }

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPoseSessionId(null)
    setPoseError("")

    if (!file.type.startsWith("video/")) {
      setPoseError("Please select a valid video file")
      return
    }

    await processPoseVideo(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError("")

    try {
      console.log("[v0] Starting course creation...")
      console.log("[v0] Pose Session ID:", poseSessionId)

      if (videoType === "zoom" && !poseSessionId) {
        throw new Error("Please wait for pose extraction to complete or upload a valid video")
      }

      // Validate form
      if (!title) {
        throw new Error("Title is required")
      }

      if (videoType === "youtube") {
        if (!youtubeLink) {
          throw new Error("YouTube link is required")
        }

        if (!isValidYoutubeUrl(youtubeLink)) {
          throw new Error("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=XXXX)")
        }
      } else if (videoType === "zoom") {
        if (!zoomMeetingId) {
          throw new Error("Zoom Meeting ID is required")
        }
      }

      if (schedulingType === "date" && !scheduledDate) {
        throw new Error("Scheduled date is required")
      }

      if (schedulingType === "day" && (!subscriptionDay || subscriptionDay < 1)) {
        throw new Error("Valid subscription day is required")
      }

      if (schedulingType === "week" && (!subscriptionWeek || subscriptionWeek < 1)) {
        throw new Error("Valid subscription week is required")
      }

      // Prepare course data
      const courseData: any = {
        title,
        description,
        language: selectedLanguages[0], // Assuming only one language is selected
        scheduling_type: schedulingType,
        is_predefined_batch: isPredefinedBatch, // Set the is_predefined_batch flag
        video_type: videoType,
        instructor_pose_session_id: poseSessionId || null,
      }

      console.log("[v0] Course data prepared:", courseData)

      // Add the appropriate scheduling field based on type
      if (schedulingType === "date") {
        // Format date as YYYY-MM-DD in local timezone
        const year = scheduledDate.getFullYear()
        const month = String(scheduledDate.getMonth() + 1).padStart(2, "0")
        const day = String(scheduledDate.getDate()).padStart(2, "0")
        courseData.scheduled_date = `${year}-${month}-${day}`
        courseData.subscription_day = null
        courseData.subscription_week = null
      } else if (schedulingType === "day") {
        courseData.scheduled_date = null
        courseData.subscription_day = subscriptionDay
        courseData.subscription_week = null
      } else if (schedulingType === "week") {
        courseData.scheduled_date = null
        courseData.subscription_day = null
        courseData.subscription_week = subscriptionWeek
      }

      if (videoType === "youtube") {
        courseData.youtube_link = youtubeLink
        courseData.zoom_meeting_id = null
        courseData.zoom_passcode = null
        courseData.zoom_join_url = null
      } else if (videoType === "zoom") {
        courseData.youtube_link = null
        courseData.zoom_meeting_id = zoomMeetingId.replace(/[\s-]/g, "")
        courseData.zoom_passcode = zoomPasscode
        courseData.zoom_join_url = zoomJoinUrl || null
      }

      // Handle batch information based on whether it's predefined or custom
      if (isPredefinedBatch) {
        if (selectedBatches && selectedBatches.length > 0) {
          const courseEntries = []

          for (const batchNumber of selectedBatches) {
            const batchCourseData = {
              ...courseData,
              batch_number: batchNumber,
              custom_batch_time: null,
            }
            courseEntries.push(batchCourseData)
          }

          const { data, error } = await getSupabaseBrowserClient().from("courses").insert(courseEntries).select()

          if (error) throw error

          router.push("/admin/courses")
          return
        }
      } else {
        if (customBatches && customBatches.length > 0) {
          const courseEntries = []

          for (const batch of customBatches) {
            if (batch.time.trim()) {
              const customBatchCourseData = {
                ...courseData,
                batch_number: null,
                custom_batch_time: batch.time,
              }
              courseEntries.push(customBatchCourseData)
            }
          }

          const { data, error } = await getSupabaseBrowserClient().from("courses").insert(courseEntries).select()

          if (error) throw error

          router.push("/admin/courses")
          return
        }
      }

      const { data, error } = await getSupabaseBrowserClient().from("courses").insert([courseData]).select()

      if (error) throw error

      router.push("/admin/courses")
    } catch (error) {
      console.error("[v0] Course creation error:", error)
      setError(error instanceof Error ? error.message : "Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Create a new course for your users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Video Type</Label>
                <RadioGroup value={videoType} onValueChange={(value) => setVideoType(value as "youtube" | "zoom")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="youtube" id="youtube" />
                    <Label htmlFor="youtube" className="cursor-pointer">
                      YouTube Video
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zoom" id="zoom" />
                    <Label htmlFor="zoom" className="cursor-pointer">
                      Zoom Meeting
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* YouTube Link */}
              {videoType === "youtube" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeLink">YouTube Link *</Label>
                    <Input
                      id="youtubeLink"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    {errors.youtubeLink && <p className="text-sm text-red-600">{errors.youtubeLink}</p>}
                  </div>

                  {/* Instructor Video File */}
                  <div className="space-y-2">
                    <Label htmlFor="instructorVideo">Instructor Video File (Optional - for AI Pose Tracking)</Label>
                    <Input
                      id="instructorVideo"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={processingPose}
                    />
                    <p className="text-sm text-gray-500">
                      Upload the instructor video to enable AI pose tracking during live sessions. Video will be
                      processed and deleted - only pose data is stored.
                    </p>

                    {poseError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{poseError}</p>
                      </div>
                    )}

                    {processingPose && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{poseProcessingStatus}</span>
                          <span className="font-medium">{poseProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${poseProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {poseSessionId && !processingPose && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Pose data extracted successfully! AI tracking enabled for this course.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Zoom Meeting ID and Passcode */}
              {videoType === "zoom" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zoomMeetingId">Zoom Meeting ID *</Label>
                    <Input
                      id="zoomMeetingId"
                      value={zoomMeetingId}
                      onChange={(e) => setZoomMeetingId(e.target.value)}
                      placeholder="123-456-7890"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Get this from your Zoom meeting details (e.g., 123-456-7890)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zoomPasscode">Zoom Passcode (Optional)</Label>
                    <Input
                      id="zoomPasscode"
                      value={zoomPasscode}
                      onChange={(e) => setZoomPasscode(e.target.value)}
                      placeholder="abc123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zoomJoinUrl">Zoom Join URL (Optional - For Invite Link)</Label>
                    <Input
                      id="zoomJoinUrl"
                      value={zoomJoinUrl}
                      onChange={(e) => setZoomJoinUrl(e.target.value)}
                      placeholder="https://zoom.us/j/1234567890?pwd=..."
                      type="url"
                    />
                    <p className="text-sm text-gray-500">
                      Paste the Zoom invite link here. Used when Meeting SDK credentials are not available.
                    </p>
                  </div>
                  {errors.zoom && <p className="text-sm text-red-600">{errors.zoom}</p>}
                </div>
              )}

              {/* Language Selection - Updated to allow multiple languages */}
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {availableLanguages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={selectedLanguages.includes(language)}
                        onCheckedChange={() => handleLanguageToggle(language)}
                        disabled={selectedLanguages.length === 1 && selectedLanguages.includes(language)}
                      />
                      <Label htmlFor={`language-${language}`}>{language}</Label>
                    </div>
                  ))}
                </div>
                {errors.languages && <p className="text-sm text-red-500">{errors.languages}</p>}
              </div>

              {/* Add this new section right before the scheduled date field in the form */}
              <div className="space-y-2">
                <Label htmlFor="scheduling-type">Scheduling Type</Label>
                <Select
                  value={schedulingType}
                  onValueChange={(value) => setSchedulingType(value as "date" | "day" | "week")}
                >
                  <SelectTrigger id="scheduling-type">
                    <SelectValue placeholder="Select scheduling type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Specific Date</SelectItem>
                    <SelectItem value="day">Subscription Day</SelectItem>
                    <SelectItem value="week">Subscription Week</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Choose how this course should be scheduled for users</p>
              </div>

              {schedulingType === "date" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date</Label>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="scheduled-date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduledDate && "text-muted-foreground",
                          )}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={scheduledDate} onSelect={handleDateSelect} initialFocus />
                      </PopoverContent>
                    </Popover>

                    {/* Manual date input */}
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="manual-date">Or enter date manually (YYYY-MM-DD)</Label>
                      <Input
                        id="manual-date"
                        type="date"
                        value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value
                          if (dateValue) {
                            setScheduledDate(new Date(dateValue))
                          }
                        }}
                      />
                    </div>

                    {/* Time input */}
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="manual-time">Time (optional)</Label>
                      <Input
                        id="manual-time"
                        type="time"
                        onChange={(e) => {
                          const timeValue = e.target.value
                          if (timeValue && scheduledDate) {
                            const [hours, minutes] = timeValue.split(":").map(Number)
                            const newDate = new Date(scheduledDate)
                            newDate.setHours(hours, minutes)
                            setScheduledDate(newDate)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {schedulingType === "day" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-day">Subscription Day</Label>
                  <Input
                    id="subscription-day"
                    type="number"
                    min="1"
                    value={subscriptionDay}
                    onChange={(e) => setSubscriptionDay(Number.parseInt(e.target.value) || 1)}
                    placeholder="Day number (e.g., 1, 2, 3...)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Day number from when user starts subscription (Day 1, Day 2, etc.)
                  </p>
                </div>
              )}

              {schedulingType === "week" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-week">Subscription Week</Label>
                  <Input
                    id="subscription-week"
                    type="number"
                    min="1"
                    value={subscriptionWeek}
                    onChange={(e) => setSubscriptionWeek(Number.parseInt(e.target.value) || 1)}
                    placeholder="Week number (e.g., 1, 2, 3...)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Week number from when user starts subscription (Week 1, Week 2, etc.)
                  </p>
                </div>
              )}

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="predefined-batch"
                    checked={isPredefinedBatch}
                    onCheckedChange={(checked) => {
                      setIsPredefinedBatch(checked)
                      if (checked) {
                        setIsScheduledSession(false)
                      }
                    }}
                  />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {isPredefinedBatch && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="scheduled-session"
                        checked={isScheduledSession}
                        onCheckedChange={setIsScheduledSession}
                      />
                      <Label htmlFor="scheduled-session">This is a scheduled session (all batches)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Batches</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-1"
                            checked={selectedBatches.includes("1")}
                            onCheckedChange={() => handleBatchToggle("1")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-1">Morning Batch 1 (5:30 to 6:30)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-2"
                            checked={selectedBatches.includes("2")}
                            onCheckedChange={() => handleBatchToggle("2")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-2">Morning Batch 2 (6:40 to 7:40)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-3"
                            checked={selectedBatches.includes("3")}
                            onCheckedChange={() => handleBatchToggle("3")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-3">Morning Batch 3 (7:50 to 8:50)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-4"
                            checked={selectedBatches.includes("4")}
                            onCheckedChange={() => handleBatchToggle("4")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-4">Evening Batch 4 (5:30 to 6:30)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-5"
                            checked={selectedBatches.includes("5")}
                            onCheckedChange={() => handleBatchToggle("5")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-5">Evening Batch 5 (6:40 to 7:40)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-6"
                            checked={selectedBatches.includes("6")}
                            onCheckedChange={() => handleBatchToggle("6")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-6">Evening Batch 6 (7:50 to 8:50)</Label>
                        </div>
                      </div>
                      {errors.batches && <p className="text-sm text-red-500">{errors.batches}</p>}
                    </div>
                  </div>
                )}

                {!isPredefinedBatch && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Custom Batch Times</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          addCustomBatch()
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Batch
                      </Button>
                    </div>

                    {customBatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No custom batches added yet. Click "Add Batch" to create one.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {customBatches.map((batch) => (
                          <div key={batch.id} className="flex items-center gap-2">
                            <Input
                              value={batch.time}
                              onChange={(e) => updateCustomBatchTime(batch.id, e.target.value)}
                              placeholder="e.g., 9:00 AM to 10:00 AM"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault()
                                removeCustomBatch(batch.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.customBatches && <p className="text-sm text-red-500">{errors.customBatches}</p>}
                  </div>
                )}
              </div>

              {/* Multiple Subscription Selection */}
              <div className="space-y-2">
                <Label htmlFor="subscriptions">Subscriptions (Optional)</Label>
                <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="no-subscription"
                      checked={selectedSubscriptions.includes("none")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubscriptions(["none"])
                        } else {
                          setSelectedSubscriptions([])
                        }
                      }}
                    />
                    <Label htmlFor="no-subscription">No subscription required</Label>
                  </div>
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`subscription-${subscription.id}`}
                        checked={selectedSubscriptions.includes(subscription.id.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubscriptions((prev) =>
                              prev.filter((id) => id !== "none").concat(subscription.id.toString()),
                            )
                          } else {
                            setSelectedSubscriptions((prev) => prev.filter((id) => id !== subscription.id.toString()))
                          }
                        }}
                        disabled={selectedSubscriptions.includes("none")}
                      />
                      <Label htmlFor={`subscription-${subscription.id}`}>{subscription.name}</Label>
                    </div>
                  ))}
                </div>
                {selectedSubscriptions.length > 0 && !selectedSubscriptions.includes("none") && (
                  <p className="text-sm text-blue-600 mt-1">
                    This course will be created for {selectedSubscriptions.length} selected subscription plan(s).
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/courses")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  dbConnectionStatus === "error" ||
                  isSubmitting ||
                  processingPose ||
                  (videoType === "zoom" && !poseSessionId)
                }
              >
                {processingPose ? "Processing Video..." : isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
