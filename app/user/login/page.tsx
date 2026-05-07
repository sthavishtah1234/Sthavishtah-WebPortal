"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Lock, Leaf, User } from "lucide-react"
import Image from "next/image"
import { isUserLoggedIn } from "@/lib/auth-client"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)

  const isFromLink = redirectUrl?.startsWith("/l/")

  useEffect(() => {
    const checkExistingAuth = () => {
      if (isUserLoggedIn()) {
        console.log("✅ User already logged in, redirecting...")

        if (redirectUrl) {
          window.location.href = redirectUrl
        } else {
          window.location.href = "/user/dashboard"
        }
        return
      }
      setCheckingAuth(false)
    }

    checkExistingAuth()
  }, [redirectUrl])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[v0] ===== LOGIN ATTEMPT START =====")
      console.log("[v0] Login attempt for phone:", phone)

      if (!phone || !password) {
        console.log("[v0] Missing phone or password")
        setError("Please enter both phone number and password")
        setLoading(false)
        return
      }

      console.log("[v0] Calling login API route...")
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      })

      const result = await response.json()
      console.log("[v0] Login API response:", result)

      if (!response.ok) {
        console.log("[v0] Login failed:", result.error)
        setError(result.error || "Invalid phone number or password")
        setLoading(false)
        return
      }

      console.log("[v0] Login successful! Setting up session...")

      const user = result.user

      // Store user data
      localStorage.setItem("userId", user.id.toString())
      localStorage.setItem("userAuthenticated", "true")
      localStorage.setItem("userName", user.name || "User")
      localStorage.setItem("userEmail", user.email || "")
      localStorage.setItem("userPhone", user.phone_number || "")

      console.log("[v0] LocalStorage set")

      // Clear form
      setPhone("")
      setPassword("")

      const pendingPlan = sessionStorage.getItem("pendingSubscriptionPlan")
      console.log("[v0] Checking for pending subscription plan:", pendingPlan)

      if (pendingPlan) {
        sessionStorage.removeItem("pendingSubscriptionPlan")
        console.log("[v0] Found pending plan, redirecting to payment for plan:", pendingPlan)
        window.location.href = `/user/subscribe?plan=${pendingPlan}`
        return
      }

      console.log("[v0] No pending plan, checking redirect URL:", redirectUrl)

      // Redirect
      if (redirectUrl) {
        console.log("[v0] Redirecting to redirect URL:", redirectUrl)
        window.location.href = redirectUrl
      } else {
        console.log("[v0] No redirect URL, going to dashboard")
        window.location.href = "/user/dashboard"
      }

      console.log("[v0] ===== LOGIN ATTEMPT END =====")
    } catch (err) {
      console.error("[v0] Login error:", err)
      console.error("[v0] Error stack:", err instanceof Error ? err.stack : "No stack trace")
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
          <p className="text-white/80 text-sm tracking-widest">YOGA AND WELLNESS</p>
          <div className="w-24 h-1 bg-white/30 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Login Card */}
        <Card className="nature-card shadow-2xl border-0 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold forest-text-gradient">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              {isFromLink
                ? "Please log in to access your requested content"
                : "Sign in to continue your wellness journey and find your inner peace"}
            </CardDescription>
          </CardHeader>

          {isFromLink && (
            <CardContent className="pb-4">
              <Alert className="border-green-200 bg-green-50">
                <Leaf className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🔗 You'll be automatically redirected to your requested link after logging in.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

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
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New to our wellness community?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-green-600 hover:text-green-700 font-medium"
                    onClick={() => router.push(`/user/register${redirectUrl ? `?redirect=${redirectUrl}` : ""}`)}
                  >
                    Join us today
                  </Button>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Are you a student?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-emerald-600 hover:text-emerald-700 font-medium"
                    onClick={() => router.push("/student/login")}
                  >
                    Student Login
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
