"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, GraduationCap, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function StudentRegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [collegeName, setCollegeName] = useState("")
  const [usnNumber, setUsnNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          collegeName: collegeName || null,
          usnNumber: usnNumber || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Registration failed")
        setLoading(false)
        return
      }

      // Set auth
      const user = result.user
      localStorage.setItem("studentId", user.id.toString())
      localStorage.setItem("studentAuthenticated", "true")
      localStorage.setItem("studentName", user.name || "Student")
      localStorage.setItem("studentEmail", user.email || "")
      localStorage.setItem("studentPhone", user.phone_number || "")

      window.location.href = "/student/dashboard"
    } catch (err) {
      console.error("Registration error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 forest-bg relative overflow-hidden">
      <div className="absolute inset-0 leaf-pattern opacity-20"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <div className="relative h-14 w-14">
                <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">STHAVISHTAH</h1>
          <p className="text-white/80 text-xs tracking-widest">STUDENT REGISTRATION</p>
        </div>

        <Card className="nature-card shadow-2xl border-0 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-xl font-semibold forest-text-gradient">Create Student Account</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Register to submit event photos and earn AICTE points
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College Name (Optional)</Label>
                <Input
                  id="college"
                  placeholder="Enter your college name"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usn">USN (Optional)</Label>
                <Input
                  id="usn"
                  placeholder="Enter your USN number"
                  value={usnNumber}
                  onChange={(e) => setUsnNumber(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 border-green-200 focus:border-green-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-green-200 focus:border-green-500"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/student/login")}
                  className="flex-1 forest-outline-button"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button type="submit" disabled={loading} className="flex-1 forest-button">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/student/login" className="text-green-600 hover:text-green-700 font-medium">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
