"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Lock, Leaf, GraduationCap } from "lucide-react"
import Image from "next/image"
import { isStudentLoggedIn } from "@/lib/auth-client"

export default function StudentLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (isStudentLoggedIn()) {
      window.location.href = redirectUrl || "/student/dashboard"
      return
    }
    setCheckingAuth(false)
  }, [redirectUrl])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!phone || !password) {
        setError("Please enter both phone number and password")
        setLoading(false)
        return
      }

      const response = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Invalid phone number or password")
        setLoading(false)
        return
      }

      const user = result.user
      localStorage.setItem("studentId", user.id.toString())
      localStorage.setItem("studentAuthenticated", "true")
      localStorage.setItem("studentName", user.name || "Student")
      localStorage.setItem("studentEmail", user.email || "")
      localStorage.setItem("studentPhone", user.phone_number || "")

      setPhone("")
      setPassword("")

      window.location.href = redirectUrl || "/student/dashboard"
    } catch (err) {
      console.error("Student login error:", err)
      setError("An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="h-screen flex items-center justify-center p-4 forest-bg">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 forest-bg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 leaf-pattern opacity-20"></div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 opacity-30">
        <Leaf className="h-8 w-8 text-white animate-pulse" />
      </div>
      <div className="absolute top-20 right-20 opacity-20">
        <Leaf className="h-12 w-12 text-white animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute bottom-20 left-20 opacity-25">
        <Leaf className="h-6 w-6 text-white animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <div className="relative h-16 w-16">
                <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">STHAVISHTAH</h1>
          <p className="text-white/80 text-sm tracking-widest">STUDENT PORTAL</p>
          <div className="w-24 h-1 bg-white/30 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Login Card */}
        <Card className="nature-card shadow-2xl border-0 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-2xl font-semibold forest-text-gradient">Student Login</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Sign in to access your AICTE points and event submissions
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  autoComplete="current-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 forest-outline-button"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button type="submit" disabled={loading} className="flex-1 forest-button">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  New student?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-green-600 hover:text-green-700 font-medium"
                    onClick={() => router.push("/student/register")}
                  >
                    Register here
                  </Button>
                </p>
                <p className="text-sm text-gray-500">
                  Not a student?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-500 hover:text-gray-700 font-medium"
                    onClick={() => router.push("/user/login")}
                  >
                    Regular Login
                  </Button>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
