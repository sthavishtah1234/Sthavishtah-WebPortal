"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function UserDirectAccess() {
  const router = useRouter()

  useEffect(() => {
    // Log current authentication status
    console.log("Current user auth:", localStorage.getItem("userAuthenticated"))
    console.log("Current user ID:", localStorage.getItem("userId"))
  }, [])

  const loginAndRedirect = (path: string) => {
    // Set dummy user data if not present
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", "1")
      localStorage.setItem("userName", "Test User")
      localStorage.setItem("userEmail", "test@example.com")
      localStorage.setItem("userPhone", "1234567890")
    }

    localStorage.setItem("userAuthenticated", "true")
    router.push(path)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">User Direct Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center mb-6">
            Use these buttons to directly access user pages, bypassing authentication checks.
          </p>

          <div className="grid gap-3">
            <Button onClick={() => loginAndRedirect("/user/dashboard")} className="w-full">
              Dashboard
            </Button>
            <Button onClick={() => loginAndRedirect("/user/access-course")} className="w-full">
              Access Course
            </Button>
            <Button onClick={() => loginAndRedirect("/user/previous-sessions")} className="w-full">
              Previous Sessions
            </Button>
            <Button onClick={() => loginAndRedirect("/user/subscriptions")} className="w-full">
              Subscriptions
            </Button>
            <Button onClick={() => loginAndRedirect("/user/notifications")} className="w-full">
              Notifications
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                localStorage.removeItem("userId")
                localStorage.removeItem("userEmail")
                localStorage.removeItem("userName")
                localStorage.removeItem("userPhone")
                localStorage.removeItem("userAuthenticated")
                router.push("/user/login")
              }}
            >
              Logout and Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
