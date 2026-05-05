"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { generateUserId } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { countries } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

export default function UserRegister() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("India")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredBatch, setPreferredBatch] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean
    discount: number
    message: string
  } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [isWhatsAppLink, setIsWhatsAppLink] = useState(false)
  const [linkData, setLinkData] = useState<any>(null)

  useEffect(() => {
    async function checkLinkType() {
      if (redirectUrl && redirectUrl.startsWith("/l/")) {
        try {
          const token = redirectUrl.split("/l/")[1]
          const response = await fetch(`/api/links/validate/${token}`)
          const data = await response.json()

          if (data.success && data.link) {
            setLinkData(data.link)
            setIsWhatsAppLink(data.link.link_type === "whatsapp")
            console.log("Link type detected:", data.link.link_type)
          }
        } catch (error) {
          console.error("Error checking link type:", error)
        }
      }
    }

    checkLinkType()
  }, [redirectUrl])

  const detectSuspiciousPatterns = () => {
    const suspiciousNames = ["test", "fake", "dummy", "admin", "user123", "qwerty", "asdf"]
    const lowercaseName = name.toLowerCase()
    for (const suspicious of suspiciousNames) {
      if (lowercaseName.includes(suspicious)) {
        return "Please enter your real name"
      }
    }

    if (name.trim().length < 3) {
      return "Name must be at least 3 characters"
    }
    if (/\d{3,}/.test(name)) {
      return "Name cannot contain multiple numbers"
    }

    const suspiciousEmailDomains = ["tempmail", "throwaway", "guerrillamail", "mailinator", "10minutemail"]
    for (const domain of suspiciousEmailDomains) {
      if (email.toLowerCase().includes(domain)) {
        return "Please use a valid email address"
      }
    }

    const phoneDigits = phoneNumber.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return "Please enter a valid phone number"
    }

    if (/^(\d)\1{9,}$/.test(phoneDigits)) {
      return "Please enter a valid phone number"
    }

    return null
  }

  const validateForm = () => {
    if (!name.trim()) return "Name is required"

    const suspiciousError = detectSuspiciousPatterns()
    if (suspiciousError) return suspiciousError

    if (!email.trim()) {
      return "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      return "Phone number is required"
    }

    if (!whatsappSameAsPhone && !whatsappNumber.trim()) {
      return "WhatsApp number is required if different from phone number"
    }

    if (!password) {
      return "Password is required"
    } else if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }

    if (password !== confirmPassword) {
      return "Passwords do not match"
    }

    return null
  }

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation(null)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .limit(1)

      if (error || !data || data.length === 0) {
        setReferralValidation({
          isValid: false,
          discount: 0,
          message: "Invalid referral code",
        })
        return
      }

      const referralCode = data[0]

      if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
        setReferralValidation({
          isValid: false,
          discount: 0,
          message: "Referral code has expired",
        })
        return
      }

      if (referralCode.usage_limit && referralCode.times_used >= referralCode.usage_limit) {
        setReferralValidation({
          isValid: false,
          discount: 0,
          message: "Referral code usage limit reached",
        })
        return
      }

      setReferralValidation({
        isValid: true,
        discount: referralCode.discount_percentage,
        message: `Valid! Get ${referralCode.discount_percentage}% discount`,
      })
    } catch (error) {
      console.error("Error validating referral code:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError("")

      const supabase = getSupabaseBrowserClient()

      const { data: existingUserByPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phoneNumber)
        .single()

      if (existingUserByPhone) {
        setError("This phone number is already registered. Please login or use a different number.")
        return
      }

      const { data: existingUserByEmail } = await supabase.from("users").select("id").eq("email", email).single()

      if (existingUserByEmail) {
        setError("This email is already registered. Please login or use a different email.")
        return
      }

      const suspiciousError = detectSuspiciousPatterns()
      if (suspiciousError) {
        setError(suspiciousError)
        return
      }

      const userId = generateUserId()

      const hashedPassword = await bcrypt.hash(password, 10)

      const userData: any = {
        user_id: userId,
        name,
        email,
        phone_number: phoneNumber,
        whatsapp_number: whatsappSameAsPhone ? phoneNumber : whatsappNumber,
        preferred_batch: preferredBatch || null,
        password: hashedPassword,
        country,
        referral_code: referralCode && referralValidation?.isValid ? referralCode.toUpperCase() : null,
        created_at: new Date().toISOString(),
      }

      if (referralCode && referralValidation?.isValid) {
        localStorage.setItem("pendingReferralCode", referralCode.toUpperCase())
      }

      const { data, error } = await supabase.from("users").insert([userData]).select()

      if (error) throw error

      try {
        await fetch("/api/user/send-verification-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            userId: data[0].id,
          }),
        })
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
      }

      try {
        const response = await fetch("/api/auto-assign-free-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId, // string user_id like "USR-xxxx"
            numericUserId: data[0].id, // numeric id from database
            isRegistration: true // bypass admin password check for registration
          }),
        })

        if (!response.ok) {
          console.error("Failed to assign free subscription:", await response.text())
        } else {
          const result = await response.json()
          console.log("Successfully assigned default subscription to new user:", result)
        }
      } catch (subscriptionError) {
        console.error("Error assigning free subscription:", subscriptionError)
      }

      localStorage.setItem("userId", data[0].id.toString())
      localStorage.setItem("userAuthenticated", "true")
      localStorage.setItem("userName", data[0].name || "User")
      localStorage.setItem("userEmail", data[0].email || "")
      localStorage.setItem("userPhone", data[0].phone_number || "")
      document.cookie = `userId=${data[0].id}; path=/; max-age=86400`

      const pendingPlan = sessionStorage.getItem("pendingSubscriptionPlan")
      if (pendingPlan) {
        sessionStorage.removeItem("pendingSubscriptionPlan")
        router.push(`/user/subscribe?plan=${pendingPlan}`)
        return
      }

      if (redirectUrl) {
        if (isWhatsAppLink) {
          setShowWhatsAppDialog(true)
        } else {
          setShowWhatsAppDialog(true)
        }
      } else {
        setShowWhatsAppDialog(true)
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setError("An error occurred during registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppRedirect = () => {
    window.open("https://chat.whatsapp.com/G68uJzPssx1CZE2WphRmzP", "_blank")

    if (redirectUrl && !isWhatsAppLink) {
      router.push(redirectUrl)
    } else {
      router.push("/user/login?registered=true")
    }
  }

  const handleSkipWhatsApp = () => {
    if (redirectUrl && !isWhatsAppLink) {
      router.push(redirectUrl)
    } else {
      router.push("/user/login?registered=true")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">User Registration</CardTitle>
            <CardDescription>
              {redirectUrl
                ? `Create an account to access ${linkData?.title || "the requested content"}`
                : "Create a new account to access yoga and wellness courses"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="whatsapp-same"
                      checked={whatsappSameAsPhone}
                      onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="whatsapp-same">WhatsApp number is same as phone number</Label>
                  </div>

                  {!whatsappSameAsPhone && (
                    <div className="mt-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="Enter your WhatsApp number"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Preferred Batch */}
                <div className="space-y-2">
                  <Label htmlFor="batch">Preferred Batch (Optional)</Label>
                  <Select value={preferredBatch} onValueChange={setPreferredBatch}>
                    <SelectTrigger id="batch">
                      <SelectValue placeholder="Select preferred batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No preference</SelectItem>
                      <SelectItem value="1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                      <SelectItem value="2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                      <SelectItem value="3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                      <SelectItem value="4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                      <SelectItem value="5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                      <SelectItem value="6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                  <Input
                    id="referral-code"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase()
                      setReferralCode(code)
                      if (code.length >= 3) {
                        validateReferralCode(code)
                      } else {
                        setReferralValidation(null)
                      }
                    }}
                  />
                  {referralValidation && (
                    <p className={`text-sm ${referralValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                      {referralValidation.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
              <div className="flex justify-between text-sm">
                <Link
                  href={`/user/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
                  className="text-primary hover:underline"
                >
                  Already have an account? Login
                </Link>
                <Link href="/" className="text-gray-500 hover:underline">
                  Back to Home
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* WhatsApp Group Dialog */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Registration Successful</DialogTitle>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleSkipWhatsApp}>
                <X className="h-4 w-4" />
                <span className="sr-only">Skip</span>
              </Button>
            </div>
            <DialogDescription>
              {redirectUrl
                ? `You've been registered successfully! ${isWhatsAppLink ? "Since you're accessing a WhatsApp link, we recommend joining our community group first." : "You can now access your requested content."}`
                : "You have been successfully registered!"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>For updates on upcoming sessions and easier access to course materials, join our WhatsApp group.</p>
            {!isWhatsAppLink && (
              <p className="font-medium text-blue-600">
                After joining (or skipping), you'll be redirected to your requested content.
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {!isWhatsAppLink && (
              <Button variant="outline" onClick={handleSkipWhatsApp}>
                Skip & Continue
              </Button>
            )}
            <Button onClick={handleWhatsAppRedirect} className="flex-1">
              Join WhatsApp Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
