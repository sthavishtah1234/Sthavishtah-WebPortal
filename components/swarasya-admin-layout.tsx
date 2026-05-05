"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Users,
  Disc3,
  Menu,
  X,
  ArrowLeft,
  Home,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react"

interface SwarasyaAdminLayoutProps {
  children: React.ReactNode
}

export default function SwarasyaAdminLayout({ children }: SwarasyaAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/swarasya",
      icon: LayoutDashboard,
      active: pathname === "/admin/swarasya",
    },
    {
      title: "Band Members",
      href: "/admin/swarasya/members",
      icon: Users,
      active: pathname === "/admin/swarasya/members",
    },
    {
      title: "Albums",
      href: "/admin/swarasya/albums",
      icon: Disc3,
      active: pathname === "/admin/swarasya/albums",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-stone-900 via-amber-900 to-stone-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-amber-500/50 bg-white">
            <Image src="/images/swarasya-logo.jpeg" alt="Swarasya" fill className="object-contain p-1" />
          </div>
          <span className="font-playfair text-lg font-semibold">Swarasya Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 
            bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            lg:min-h-screen
          `}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-500/50 bg-white">
                <Image src="/images/swarasya-logo.jpeg" alt="Swarasya" fill className="object-contain p-1" />
              </div>
              <div>
                <h1 className="font-playfair text-xl font-bold text-white">Swarasya</h1>
                <p className="text-amber-400/80 text-xs">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    item.active
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-stone-400 hover:bg-stone-800 hover:text-white"
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-amber-900/30 mt-auto">
            <div className="space-y-2">
              <Link
                href="/swarasya"
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-200"
              >
                <ExternalLink className="h-5 w-5" />
                <span className="font-medium">View Public Page</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Main Admin</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-200"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
