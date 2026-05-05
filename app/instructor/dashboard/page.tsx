"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { InstructorLayout } from "@/components/instructor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    upcomingCourses: 0,
    todayCourses: 0,
    totalNotifications: 0,
    totalDocuments: 0,
  })
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [instructorName, setInstructorName] = useState("")
  const [instructorId, setInstructorId] = useState<number | null>(null)

  useEffect(() => {
    const name = localStorage.getItem("instructorName") || ""
    const id = localStorage.getItem("instructorId")

    setInstructorName(name)
    setInstructorId(id ? Number.parseInt(id) : null)

    if (id) {
      fetchDashboardData(Number.parseInt(id))
    }
  }, [])

  const fetchDashboardData = async (instructorId: number) => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const today = new Date().toISOString().split("T")[0]

      // Fetch all stats in parallel for better performance
      const [
        totalCoursesResult,
        upcomingCoursesResult,
        todayCoursesResult,
        recentCoursesResult,
        notificationsResult,
        documentsResult,
      ] = await Promise.all([
        // Total courses by this instructor
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor"),

        // Upcoming courses by this instructor
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor")
          .gt("scheduled_date", today),

        // Today's courses by this instructor
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor")
          .eq("scheduled_date", today),

        // Recent courses by this instructor for display
        supabase
          .from("courses")
          .select("*")
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor")
          .order("scheduled_date", { ascending: false })
          .limit(5),

        // Total notifications by this instructor
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor"),

        // Total documents by this instructor
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("created_by_type", "instructor"),
      ])

      setStats({
        totalCourses: totalCoursesResult.count || 0,
        upcomingCourses: upcomingCoursesResult.count || 0,
        todayCourses: todayCoursesResult.count || 0,
        totalNotifications: notificationsResult.count || 0,
        totalDocuments: documentsResult.count || 0,
      })

      setRecentCourses(recentCoursesResult.data || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {instructorName}
          </h1>
          <p className="opacity-90">Welcome to your instructor dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Courses"
            value={stats.totalCourses.toString()}
            icon={<BookOpen className="h-5 w-5 text-green-600" />}
            description="Courses you've created"
            loading={loading}
          />

          <StatsCard
            title="Upcoming Courses"
            value={stats.upcomingCourses.toString()}
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            description="Scheduled for future dates"
            loading={loading}
          />

          <StatsCard
            title="Today's Courses"
            value={stats.todayCourses.toString()}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            description="Scheduled for today"
            loading={loading}
          />

          <StatsCard
            title="Notifications"
            value={stats.totalNotifications.toString()}
            icon={<Bell className="h-5 w-5 text-purple-600" />}
            description="Notifications sent"
            loading={loading}
          />

          <StatsCard
            title="Documents"
            value={stats.totalDocuments.toString()}
            icon={<FileText className="h-5 w-5 text-indigo-600" />}
            description="Documents uploaded"
            loading={loading}
          />
        </div>

        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Courses</CardTitle>
              <CardDescription>Your recently created courses</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/instructor/courses">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : recentCourses.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500">You haven't created any courses yet</p>
                <Button asChild className="mt-4">
                  <Link href="/instructor/courses/create">Create Your First Course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{format(new Date(course.scheduled_date), "MMM d, yyyy")}</span>
                        {course.language && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{course.language}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/instructor/courses/edit/${course.id}`}>Edit</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/instructor/courses/create">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create New Course
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/instructor/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Send Notification
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/instructor/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Documents
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/instructor/profile">
                  <User className="mr-2 h-4 w-4" />
                  Update Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Help & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Need assistance with your instructor account or have questions about creating courses?
              </p>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p className="font-medium">Contact Admin</p>
                <p className="text-gray-500 mt-1">Email: sthavishtah2024@gmail.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </InstructorLayout>
  )
}

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  loading: boolean
}

function StatsCard({ title, value, icon, description, loading }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="m13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}
