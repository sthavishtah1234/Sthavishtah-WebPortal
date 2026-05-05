"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function InstructorLogin() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber || !password) {
      setError("Please enter both phone number and password")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClient()

      // Search by phone_number
      const { data, error: queryError } = await supabase
        .from("instructors")
        .select("*")
        .eq("phone_number", phoneNumber)
        .maybeSingle()

      if (queryError) {
        console.error("Database error:", queryError)
        setError("An error occurred while trying to log in. Please try again.")
        setLoading(false)
        return
      }

      if (!data) {
        setError("Invalid phone number or password")
        setLoading(false)
        return
      }

      // Simple password check
      if (data.password !== password) {
        setError("Invalid phone number or password")
        setLoading(false)
        return
      }

      // Store instructor info in localStorage
      localStorage.setItem("instructorId", data.id.toString())
      localStorage.setItem("instructorCode", data.instructor_id || "")
      localStorage.setItem("instructorName", data.name || "")
      localStorage.setItem("instructorAuthenticated", "true")
      localStorage.setItem("instructorProfileImage", data.profile_image || "")

      // Redirect to instructor dashboard
      router.push("/instructor/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-green-100">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2 text-green-700" />
            <span className="text-green-700">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-block relative h-20 w-20 rounded-full overflow-hidden border-4 border-green-100 shadow-md mb-4 mx-auto">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-green-800">Instructor Login</h1>
            <p className="text-gray-600">Access your teaching dashboard</p>
          </div>

          <Card className="border-green-100 shadow-md">
            <CardHeader>
              <CardTitle>Login to Your Account</CardTitle>
              <CardDescription>Enter your phone number and password</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-center text-gray-500">
                Contact the administrator if you've forgotten your login details
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Sthavishtah Yoga. All rights reserved.</p>
      </footer>
    </div>
  )
}
