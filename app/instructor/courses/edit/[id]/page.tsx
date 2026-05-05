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
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn, isValidYoutubeUrl } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function EditCourse({ params }: { params: { id: string } }) {
  const router = useRouter()
  const courseId = Number.parseInt(params.id)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [instructorId, setInstructorId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_link: "",
    language: "English",
    scheduling_type: "date" as "date" | "day" | "week",
    scheduled_date: undefined as Date | undefined,
    subscription_day: 1,
    subscription_week: 1,
    is_predefined_batch: true,
    batch_number: "",
    custom_batch_time: "",
    subscription_id: null as number | null,
  })

  const [subscriptions, setSubscriptions] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    const id = localStorage.getItem("instructorId")
    setInstructorId(id ? Number.parseInt(id) : null)

    if (id) {
      fetchCourse()
      fetchSubscriptions()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()
      const instructorId = localStorage.getItem("instructorId")

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("instructor_id", instructorId) // Ensure instructor can only edit their own courses
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          youtube_link: data.youtube_link || "",
          language: data.language || "English",
          scheduling_type: data.scheduling_type || "date",
          scheduled_date: data.scheduled_date ? new Date(data.scheduled_date) : undefined,
          subscription_day: data.subscription_day || 1,
          subscription_week: data.subscription_week || 1,
          is_predefined_batch: data.is_predefined_batch || true,
          batch_number: data.batch_number || "",
          custom_batch_time: data.custom_batch_time || "",
          subscription_id: data.subscription_id || null,
        })
      }
    } catch (error) {
      console.error("Error fetching course:", error)
      setError("Failed to load course data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name").eq("is_active", true)

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.youtube_link) {
      setError("Title and YouTube link are required")
      return
    }

    if (!isValidYoutubeUrl(formData.youtube_link)) {
      setError("Please enter a valid YouTube URL")
      return
    }

    try {
      setSaving(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        youtube_link: formData.youtube_link,
        language: formData.language,
        scheduling_type: formData.scheduling_type,
        is_predefined_batch: formData.is_predefined_batch,
        batch_number: formData.is_predefined_batch ? formData.batch_number : null,
        custom_batch_time: !formData.is_predefined_batch ? formData.custom_batch_time : null,
        subscription_id: formData.subscription_id,
      }

      // Add scheduling fields based on type
      if (formData.scheduling_type === "date") {
        updateData.scheduled_date = formData.scheduled_date ? formData.scheduled_date.toISOString().split("T")[0] : null
        updateData.subscription_day = null
        updateData.subscription_week = null
      } else if (formData.scheduling_type === "day") {
        updateData.scheduled_date = null
        updateData.subscription_day = formData.subscription_day
        updateData.subscription_week = null
      } else if (formData.scheduling_type === "week") {
        updateData.scheduled_date = null
        updateData.subscription_day = null
        updateData.subscription_week = formData.subscription_week
      }

      const { error } = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId)
        .eq("instructor_id", instructorId) // Ensure instructor can only update their own courses

      if (error) throw error

      setSuccess("Course updated successfully!")
      setTimeout(() => {
        router.push("/instructor/courses")
      }, 1500)
    } catch (error) {
      console.error("Error updating course:", error)
      setError("Failed to update course")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/instructor/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Course</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Update your course information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter course title"
                />
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>

              {/* YouTube Link */}
              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Video Link</Label>
                <Input
                  id="youtubeLink"
                  value={formData.youtube_link}
                  onChange={(e) => handleChange("youtube_link", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleChange("language", value)}>
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
                  value={formData.scheduling_type}
                  onValueChange={(value) => handleChange("scheduling_type", value)}
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
              {formData.scheduling_type === "date" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.scheduled_date && "text-muted-foreground",
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduled_date ? format(formData.scheduled_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => handleChange("scheduled_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {formData.scheduling_type === "day" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-day">Subscription Day</Label>
                  <Input
                    id="subscription-day"
                    type="number"
                    min="1"
                    value={formData.subscription_day}
                    onChange={(e) => handleChange("subscription_day", Number.parseInt(e.target.value) || 1)}
                    placeholder="Day number (e.g., 1, 2, 3...)"
                  />
                </div>
              )}

              {formData.scheduling_type === "week" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-week">Subscription Week</Label>
                  <Input
                    id="subscription-week"
                    type="number"
                    min="1"
                    value={formData.subscription_week}
                    onChange={(e) => handleChange("subscription_week", Number.parseInt(e.target.value) || 1)}
                    placeholder="Week number (e.g., 1, 2, 3...)"
                  />
                </div>
              )}

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="predefined-batch"
                    checked={formData.is_predefined_batch}
                    onCheckedChange={(checked) => handleChange("is_predefined_batch", checked)}
                  />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {formData.is_predefined_batch ? (
                  <div className="space-y-2">
                    <Label htmlFor="batch-number">Select Batch</Label>
                    <Select
                      value={formData.batch_number}
                      onValueChange={(value) => handleChange("batch_number", value)}
                    >
                      <SelectTrigger id="batch-number">
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                        <SelectItem value="2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                        <SelectItem value="3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                        <SelectItem value="4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                        <SelectItem value="5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                        <SelectItem value="6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="custom-batch">Custom Batch Time</Label>
                    <Input
                      id="custom-batch"
                      value={formData.custom_batch_time}
                      onChange={(e) => handleChange("custom_batch_time", e.target.value)}
                      placeholder="e.g., 9:00 AM to 10:00 AM"
                    />
                  </div>
                )}
              </div>

              {/* Subscription Selection */}
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription (Optional)</Label>
                <Select
                  value={formData.subscription_id?.toString() || "none"}
                  onValueChange={(value) =>
                    handleChange("subscription_id", value === "none" ? null : Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="subscription">
                    <SelectValue placeholder="No subscription required" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subscription required</SelectItem>
                    {subscriptions.map((subscription) => (
                      <SelectItem key={subscription.id} value={subscription.id.toString()}>
                        {subscription.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/instructor/courses")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </InstructorLayout>
  )
}
