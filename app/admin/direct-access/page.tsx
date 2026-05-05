"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function DirectAccess() {
  const router = useRouter()

  useEffect(() => {
    // Log current authentication status
    console.log("Current admin auth:", localStorage.getItem("adminAuthenticated"))
  }, [])

  const loginAndRedirect = (path: string) => {
    localStorage.setItem("adminAuthenticated", "true")
    router.push(path)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Direct Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center mb-6">
            Use these buttons to directly access admin pages, bypassing authentication checks.
          </p>

          <div className="grid gap-3">
            <Button onClick={() => loginAndRedirect("/admin/dashboard")} className="w-full">
              Dashboard
            </Button>
            <Button onClick={() => loginAndRedirect("/admin/courses")} className="w-full">
              Manage Courses
            </Button>
            <Button onClick={() => loginAndRedirect("/admin/users")} className="w-full">
              Manage Users
            </Button>
            <Button onClick={() => loginAndRedirect("/admin/notifications")} className="w-full">
              Notifications
            </Button>
            <Button onClick={() => loginAndRedirect("/admin/subscriptions")} className="w-full">
              Subscriptions
            </Button>
            <Button onClick={() => loginAndRedirect("/admin/bulk-registration")} className="w-full">
              Bulk Registration
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                localStorage.removeItem("adminAuthenticated")
                router.push("/admin/login")
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
