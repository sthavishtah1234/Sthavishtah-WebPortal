"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GraduationCap, LayoutDashboard, LogOut, Menu, X, Camera } from "lucide-react"
import { isStudentLoggedIn, clearStudentAuth } from "@/lib/auth-client"

interface StudentLayoutProps {
  children: React.ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    if (isStudentLoggedIn()) {
      setIsAuthenticated(true)
    } else {
      router.push("/student/login")
      return
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    clearStudentAuth()
    // Clear cookies
    document.cookie = "studentId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
    router.push("/student/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student portal...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const studentName = typeof window !== "undefined" ? localStorage.getItem("studentName") || "Student" : "Student"

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/student/dashboard",
    },
    {
      title: "AICTE Submissions",
      href: "/student/dashboard",
      icon: Camera,
      active: false,
      description: "View from dashboard",
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
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Sthavishtah</h1>
                <p className="text-xs text-emerald-600 font-medium">Student Portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Student Info */}
          <div className="px-6 py-4 border-b bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                <p className="text-xs text-emerald-600">Student</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3 ${item.active ? "text-emerald-700" : "text-gray-500"}`} />
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Logout */}
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
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              Student
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
