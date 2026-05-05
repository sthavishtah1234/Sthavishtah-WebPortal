"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  FileText,
  Bell,
  Mail,
  Layers,
  Pencil,
  Plus,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Video,
  BookOpen,
  UserPlus,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  payment_link: string | null
  is_external_link: boolean
  created_at: string
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean
  full_availability?: boolean
}

interface User {
  id: string
  email: string
  name: string
  phone?: string
  created_at: string
  subscription_start?: string
  subscription_end?: string
  is_active?: boolean
}

interface Batch {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  user_count: number
}

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  batch_number: string | null
  custom_batch_time: string | null
  is_predefined_batch: boolean
  created_at: string
  view_count: number
}

export default function SubscriptionDashboard() {
  const router = useRouter()
  const params = useParams()
  const subscriptionId = params.id as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [userCount, setUserCount] = useState(0)
  const [batchCount, setBatchCount] = useState(0)
  const [courseCount, setCourseCount] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscriptionData()
    }
  }, [subscriptionId, refreshTrigger])

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    })
  }

  async function fetchSubscriptionData() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch subscription details
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single()

      if (subscriptionError) throw subscriptionError
      setSubscription(subscriptionData)

      // Fetch users with this subscription
      const { data: userData, error: userError } = await supabase
        .from("user_subscriptions")
        .select(`
          user_id,
          start_date,
          end_date,
          is_active,
          users:user_id (
            id,
            email,
            name,
            created_at
          )
        `)
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(10)

      if (userError) throw userError

      const processedUsers = userData.map((item) => ({
        id: item.users.id,
        email: item.users.email,
        name: item.users.name,
        phone: item.users.phone || "N/A", // Handle missing phone field
        created_at: item.users.created_at,
        subscription_start: item.start_date,
        subscription_end: item.end_date,
        is_active: item.is_active,
      }))

      setUsers(processedUsers)

      // Get total user count
      const { count: totalUserCount, error: countError } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)

      if (countError) throw countError
      setUserCount(totalUserCount || 0)

      // Fetch batches for this subscription
      const { data: batchData, error: batchError } = await supabase
        .from("subscription_batches")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (batchError) {
        console.error("Error fetching batches:", batchError)
        // Don't throw, just set empty array
        setBatches([])
        setBatchCount(0)
      } else {
        // For each batch, get the user count
        const batchesWithUserCount = await Promise.all(
          batchData.map(async (batch) => {
            const { count, error } = await supabase
              .from("user_batch_subscriptions")
              .select("*", { count: "exact", head: true })
              .eq("batch_id", batch.id)

            return {
              ...batch,
              user_count: count || 0,
            }
          }),
        )

        setBatches(batchesWithUserCount)
        setBatchCount(batchesWithUserCount.length)
      }

      // Fetch courses for this subscription
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("scheduled_date", { ascending: false })
        .limit(5)

      if (courseError) {
        console.error("Error fetching courses:", courseError)
        // Don't throw, just set empty array
        setCourses([])
        setCourseCount(0)
      } else {
        // For each course, get the view count
        const coursesWithViewCount = await Promise.all(
          courseData.map(async (course) => {
            const { count, error } = await supabase
              .from("user_courses")
              .select("*", { count: "exact", head: true })
              .eq("course_id", course.id)

            return {
              ...course,
              view_count: count || 0,
            }
          }),
        )

        setCourses(coursesWithViewCount)
        setCourseCount(coursesWithViewCount.length)
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function toggleSubscriptionActivation(currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this subscription plan?`))
      return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscriptions")
        .update({ is_active: !currentStatus })
        .eq("id", subscriptionId)

      if (error) throw error

      // Refresh the subscription data
      fetchSubscriptionData()

      toast({
        title: `Subscription ${currentStatus ? "deactivated" : "activated"}`,
        description: `The subscription has been ${currentStatus ? "deactivated" : "activated"} successfully.`,
      })
    } catch (error) {
      console.error("Error toggling subscription activation:", error)
      toast({
        title: "Error",
        description: "Failed to update subscription status. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function toggleFullAvailability(currentStatus: boolean) {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscriptions")
        .update({ full_availability: !currentStatus })
        .eq("id", subscriptionId)

      if (error) throw error

      // Refresh the subscription data
      fetchSubscriptionData()

      toast({
        title: `Full Availability ${currentStatus ? "Disabled" : "Enabled"}`,
        description: `Full course availability has been ${currentStatus ? "disabled" : "enabled"} for this subscription.`,
      })
    } catch (error) {
      console.error("Error toggling full availability:", error)
      toast({
        title: "Error",
        description: "Failed to update full availability status. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-lg text-muted-foreground">Loading subscription data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!subscription) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Subscription not found. Please check the subscription ID and try again.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/admin/subscriptions")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
        </Button>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/subscriptions")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{subscription.name}</h1>
          </div>
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {/* Subscription Overview Card */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{subscription.name}</CardTitle>
                <CardDescription className="text-white text-opacity-90 mt-1">
                  ₹{subscription.price.toFixed(2)} for {subscription.duration_days} days
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-white border-white">
                  {userCount} Users
                </Badge>
                <Badge variant="outline" className="text-white border-white">
                  {batchCount} Batches
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Subscription Period</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {subscription.start_date
                      ? format(new Date(subscription.start_date), "MMM d, yyyy")
                      : "No start date"}{" "}
                    - {subscription.end_date ? format(new Date(subscription.end_date), "MMM d, yyyy") : "No end date"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">₹{(subscription.price * userCount).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={subscription.is_external_link ? "outline" : "default"}>
                    {subscription.is_external_link ? "External Link" : "Online Payment"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Activation Status</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={subscription?.is_active || false}
                    onCheckedChange={() => toggleSubscriptionActivation(subscription?.is_active || false)}
                  />
                  <span className={subscription?.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {subscription?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Full Availability</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={subscription?.full_availability || false}
                    onCheckedChange={() => toggleFullAvailability(subscription?.full_availability || false)}
                  />
                  <span
                    className={
                      subscription?.full_availability ? "text-green-600 font-medium" : "text-gray-600 font-medium"
                    }
                  >
                    {subscription?.full_availability ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.full_availability
                    ? "All courses are available until 10 days after subscription expiry"
                    : "Only the previous two classes are available"}
                </p>
              </div>
            </div>

            {subscription.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{subscription.description}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-4">
            <div className="flex flex-wrap gap-2 w-full">
              <Button variant="outline" onClick={() => router.push(`/admin/subscriptions/edit/${subscription.id}`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Subscription
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/email?subscription=${subscription.id}`)}>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/notifications?subscription=${subscription.id}`)}
              >
                <Bell className="mr-2 h-4 w-4" /> Send Notification
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Users Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" /> Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{userCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Active subscribers</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                  >
                    View All Users
                  </Button>
                </CardFooter>
              </Card>

              {/* Batches Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Layers className="mr-2 h-5 w-5 text-primary" /> Batches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{batchCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Active batches</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}
                  >
                    Manage Batches
                  </Button>
                </CardFooter>
              </Card>

              {/* Courses Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Video className="mr-2 h-5 w-5 text-primary" /> Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{courseCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Associated courses</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/admin/courses?subscription=${subscription.id}`)}
                  >
                    View All Courses
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => router.push(`/admin/courses/create?subscription=${subscription.id}`)}
                  >
                    <Video className="h-6 w-6 mb-2" />
                    <span className="font-medium">Create Course</span>
                    <span className="text-xs text-muted-foreground mt-1">Add a new course to this subscription</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}
                  >
                    <Layers className="h-6 w-6 mb-2" />
                    <span className="font-medium">Manage Batches</span>
                    <span className="text-xs text-muted-foreground mt-1">Create and manage batches</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                  >
                    <UserPlus className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Users</span>
                    <span className="text-xs text-muted-foreground mt-1">Add users to this subscription</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => router.push(`/admin/documents?subscription=${subscription.id}`)}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Documents</span>
                    <span className="text-xs text-muted-foreground mt-1">Upload documents for subscribers</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => router.push(`/admin/bulk-registration?subscription=${subscription.id}`)}
                  >
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="font-medium">Bulk Registration</span>
                    <span className="text-xs text-muted-foreground mt-1">Register multiple users at once</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center bg-transparent"
                    onClick={() => {
                      // This would be implemented to export user data
                      toast({
                        title: "Export Started",
                        description: "User data export is being prepared",
                      })
                    }}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span className="font-medium">Export Users</span>
                    <span className="text-xs text-muted-foreground mt-1">Download user data as CSV</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Subscription Users</h2>
              <div className="flex space-x-2">
                <Button onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}>
                  <Users className="mr-2 h-4 w-4" /> View All Users
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/bulk-registration?subscription=${subscription.id}`)}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Users
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No users found for this subscription
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "N/A"}</TableCell>
                          <TableCell>
                            {user.subscription_start ? format(new Date(user.subscription_start), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {user.subscription_end ? format(new Date(user.subscription_end), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {users.length > 0 && (
                <CardFooter className="flex justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {users.length} of {userCount} users
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                  >
                    View All Users
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Subscription Batches</h2>
              <Button onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}>
                <Plus className="mr-2 h-4 w-4" /> Create Batch
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No batches found for this subscription
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.name}</TableCell>
                          <TableCell>{format(new Date(batch.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {batch.end_date ? format(new Date(batch.end_date), "MMM d, yyyy") : "No end date"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{batch.user_count}</Badge>
                          </TableCell>
                          <TableCell>
                            {batch.is_active ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span>Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                <span>Inactive</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/subscriptions/batches/users/${batch.id}`)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {batches.length > 0 && (
                <CardFooter className="flex justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {batches.length} of {batchCount} batches
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}
                  >
                    Manage All Batches
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Subscription Courses</h2>
              <Button onClick={() => router.push(`/admin/courses/create?subscription=${subscription.id}`)}>
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No courses found for this subscription
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{format(new Date(course.scheduled_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{course.language || "English"}</TableCell>
                          <TableCell>
                            {course.is_predefined_batch
                              ? `Batch ${course.batch_number}`
                              : course.custom_batch_time || "Custom"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.view_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/courses/view/${course.id}`)}
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {courses.length > 0 && (
                <CardFooter className="flex justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {courses.length} of {courseCount} courses
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/courses?subscription=${subscription.id}`)}
                  >
                    View All Courses
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
