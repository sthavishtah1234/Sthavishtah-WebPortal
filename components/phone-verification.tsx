"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

interface PhoneVerificationProps {
  onVerificationComplete: (userId: string) => void
  initialPhoneNumber?: string
}

export function PhoneVerification({ onVerificationComplete, initialPhoneNumber = "" }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [verificationCode, setVerificationCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send verification code")
      }

      setCodeSent(true)
      setSuccess("Verification code sent to your phone")

      // In a real app, you wouldn't do this - this is just for demo purposes
      if (data.code) {
        console.log("Verification code:", data.code)
      }
    } catch (error) {
      console.error("Error sending code:", error)
      setError(error.message || "Failed to send verification code")
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify code")
      }

      setSuccess("Phone number verified successfully")

      // Store user info in localStorage
      localStorage.setItem("userId", data.userId)
      localStorage.setItem("userName", data.userName)
      localStorage.setItem("userEmail", data.userEmail)
      localStorage.setItem("userPhone", data.userPhone)
      localStorage.setItem("phoneVerified", "true")

      // Notify parent component
      onVerificationComplete(data.userId)
    } catch (error) {
      console.error("Error verifying code:", error)
      setError(error.message || "Failed to verify code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          {codeSent
            ? "Enter the verification code sent to your phone"
            : "Verify your phone number to access your subscription"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!codeSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="flex gap-2">
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={sendVerificationCode} disabled={loading}>
                  {loading ? "Sending..." : "Send Code"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {codeSent && (
          <Button variant="outline" onClick={() => setCodeSent(false)} disabled={loading}>
            Back
          </Button>
        )}
        {codeSent && (
          <Button onClick={verifyCode} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
