"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, LogOut, LayoutDashboard, FileText, Bell, Phone, Calendar, Play, Clock, Star } from "lucide-react"
import { Logo } from "@/components/logo"

interface UserLayoutProps {
  children: React.ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User"
    const email = localStorage.getItem("userEmail") || ""
    setUserName(name)
    setUserEmail(email)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userPhone")
      router.push("/user/login")
    } catch (error) {
      console.error("Logout error:", error)
      localStorage.clear()
      router.push("/user/login")
    }
  }

  const navigationItems = [
    { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/user/access-course", label: "Access Course", icon: Play },
    { href: "/user/documents", label: "Documents", icon: FileText },
    { href: "/user/previous-sessions", label: "Previous Sessions", icon: Clock },
    { href: "/user/subscriptions", label: "Subscriptions", icon: Calendar },
    { href: "/user/notifications", label: "Notifications", icon: Bell },
    { href: "/user/reviews", label: "Reviews", icon: Star },
    { href: "/user/profile", label: "Profile", icon: User },
    { href: "/user/contact", label: "Contact Us", icon: Phone },
  ]

  const isActive = (href: string) => {
    if (href === "/user/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="w-full md:w-64 bg-white rounded-lg shadow-sm h-full">
      {/* Company Logo Section */}
      <div className="px-4 py-4 mb-4 border-b border-gray-200">
        <Logo />
      </div>

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
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    active ? "bg-green-600 text-white" : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                  {active && (
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
            )
          })}
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
  )

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <MobileNav />
              <div className="ml-3">
                <Logo />
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Navigation Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden md:block md:w-64 bg-white shadow-sm min-h-screen">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
