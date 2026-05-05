"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Bell, BookOpenCheck, CreditCard, RefreshCw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalNotifications: number
  upcomingCourses: number
  subscriptionStats: {
    basic: number
    premium: number
    pro: number
    total: number
  }
  revenueStats: {
    monthly: number
    quarterly: number
    annual: number
  }
  videoStats: {
    totalViews: number
    completionRate: number
    mostViewedTitle: string
    mostViewedCount: number
  }
}

interface SubscriptionData {
  name: string
  count: number
  revenue: number
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalNotifications: 0,
    upcomingCourses: 0,
    subscriptionStats: {
      basic: 0,
      premium: 0,
      pro: 0,
      total: 0,
    },
    revenueStats: {
      monthly: 0,
      quarterly: 0,
      annual: 0,
    },
    videoStats: {
      totalViews: 0,
      completionRate: 0,
      mostViewedTitle: "",
      mostViewedCount: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([])
  const [monthlyGrowth, setMonthlyGrowth] = useState<{ month: string; count: number; percentage: number }[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setErrors([])
      const supabase = getSupabaseBrowserClient()
      const newErrors: string[] = []

      // Get total users
      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })

      if (userError) {
        console.error("Error fetching users:", userError)
        newErrors.push(`Error fetching users: ${userError.message}`)
      }

      // Get total courses
      const { count: courseCount, error: courseError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })

      if (courseError) {
        console.error("Error fetching courses:", courseError)
        newErrors.push(`Error fetching courses: ${courseError.message}`)
      }

      // Get total notifications
      const { count: notificationCount, error: notificationError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })

      if (notificationError) {
        console.error("Error fetching notifications:", notificationError)
        newErrors.push(`Error fetching notifications: ${notificationError.message}`)
      }

      // Get upcoming courses
      const today = new Date().toISOString().split("T")[0]
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_date", today)

      if (upcomingError) {
        console.error("Error fetching upcoming courses:", upcomingError)
        newErrors.push(`Error fetching upcoming courses: ${upcomingError.message}`)
      }

      // Get subscription data
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          subscription_id,
          is_active,
          subscriptions (
            id,
            name,
            price
          )
        `)
        .eq("is_active", true)

      if (subscriptionError) {
        console.error("Error fetching subscriptions:", subscriptionError)
        newErrors.push(`Error fetching subscriptions: ${subscriptionError.message}`)
      }

      // Get video analytics
      let videoStats = {
        totalViews: 0,
        completionRate: 0,
        mostViewedTitle: "",
        mostViewedCount: 0,
      }

      const { data: coursesWithUserData, error: coursesError } = await supabase.from("courses").select(`
          id,
          title,
          user_courses (
            id,
            attended,
            completed_video
          )
        `)

      if (coursesError) {
        console.error("Error fetching courses with user data:", coursesError)
        newErrors.push(`Error fetching courses with user data: ${coursesError.message}`)
      } else if (coursesWithUserData) {
        const courseStats = coursesWithUserData.map((course) => {
          const views = course.user_courses ? course.user_courses.filter((uc) => uc.attended).length : 0
          const completions = course.user_courses ? course.user_courses.filter((uc) => uc.completed_video).length : 0

          return {
            title: course.title,
            views,
            completions,
          }
        })

        let totalViews = 0
        let totalCompletions = 0
        let mostViewedTitle = ""
        let mostViewedCount = 0

        courseStats.forEach((course) => {
          totalViews += course.views
          totalCompletions += course.completions

          if (course.views > mostViewedCount) {
            mostViewedCount = course.views
            mostViewedTitle = course.title
          }
        })

        const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0

        videoStats = {
          totalViews,
          completionRate,
          mostViewedTitle,
          mostViewedCount,
        }
      }

      // Process subscription data
      const subscriptionCounts = {}
      const subscriptionRevenue = {}
      let totalRevenue = 0

      if (subscriptions && subscriptions.length > 0) {
        subscriptions.forEach((sub) => {
          const name = sub.subscriptions?.name || "Unknown"
          const price = sub.subscriptions?.price || 0

          subscriptionCounts[name] = (subscriptionCounts[name] || 0) + 1
          subscriptionRevenue[name] = (subscriptionRevenue[name] || 0) + price
          totalRevenue += price
        })
      }

      const subData = Object.keys(subscriptionCounts).map((name, index) => {
        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]
        return {
          name,
          count: subscriptionCounts[name],
          revenue: subscriptionRevenue[name],
          color: colors[index % colors.length],
        }
      })

      setSubscriptionData(subData)

      const basicCount = subscriptionCounts["Basic"] || 0
      const premiumCount = subscriptionCounts["Premium"] || 0
      const proCount = subscriptionCounts["Pro"] || 0
      const totalSubs = basicCount + premiumCount + proCount

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalNotifications: notificationCount || 0,
        upcomingCourses: upcomingCount || 0,
        subscriptionStats: {
          basic: basicCount,
          premium: premiumCount,
          pro: proCount,
          total: totalSubs,
        },
        revenueStats: {
          monthly: totalRevenue,
          quarterly: totalRevenue * 3,
          annual: totalRevenue * 12,
        },
        videoStats,
      })

      if (newErrors.length > 0) {
        setErrors(newErrors)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setErrors([`General error: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={() => fetchDashboardData()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Error display */}
        {errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h3 className="font-bold text-red-600 mb-2">Errors:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    {error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Main stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Courses created in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active classes in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalNotifications}</div>
              <p className="text-xs text-muted-foreground">Notifications sent to users</p>
            </CardContent>
          </Card>
        </div>

        {/* Video Analytics Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Video Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Total Views</h3>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.videoStats.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Across all videos</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Completion Rate</h3>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : `${stats.videoStats.completionRate.toFixed(1)}%`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Average across all videos</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Most Viewed</h3>
                  <p className="text-lg font-medium">
                    {loading ? "..." : stats.videoStats.mostViewedTitle || "No data"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {loading ? "..." : `${stats.videoStats.mostViewedCount} views`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/admin/analytics/video">View Detailed Analytics</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscription Analytics</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Active Subscriptions</h3>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.subscriptionStats.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Currently active</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Monthly Revenue</h3>
                  <p className="text-2xl font-bold">₹{loading ? "..." : stats.revenueStats.monthly.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Annual Projection</h3>
                  <p className="text-2xl font-bold">₹{loading ? "..." : stats.revenueStats.annual.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Based on current subscriptions</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button asChild variant="outline">
                  <Link href="/admin/subscriptions">Manage Subscriptions</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
