"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PhoneVerification } from "@/components/phone-verification"

export default function VerifyPhonePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialPhone, setInitialPhone] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("/user/dashboard")

  useEffect(() => {
    // Get phone from query params if available
    const phone = searchParams.get("phone")
    if (phone) {
      setInitialPhone(phone)
    }

    // Get redirect URL if available
    const redirect = searchParams.get("redirect")
    if (redirect) {
      setRedirectUrl(redirect)
    }
  }, [searchParams])

  const handleVerificationComplete = (userId: string) => {
    // Redirect to the specified page after successful verification
    setTimeout(() => {
      router.push(redirectUrl)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <PhoneVerification onVerificationComplete={handleVerificationComplete} initialPhoneNumber={initialPhone} />
      </div>
    </div>
  )
}
