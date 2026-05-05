"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"

interface NavigationButtonProps {
  className?: string
  children: React.ReactNode
  href: string
  icon?: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

export function NavigationButton({ className = "", children, href, icon, variant = "default" }: NavigationButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleNavigation = () => {
    setIsLoading(true)
    router.push(href)
  }

  return (
    <Button variant={variant} className={className} onClick={handleNavigation} disabled={isLoading}>
      {isLoading ? "Loading..." : children}
      {icon && !isLoading && icon}
    </Button>
  )
}

export function LoginButton({ className = "" }: { className?: string }) {
  return (
    <NavigationButton
      href="/user/login"
      variant="outline"
      className={`backdrop-blur-sm bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all ${className}`}
    >
      Login
    </NavigationButton>
  )
}

export function JourneyButton({ className = "" }: { className?: string }) {
  return (
    <NavigationButton
      href="/user/register"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 bg-white/90 backdrop-blur-sm text-green-800 hover:bg-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] w-full sm:w-auto ${className}`}
      icon={<Leaf className="ml-2 h-4 w-4" />}
    >
      Begin Your Journey
    </NavigationButton>
  )
}
