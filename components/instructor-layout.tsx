"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CreditCard,
  Bell,
  FileText,
} from "lucide-react"

interface InstructorLayoutProps {
  children: React.ReactNode
}

export function InstructorLayout({ children }: InstructorLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [instructorName, setInstructorName] = useState<string>("")
  const [instructorId, setInstructorId] = useState<string>("")
  const [profileImage, setProfileImage] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    // Check authentication status
    const instructorAuth = localStorage.getItem("instructorAuthenticated")
    const name = localStorage.getItem("instructorName")
    const id = localStorage.getItem("instructorCode")
    const image = localStorage.getItem("instructorProfileImage")

    setIsAuthenticated(instructorAuth === "true")
    setInstructorName(name || "")
    setInstructorId(id || "")
    setProfileImage(image || "")

    // Redirect to login if not authenticated
    if (instructorAuth !== "true") {
      router.push("/instructor/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("instructorId")
    localStorage.removeItem("instructorCode")
    localStorage.removeItem("instructorName")
    localStorage.removeItem("instructorAuthenticated")
    localStorage.removeItem("instructorProfileImage")
    router.push("/instructor/login")
  }

  // Navigation items - limited permissions for instructors
  const navItems = [
    { href: "/instructor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/instructor/courses", label: "My Courses", icon: <BookOpen className="h-5 w-5" /> },
    { href: "/instructor/subscriptions", label: "View Subscriptions", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/instructor/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { href: "/instructor/documents", label: "Documents", icon: <FileText className="h-5 w-5" /> },
    { href: "/instructor/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ]

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            <Link href="/instructor/dashboard" className="flex items-center">
              <div className="relative h-8 w-8 mr-2 overflow-hidden rounded-full border-2 border-green-100">
                <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
              </div>
              <span className="text-lg font-semibold text-green-800 hidden sm:inline-block">Instructor Portal</span>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="mr-4 text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{instructorName}</div>
              <div className="text-xs text-gray-500">ID: {instructorId}</div>
            </div>

            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-green-100">
              {profileImage ? (
                <Image src={profileImage || "/placeholder.svg"} alt={instructorName} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-800 font-bold text-lg">
                  {instructorName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <Button
              variant="ghost"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 bg-white border-r border-gray-200">
          <div className="flex-grow flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              ))}
            </nav>

            <div className="px-4 mt-6">
              <Button
                variant="outline"
                className="flex items-center w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:pl-64 pt-4 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
