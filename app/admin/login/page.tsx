"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Home } from "lucide-react"
import Image from "next/image"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.valid) {
        // Store authentication flag in localStorage
        localStorage.setItem("adminPassword", password)
        localStorage.setItem("adminAuthenticated", "true")

        // Redirect to admin dashboard
        router.push("/admin/dashboard")
      } else {
        setError("Invalid admin password")
      }
    } catch (err) {
      console.error("[v0] Admin login error:", err)
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          {/* Logo and Brand Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <Image
                src="/images/logo.png"
                alt="Sthavishtah Yoga Logo"
                width={80}
                height={80}
                className="rounded-full shadow-lg ring-4 ring-green-100"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Sthavishtah Yoga</h1>
            <p className="text-sm text-gray-600 mb-4">Admin Portal</p>
          </div>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-gray-800">Admin Login</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your admin password to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={loading || !password}
            >
              {loading ? "Logging in..." : "Login to Admin Panel"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">© 2025 Sthavishtah Yoga. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
