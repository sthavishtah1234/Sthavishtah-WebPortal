"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Users,
  BarChart3,
  FileText,
  Mail,
  LogOut,
  Menu,
  Package,
  BookOpen,
  Shield,
  Bell,
  LinkIcon,
  UserCheck,
  DollarSign,
  RefreshCw,
  Layers,
  Send,
  Star,
  Grid3X3,
  X,
  Brain,
  Ticket,
  Mic2,
  Camera,
  GraduationCap,
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const adminPassword = localStorage.getItem("adminPassword")
      const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

      if (adminPassword === validPassword) {
        setIsAuthenticated(true)
      } else {
        // Clear any invalid auth and redirect
        localStorage.removeItem("adminPassword")
        router.push("/admin/login")
        return
      }
    } catch (error) {
      console.error("Authentication check failed:", error)
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminPassword")
    }
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access the admin panel</p>
          </div>
          <div className="space-y-4">
            <Button onClick={() => router.push("/admin/login")} className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Login Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Grid3X3,
      active: pathname === "/admin/dashboard",
    },
    {
      title: "Courses",
      href: "/admin/courses",
      icon: BookOpen,
      active: pathname.startsWith("/admin/courses"),
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      title: "Instructors",
      href: "/admin/instructors",
      icon: UserCheck,
      active: pathname.startsWith("/admin/instructors"),
    },
    {
      title: "Team Management",
      href: "/admin/team",
      icon: Users,
      active: pathname.startsWith("/admin/team"),
    },
    {
      title: "Swarasya Band",
      href: "/admin/swarasya",
      icon: Mic2,
      active: pathname.startsWith("/admin/swarasya"),
    },
    {
      title: "Pose Analytics",
      href: "/admin/pose-analytics",
      icon: Brain,
      active: pathname.startsWith("/admin/pose-analytics"),
    },
    {
      title: "Subscriptions",
      href: "/admin/subscriptions",
      icon: Package,
      active: pathname.startsWith("/admin/subscriptions") && !pathname.startsWith("/admin/subscription-pages"),
    },
    {
      title: "Subscription Pages",
      href: "/admin/subscription-pages",
      icon: Layers,
      active: pathname.startsWith("/admin/subscription-pages"),
    },
    {
      title: "Referral Codes",
      href: "/admin/referral-codes",
      icon: Ticket,
      active: pathname.startsWith("/admin/referral-codes"),
    },
    {
      title: "Link Generator",
      href: "/admin/link-generator",
      icon: LinkIcon,
      active: pathname.startsWith("/admin/link-generator"),
    },
    {
      title: "Payment Recovery",
      href: "/admin/payment-recovery",
      icon: DollarSign,
      active: pathname.startsWith("/admin/payment-recovery"),
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      active: pathname.startsWith("/admin/notifications"),
    },
    {
      title: "Documents",
      href: "/admin/documents",
      icon: FileText,
      active: pathname.startsWith("/admin/documents"),
    },
    {
      title: "Analytics",
      href: "/admin/analytics/video",
      icon: BarChart3,
      active: pathname.startsWith("/admin/analytics"),
    },
    {
      title: "Updates",
      href: "/admin/updates",
      icon: RefreshCw,
      active: pathname.startsWith("/admin/updates"),
    },
    {
      title: "Contact",
      href: "/admin/contact",
      icon: Mail,
      active: pathname.startsWith("/admin/contact"),
    },
    {
      title: "Send Email",
      href: "/admin/email",
      icon: Send,
      active: pathname.startsWith("/admin/email"),
    },
    {
      title: "API Verification",
      href: "/admin/api-verification",
      icon: Shield,
      active: pathname.startsWith("/admin/api-verification"),
    },
    {
      title: "Reviews",
      href: "/admin/reviews",
      icon: Star,
      active: pathname.startsWith("/admin/reviews"),
    },
    {
      title: "Event Tickets",
      href: "/admin/tickets",
      icon: Ticket,
      active: pathname.startsWith("/admin/tickets"),
    },
    {
      title: "AICTE Events",
      href: "/admin/aicte-events",
      icon: GraduationCap,
      active: pathname.startsWith("/admin/aicte-events"),
    },
    {
      title: "AICTE Approvals",
      href: "/admin/aicte-approvals",
      icon: Camera,
      active: pathname.startsWith("/admin/aicte-approvals"),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo Section */}
          <div className="flex items-center h-16 px-6 border-b bg-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Sthavishtah</h1>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overscroll-contain min-h-0">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  item.active
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3 ${item.active ? "text-blue-700" : "text-gray-500"}`} />
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b shadow-sm">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-4 ml-auto">
            <div className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
              Admin Access
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
export { AdminLayout }
