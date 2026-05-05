"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { isUserLoggedIn, logout } from "@/lib/auth-client"

interface LoginButtonProps {
  className?: string
}

export function LoginButton({ className }: LoginButtonProps) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const loggedIn = isUserLoggedIn()
        setIsLoggedIn(loggedIn)

        if (loggedIn) {
          const name = localStorage.getItem("userName") || "User"
          setUserName(name)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        setIsLoggedIn(false)
      }
      setLoading(false)
    }

    checkAuthStatus()

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = () => {
      checkAuthStatus()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogin = () => {
    if (isLoggedIn) {
      // If already logged in, go to dashboard
      router.push("/user/dashboard")
    } else {
      // If not logged in, go to login page
      router.push("/user/login")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsLoggedIn(false)
      setUserName("")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" disabled className={className}>
        Loading...
      </Button>
    )
  }

  if (isLoggedIn) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" onClick={handleLogin} className="flex items-center gap-2 bg-transparent">
          <User className="h-4 w-4" />
          {userName}
        </Button>
        <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 bg-transparent">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleLogin} className={`forest-button ${className}`}>
      <User className="mr-2 h-4 w-4" />
      Login
    </Button>
  )
}
