"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AutoLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function processAutoLogin() {
      try {
        const token = searchParams.get("token")

        if (!token) {
          setError("Invalid or missing token")
          setLoading(false)
          return
        }

        // Generate device fingerprint
        const deviceFingerprint = generateDeviceFingerprint()

        // Call API to validate token
        const response = await fetch("/api/validate-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, deviceFingerprint }),
        })

        const data = await response.json()

        if (!data.success) {
          setError(data.message || "Authentication failed")
          setLoading(false)
          return
        }

        // Store user info in localStorage
        localStorage.setItem("userId", data.userId)
        localStorage.setItem("userName", data.userName)
        localStorage.setItem("userEmail", data.userEmail)
        localStorage.setItem("userPhone", data.userPhone)
        localStorage.setItem("userAuthenticated", "true")
        localStorage.setItem("authToken", token) // Store token for later invalidation
        localStorage.setItem("deviceFingerprint", deviceFingerprint) // Store fingerprint

        // Set session expiry
        const sessionExpiry = new Date()
        sessionExpiry.setHours(sessionExpiry.getHours() + 2) // 2-hour session
        localStorage.setItem("sessionExpiry", sessionExpiry.toISOString())

        // Redirect to the course page or dashboard
        router.push("/user/access-course")
      } catch (error) {
        console.error("Auto-login error:", error)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    processAutoLogin()
  }, [router, searchParams])

  // Add a listener for when the user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("User is leaving the page")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Check session expiry periodically
  useEffect(() => {
    const checkSessionExpiry = () => {
      const expiryStr = localStorage.getItem("sessionExpiry")
      if (expiryStr) {
        const expiry = new Date(expiryStr)
        if (new Date() > expiry) {
          // Session expired, log out
          localStorage.removeItem("userId")
          localStorage.removeItem("userName")
          localStorage.removeItem("userEmail")
          localStorage.removeItem("userPhone")
          localStorage.removeItem("userAuthenticated")
          localStorage.removeItem("authToken")
          localStorage.removeItem("deviceFingerprint")
          localStorage.removeItem("sessionExpiry")

          router.push("/user/login?expired=true")
        }
      }
    }

    const interval = setInterval(checkSessionExpiry, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg">Logging you in automatically...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="max-w-md text-center">
          <p className="mb-4">This could be due to one of the following reasons:</p>
          <ul className="text-left list-disc pl-5 mb-4">
            <li>The link has expired</li>
            <li>The link has already been used</li>
            <li>The link is being used on a different device than it was first accessed on</li>
            <li>The link is invalid or has been tampered with</li>
          </ul>
          <p className="mb-4">Please contact your instructor for a new access link.</p>

          <button
            onClick={() => router.push("/user/login")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return null
}
