"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock, Globe, Tag } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
  batch_number: string | null
  custom_batch_time: string | null
  is_predefined_batch: boolean
  subscription?: {
    name: string
    price: number
  }
}

export default function CourseView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const courseId = Number.parseInt(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  async function fetchCourseDetails() {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          subscription:subscription_id (
            name,
            price
          )
        `,
        )
        .eq("id", courseId)
        .single()

      if (error) throw error

      setCourse(data)
      fetchEnrolledUsers(data.subscription_id)
    } catch (err: any) {
      console.error("Error fetching course details:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEnrolledUsers(subscriptionId: number | null) {
    if (!subscriptionId) return

    try {
      setLoadingUsers(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          id,
          user:user_id (
            id,
            name,
            email
          ),
          start_date,
          end_date,
          is_active
        `,
        )
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)
        .order("start_date", { ascending: false })

      if (error) throw error

      setEnrolledUsers(data || [])
    } catch (err) {
      console.error("Error fetching enrolled users:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  function getBatchLabel(course: Course): string {
    if (course.is_predefined_batch && course.batch_number) {
      const batchNum = Number.parseInt(course.batch_number)
      if (batchNum === 1) return "Morning Batch 1 (5:30 to 6:30)"
      if (batchNum === 2) return "Morning Batch 2 (6:40 to 7:40)"
      if (batchNum === 3) return "Morning Batch 3 (7:50 to 8:50)"
      if (batchNum === 4) return "Evening Batch 4 (5:30 to 6:30)"
      if (batchNum === 5) return "Evening Batch 5 (6:40 to 7:40)"
      if (batchNum === 6) return "Evening Batch 6 (7:50 to 8:50)"
      return `Batch ${course.batch_number}`
    } else if (course.custom_batch_time) {
      return course.custom_batch_time
    }
    return "No batch specified"
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !course) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Course not found"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{course.title}</h1>
        </div>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="users">Enrolled Users</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>Details about this course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.description && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-700">{course.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Scheduled Date
                    </div>
                    <p className="font-medium">{format(new Date(course.scheduled_date), "MMMM d, yyyy")}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      Batch Time
                    </div>
                    <p className="font-medium">{getBatchLabel(course)}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="h-4 w-4 mr-2" />
                      Language
                    </div>
                    <p className="font-medium">{course.language}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Tag className="h-4 w-4 mr-2" />
                      Subscription
                    </div>
                    {course.subscription ? (
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{course.subscription.name}</p>
                        <Badge>₹{course.subscription.price}</Badge>
                      </div>
                    ) : (
                      <Badge variant="outline">No subscription required</Badge>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Video Preview</h3>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    {course.youtube_link ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${course.youtube_link.split("v=")[1]}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="w-full h-full"
                      ></iframe>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No video link available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Users</CardTitle>
                <CardDescription>Users who have access to this course through subscription</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
                  </div>
                ) : enrolledUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users are currently enrolled in this course.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscription Start
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscription End
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrolledUsers.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{enrollment.user?.name || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>{enrollment.user?.email || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {enrollment.start_date ? format(new Date(enrollment.start_date), "MMM d, yyyy") : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {enrollment.end_date ? format(new Date(enrollment.end_date), "MMM d, yyyy") : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/courses/edit/${course.id}`)}>
            Edit Course
          </Button>
          <Button onClick={() => router.push("/admin/courses")}>Back to Courses</Button>
        </div>
      </div>
    </AdminLayout>
  )
}
