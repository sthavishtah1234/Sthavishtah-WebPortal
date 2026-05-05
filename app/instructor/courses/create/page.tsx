"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InstructorLayout } from "@/components/instructor-layout"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InstructorCreateCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [isPredefinedBatch, setIsPredefinedBatch] = useState(true)
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [customBatches, setCustomBatches] = useState<{ id: string; time: string }[]>([])
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [language, setLanguage] = useState("English")
  const [availableSubscriptions, setAvailableSubscriptions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [instructorId, setInstructorId] = useState<number | null>(null)
  const [schedulingType, setSchedulingType] = useState<"date" | "day" | "week">("date")
  const [subscriptionDay, setSubscriptionDay] = useState<number>(1)
  const [subscriptionWeek, setSubscriptionWeek] = useState<number>(1)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())
  const [instructorVideoFile, setInstructorVideoFile] = useState<File | null>(null)
  const [processingPose, setProcessingPose] = useState(false)
  const [poseProgress, setPoseProgress] = useState(0)
  const [poseSessionId, setPoseSessionId] = useState<string | null>(null)
  const [poseError, setPoseError] = useState<string | null>(null)

  const generateId = () => `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  useEffect(() => {
    const id = localStorage.getItem("instructorId")
    setInstructorId(id ? Number.parseInt(id) : null)
    if (id) {
      fetchInstructorSubscriptions(Number.parseInt(id))
    }

    // Check for subscription ID in URL query params
    const params = new URLSearchParams(window.location.search)
    const subscriptionParam = params.get("subscription")
    if (subscriptionParam) {
      setSubscriptionId(subscriptionParam)
    }
  }, [])

  async function fetchInstructorSubscriptions(instructorId: number) {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get subscriptions that this instructor has access to
      const { data: accessData, error: accessError } = await supabase
        .from("instructor_subscription_access")
        .select(`
          subscription_id,
          subscriptions (
            id,
            name,
            is_active
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("is_active", true)

      if (accessError) {
        console.error("Error fetching instructor subscription access:", accessError)
        // Fallback: show all active subscriptions if access table doesn't exist or has issues
        const { data: allSubs, error: allSubsError } = await supabase
          .from("subscriptions")
          .select("id, name")
          .eq("is_active", true)

        if (!allSubsError) {
          setAvailableSubscriptions(allSubs || [])
        }
        return
      }

      // Extract subscriptions from the join
      const subscriptions =
        accessData
          ?.map((item) => item.subscriptions)
          .filter((sub) => sub && sub.is_active)
          .map((sub) => ({ id: sub.id, name: sub.name })) || []

      setAvailableSubscriptions(subscriptions)
    } catch (error) {
      console.error("Error fetching instructor subscriptions:", error)
      // Fallback: try to get all subscriptions
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.from("subscriptions").select("id, name").eq("is_active", true)
        if (!error) {
          setAvailableSubscriptions(data || [])
        }
      } catch (fallbackError) {
        console.error("Fallback subscription fetch failed:", fallbackError)
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setScheduledDate(date)
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!youtubeLink.trim()) {
      newErrors.youtubeLink = "YouTube link is required"
    } else if (!isValidYoutubeUrl(youtubeLink)) {
      newErrors.youtubeLink = "Please enter a valid YouTube URL"
    }

    if (schedulingType === "date" && !scheduledDate) {
      newErrors.date = "Date is required"
    }

    if (isPredefinedBatch) {
      if (selectedBatches.length === 0) {
        newErrors.batches = "Please select at least one batch"
      }
    } else {
      if (customBatches.length === 0) {
        newErrors.customBatches = "Please add at least one custom batch time"
      } else {
        const invalidBatches = customBatches.filter((batch) => !batch.time.trim())
        if (invalidBatches.length > 0) {
          newErrors.customBatches = "All custom batch times must be filled"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const processPoseVideo = async (videoFile: File) => {
    try {
      setProcessingPose(true)
      setPoseError(null)
      setPoseProgress(0)

      const { ClientPoseExtractor } = await import("@/lib/client-pose-extractor")
      const extractor = new ClientPoseExtractor()

      let courseId = `temp_${Date.now()}`
      let isFirstBatch = true

      // Extract poses with incremental batch uploads
      const poses = await extractor.extractPosesFromVideo(
        videoFile,
        (progress) => {
          setPoseProgress(Math.round(progress))
        },
        async (batch) => {
          // Upload each batch immediately as it's extracted
          console.log(`[v0] Uploading batch of ${batch.length} poses`)

          const response = await fetch("/api/ai/save-pose-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId,
              videoName: videoFile.name,
              poses: batch,
              isFirstChunk: isFirstBatch,
              isLastChunk: false,
            }),
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          if (isFirstBatch) {
            courseId = result.courseId
            isFirstBatch = false
          }
        },
      )

      // Mark as complete
      await fetch("/api/ai/save-pose-session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          totalFrames: poses.length,
        }),
      })

      setPoseSessionId(courseId)
      setPoseProgress(100)
      return courseId
    } catch (error: any) {
      console.error("Pose processing error:", error)
      setPoseError(error.message || "Failed to process video")
      throw error
    } finally {
      setProcessingPose(false)
    }
  }

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      setPoseError("Please upload a valid video file")
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setPoseError("Video file too large (max 500MB)")
      return
    }

    setInstructorVideoFile(file)

    try {
      await processPoseVideo(file)
    } catch (error) {
      console.error("Failed to process pose video:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !instructorId) return

    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const courseData: any = {
        title,
        description,
        youtube_link: youtubeLink,
        language,
        scheduling_type: schedulingType,
        instructor_id: instructorId,
        is_predefined_batch: isPredefinedBatch,
        instructor_pose_session_id: poseSessionId || null,
      }

      const courseEntries = []

      if (isPredefinedBatch) {
        for (const batchNumber of selectedBatches) {
          courseEntries.push({
            ...courseData,
            batch_number: batchNumber,
            custom_batch_time: null,
          })
        }
      } else {
        for (const batch of customBatches) {
          if (batch.time.trim()) {
            courseEntries.push({
              ...courseData,
              batch_number: null,
              custom_batch_time: batch.time,
            })
          }
        }
      }

      const { data, error } = await supabase.from("courses").insert(courseEntries).select()

      if (error) throw error

      router.push("/instructor/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      setErrors({ submit: "Failed to create course. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <InstructorLayout>
      <div className="container mx-auto p-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Create a new course for your students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

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

              {/* YouTube Link */}
              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Video Link</Label>
                <Input
                  id="youtubeLink"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.youtubeLink && <p className="text-sm text-red-500">{errors.youtubeLink}</p>}
              </div>

              {/* Instructor Video File (Optional - for AI Pose Tracking) */}
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
                  Upload the instructor video to enable AI pose tracking during live sessions. Video will be processed
                  and deleted - only pose data is stored.
                </p>

                {poseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{poseError}</p>
                  </div>
                )}

                {processingPose && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Extracting poses from video...</span>
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

              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Kannada">Kannada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduling Type */}
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
              </div>

              {/* Date/Day/Week Fields */}
              {schedulingType === "date" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
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
                  {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
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
                </div>
              )}

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="predefined-batch" checked={isPredefinedBatch} onCheckedChange={setIsPredefinedBatch} />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {isPredefinedBatch ? (
                  <div className="space-y-2">
                    <Label>Select Batches</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { id: "1", label: "Morning Batch 1 (5:30 to 6:30)" },
                        { id: "2", label: "Morning Batch 2 (6:40 to 7:40)" },
                        { id: "3", label: "Morning Batch 3 (7:50 to 8:50)" },
                        { id: "4", label: "Evening Batch 4 (5:30 to 6:30)" },
                        { id: "5", label: "Evening Batch 5 (6:40 to 7:40)" },
                        { id: "6", label: "Evening Batch 6 (7:50 to 8:50)" },
                      ].map((batch) => (
                        <div key={batch.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`batch-${batch.id}`}
                            checked={selectedBatches.includes(batch.id)}
                            onCheckedChange={() => handleBatchToggle(batch.id)}
                          />
                          <Label htmlFor={`batch-${batch.id}`}>{batch.label}</Label>
                        </div>
                      ))}
                    </div>
                    {errors.batches && <p className="text-sm text-red-500">{errors.batches}</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Custom Batch Times</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCustomBatch}>
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
                              onClick={() => removeCustomBatch(batch.id)}
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

              {/* Subscription Selection - Only show subscriptions instructor has access to */}
              <div className="space-y-2">
                <Label htmlFor="subscription">Available Subscription Plans</Label>
                {availableSubscriptions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No subscription plans available. Contact admin to get access to subscription plans.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={subscriptionId || ""} onValueChange={setSubscriptionId}>
                    <SelectTrigger id="subscription">
                      <SelectValue placeholder="No subscription required" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subscription required</SelectItem>
                      {availableSubscriptions.map((subscription) => (
                        <SelectItem key={subscription.id} value={subscription.id.toString()}>
                          {subscription.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/instructor/courses")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || processingPose}>
                {processingPose ? "Processing Video..." : loading ? "Creating..." : "Create Course"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </InstructorLayout>
  )
}
