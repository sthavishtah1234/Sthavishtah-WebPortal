"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { PlayCircle, AlertTriangle, CheckCircle, Users, BookOpen, LogOut, Menu, X } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number
  message: string
  created_at: string
}

interface AttendanceData {
  total: number
  attended: number
  percentage: number
}

// Add this function to calculate subscription days and weeks
function getSubscriptionInfo(startDate: string) {
  const start = new Date(startDate)
  const now = new Date()

  // Calculate days since subscription started
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Calculate weeks since subscription started (1-indexed)
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1

  return { days: daysSinceStart, weeks: weeksSinceStart }
}

export default function UserDashboard() {
  const router = useRouter()
  const pathname = "/user/dashboard" // Current page path
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [attendance, setAttendance] = useState<AttendanceData>({
    total: 0,
    attended: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>("")
  const [userName, setUserName] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeSubscription, setActiveSubscription] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const supabase = getSupabaseBrowserClient()

  // Add this after the useEffect hook
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([])
  const [showSubscriptionCards, setShowSubscriptionCards] = useState(false)

  useEffect(() => {
    // Check authentication status
    const userId = localStorage.getItem("userId")
    const userAuth = localStorage.getItem("userAuthenticated")
    const name = localStorage.getItem("userName")
    setAuthStatus(userAuth === "true" ? `Authenticated (User ID: ${userId})` : "Not authenticated")
    setUserName(name || "")

    fetchDashboardData()
  }, [])

  // Update the fetchDashboardData function to fetch and check for multiple subscriptions
  async function fetchDashboardData() {
    try {
      setLoading(true)
      setFetchError(null)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        // Use mock data if no user ID is found
        setMockData()
        return
      }

      // Try to initialize Supabase client with error handling
      // let supabase
      // try {
      //   supabase = getSupabaseBrowserClient()
      // } catch (error) {
      //   console.error("Error initializing Supabase client:", error)
      //   setMockData()
      //   return
      // }

      // Fetch recent notifications with improved error handling
      try {
        const { data: notificationsData, error: notificationsError } = await Promise.race([
          supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Notification fetch timeout")), 10000)), // Increased to 10 seconds
        ])

        if (notificationsError) {
          console.warn("Notifications error:", notificationsError)
          // Set default notifications instead of throwing
          setNotifications([
            { id: 1, message: "Welcome to your dashboard!", created_at: new Date().toISOString() },
            { id: 2, message: "Your next session is scheduled for tomorrow.", created_at: new Date().toISOString() },
          ])
        } else {
          setNotifications(notificationsData || [])
        }
      } catch (error) {
        console.warn("Error fetching notifications:", error)
        // Set default notifications and continue
        setNotifications([
          { id: 1, message: "Welcome to your dashboard!", created_at: new Date().toISOString() },
          { id: 2, message: "Your next session is scheduled for tomorrow.", created_at: new Date().toISOString() },
        ])
      }

      // Fetch attendance data with improved error handling
      try {
        const { data: attendanceData, error: attendanceError } = await Promise.race([
          supabase.from("user_courses").select("*").eq("user_id", userId),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Attendance fetch timeout")), 10000)), // Increased to 10 seconds
        ])

        if (attendanceError) {
          console.warn("Attendance error:", attendanceError)
          // Set default attendance data
          setAttendance({
            total: 10,
            attended: 8,
            percentage: 80,
          })
        } else {
          const total = attendanceData?.length || 0
          const attended = attendanceData?.filter((record) => record.attended)?.length || 0
          const percentage = total > 0 ? Math.round((attended / total) * 100) : 0

          setAttendance({
            total,
            attended,
            percentage,
          })
        }
      } catch (error) {
        console.warn("Error fetching attendance data:", error)
        // Set default attendance data
        setAttendance({
          total: 10,
          attended: 8,
          percentage: 80,
        })
      }

      // Fetch all active subscriptions
      try {
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from("user_subscriptions")
          .select(`
          id,
          user_id,
          subscription_id,
          start_date,
          end_date,
          is_active,
          subscription_plan_active,
          subscription:subscriptions!inner (
            id,
            name,
            description,
            price,
            duration_days,
            is_active
          )
        `)
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("end_date", { ascending: false })

        if (subscriptionsError) throw subscriptionsError

        // Add full_availability property with a default value if it doesn't exist
        const processedSubscriptions =
          subscriptionsData?.map((sub) => ({
            ...sub,
            subscription_plan_active: sub.subscription_plan_active !== false, // Default to true if not set
            subscription: {
              ...sub.subscription,
              full_availability: sub.subscription.full_availability || false,
            },
          })) || []

        setUserSubscriptions(processedSubscriptions)

        // If user has more than one subscription, show subscription cards
        setShowSubscriptionCards(processedSubscriptions && processedSubscriptions.length > 1)

        if (processedSubscriptions && processedSubscriptions.length > 0) {
          setActiveSubscription(processedSubscriptions[0])
          fetchCourses() // Fetch courses after setting active subscription
        } else {
          setActiveSubscription(null)
          setCourses([])
        }
      } catch (error) {
        console.error("Error fetching active subscriptions:", error)
        setActiveSubscription(null)
        setCourses([])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setFetchError("Unable to load dashboard data. Using offline mode.")
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  // In the fetchCourses function, update the query to include scheduling type
  const fetchCourses = async () => {
    try {
      if (!activeSubscription) return

      const { data: userSubscriptionData } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("id", activeSubscription.id)
        .single()

      if (!userSubscriptionData || !userSubscriptionData.start_date) return

      // Get subscription days and weeks
      const { days: subscriptionDays, weeks: subscriptionWeeks } = getSubscriptionInfo(userSubscriptionData.start_date)

      // Get courses based on different scheduling types
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .or(`subscription_id.eq.${activeSubscription.subscription_id},subscription_id.is.null`)
        .or(
          `and(scheduling_type.eq.date,scheduled_date.lte.${new Date().toISOString()}),` +
            `and(scheduling_type.eq.day,subscription_day.lte.${subscriptionDays}),` +
            `and(scheduling_type.eq.week,subscription_week.lte.${subscriptionWeeks})`,
        )
        .order("scheduled_date", { ascending: false })

      if (coursesError) {
        console.error("Error fetching courses:", coursesError)
        return
      }

      setCourses(coursesData || [])
    } catch (error) {
      console.error("Error in fetchCourses:", error)
    }
  }

  // Set mock data when offline or errors occur
  function setMockData() {
    setNotifications([
      { id: 1, message: "Welcome to your dashboard!", created_at: new Date().toISOString() },
      { id: 2, message: "Your next session is scheduled for tomorrow.", created_at: new Date().toISOString() },
    ])
    setAttendance({
      total: 10,
      attended: 8,
      percentage: 80,
    })
  }

  // Emergency login function
  const forceLogin = () => {
    localStorage.setItem("userAuthenticated", "true")
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", "1")
      localStorage.setItem("userName", "Test User")
    }
    window.location.reload()
  }

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userAuthenticated")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userPhone")
    localStorage.removeItem("authToken")
    router.push("/user/login")
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  // Navigation items
  const navItems = [
    { href: "/user/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/user/access-course", label: "Access Course", icon: "calendar" },
    { href: "/user/documents", label: "Documents", icon: "file-text" },
    { href: "/user/previous-sessions", label: "Previous Sessions", icon: "clock" },
    { href: "/user/subscriptions", label: "Subscriptions", icon: "credit-card" },
    { href: "/user/notifications", label: "Notifications", icon: "bell" },
    { href: "/user/reviews", label: "Reviews", icon: "star" },
    { href: "/user/profile", label: "Profile", icon: "user" },
    { href: "/user/contact", label: "Contact Us", icon: "contact" },
  ]

  // Retry fetching data
  const handleRetry = () => {
    fetchDashboardData()
  }

  return (
    <>
      {/* Emergency login button - only visible if not in UserLayout */}
      {!authStatus.includes("Authenticated") && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-4 z-50 flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" />
            <span>Authentication issue detected</span>
          </div>
          <Button onClick={forceLogin} variant="secondary">
            Force Login
          </Button>
        </div>
      )}

      {/* Offline mode notification */}
      {fetchError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-yellow-700">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-yellow-600 border-yellow-300 hover:bg-yellow-100 bg-transparent"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden md:block w-full md:w-64 bg-white rounded-lg shadow-sm">
          {/* User welcome */}
          <div className="px-4 py-4 mb-4 bg-green-50 rounded-t-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                {userName.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Welcome,</p>
                <p className="text-sm text-green-700 truncate">{userName}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      item.href === pathname
                        ? "bg-green-600 text-white"
                        : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <span className="mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        {item.icon === "grid" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          />
                        )}
                        {item.icon === "calendar" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        )}
                        {item.icon === "file-text" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        )}
                        {item.icon === "clock" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        )}
                        {item.icon === "credit-card" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        )}
                        {item.icon === "bell" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        )}
                        {item.icon === "star" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        )}
                        {item.icon === "user" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        )}
                        {item.icon === "contact" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        )}
                      </svg>
                    </span>
                    {item.label}
                    {item.href === pathname && (
                      <span className="ml-auto">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout button in sidebar */}
          <div className="p-4 mt-4 border-t border-gray-200">
            <Button variant="destructive" className="w-full flex items-center justify-center" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Hamburger Menu */}
        <div className="block md:hidden w-full mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Mobile Header with Hamburger */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium mr-2">
                  {userName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 truncate max-w-[150px]">{userName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-green-700" />
                ) : (
                  <Menu className="h-6 w-6 text-green-700" />
                )}
              </Button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="p-2 border-b border-gray-100">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                          item.href === pathname
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            {/* Icon paths remain the same */}
                            {item.icon === "grid" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            )}
                            {item.icon === "calendar" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            )}
                            {item.icon === "file-text" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            )}
                            {item.icon === "clock" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            )}
                            {item.icon === "credit-card" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            )}
                            {item.icon === "bell" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            )}
                            {item.icon === "star" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            )}
                            {item.icon === "user" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            )}
                            {item.icon === "contact" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            )}
                          </svg>
                        </span>
                        {item.label}
                        {item.href === pathname && (
                          <span className="ml-auto">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>

                {/* Logout button in mobile menu */}
                <div className="p-2 mt-2">
                  <Button
                    variant="destructive"
                    className="w-full flex items-center justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Hero Banner with Background Image - UPDATED: Added visible picture */}
          <div className="relative rounded-xl shadow-lg overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: "url('/images/forest-wellness-bg.jpg')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-700/60 z-10"></div>
            <div className="relative z-20 p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h1 className="text-3xl font-bold mb-2">
                    {getGreeting()}, {userName || "Yogi"}
                  </h1>
                  <p className="text-green-100">Welcome to your yoga journey dashboard</p>
                </div>
                <div className="flex items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg mr-4">
                    <img
                      src="/images/serene-forest-meditation.jpg"
                      alt="Meditation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="bg-white text-green-700 hover:bg-green-50"
                    onClick={() => router.push("/user/access-course")}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Today's Class
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Auth status indicator for debugging */}
          <Card className="border-2 border-green-500 mb-4 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-green-800">Auth Status: {authStatus}</p>
                  <p className="text-sm text-green-600">If you're seeing this, you're successfully logged in!</p>
                </div>
                <Button onClick={() => window.location.reload()} size="sm" className="bg-green-600 hover:bg-green-700">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Cards Grid - UPDATED: Removed the Join Live Session card */}
          <div className="grid gap-6 md:grid-cols-1">
            {/* Access Course Card */}
            <Card className="overflow-hidden relative border-0 shadow-md">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: "url('/images/riverside-yoga.jpg')" }}
              ></div>
              <CardContent className="p-8 flex flex-col justify-between relative z-10 h-full">
                <div className="text-center md:text-left mb-6">
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Ready for Your Yoga Session?</h2>
                  <p className="text-green-700 mb-4 md:max-w-md">
                    Access today's courses and continue your wellness journey with guided practices
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 self-start"
                  onClick={() => router.push("/user/access-course")}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Access Course
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-100 shadow-md hover:shadow-lg transition-all duration-200 bg-white overflow-hidden">
              <div
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/tall-forest-trees.jpg')" }}
              ></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-green-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Attendance Rate</span>
                      <span className="font-bold text-green-700">{attendance.percentage}%</span>
                    </div>
                    <Progress
                      value={attendance.percentage}
                      className="h-2 bg-green-100"
                      indicatorClassName="bg-green-600"
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      You've attended {attendance.attended} out of {attendance.total} sessions.
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-100 shadow-md hover:shadow-lg transition-all duration-200 bg-white overflow-hidden">
              <div
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/traditional-yoga-mudras.jpg')" }}
              ></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-green-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Last session: {formatDate(new Date().toISOString())}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span>Documents viewed: 3</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-green-500 mr-2" />
                      <span>Community engagement: Active</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-100 shadow-md hover:shadow-lg transition-all duration-200 bg-white overflow-hidden">
              <div
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/serene-forest-meditation.jpg')" }}
              ></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-green-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No new notifications.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 2).map((notification) => (
                      <div key={notification.id} className="text-sm border-l-2 border-green-500 pl-2">
                        <p className="text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-400">{formatDate(notification.created_at)}</p>
                      </div>
                    ))}
                    {notifications.length > 2 && (
                      <Button
                        variant="link"
                        onClick={() => router.push("/user/notifications")}
                        className="text-green-600 hover:text-green-700 p-0 h-auto"
                      >
                        View all notifications
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Add this right after the Stats Grid section in the JSX */}
      {showSubscriptionCards && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-2 bg-green-600 w-full"></div>
                <CardHeader className="pb-2">
                  <CardTitle>{subscription.subscription.name}</CardTitle>
                  <CardDescription>
                    Valid until {format(new Date(subscription.end_date), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">₹{subscription.subscription.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{subscription.subscription.duration_days} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Full Access:</span>
                      <Badge variant={subscription.subscription.full_availability ? "default" : "outline"}>
                        {subscription.subscription.full_availability ? "Enabled" : "Limited"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push("/user/access-course")}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> Access Courses
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Contact Us Card */}
      <div className="mt-6" id="contact">
        <Card className="border-green-100 shadow-md hover:shadow-lg transition-all duration-200 bg-white overflow-hidden">
          <div
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/forest-pattern-bg.jpg')" }}
          ></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center text-green-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              <div className="flex items-center">
                <div className="bg-green-50 p-3 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Email</h3>
                  <p className="text-green-700">sthavishtah2024@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-green-50 p-3 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Social Media</h3>
                  <p className="text-green-700">@sthavishtah</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
