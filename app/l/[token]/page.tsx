"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react"
import Image from "next/image"

export default function LinkRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [linkData, setLinkData] = useState<any>(null)

  useEffect(() => {
    async function processLink() {
      try {
        console.log("🔗 Processing link token:", params.token)

        // ALWAYS validate first
        const validateResponse = await fetch(`/api/links/validate/${params.token}`, {
          method: "GET",
          credentials: "include", // Include cookies
        })

        const validateData = await validateResponse.json()
        console.log("🔍 Validation response:", validateResponse.status, validateData)

        // Check if login is required
        if (validateResponse.status === 401 || validateData.requiresLogin) {
          console.log("🔐 LOGIN REQUIRED - showing login/register page")
          setRequiresLogin(true)
          setLinkData(validateData.linkInfo)
          setError("You need to log in to access this content")
          setLoading(false)
          return
        }

        // Check for other errors
        if (!validateResponse.ok) {
          console.log("❌ Validation failed:", validateData.error)
          setError(validateData.error || "Access denied")
          setLoading(false)
          return
        }

        console.log("✅ Validation successful, using link...")

        // Use the link
        const useResponse = await fetch(`/api/links/use/${params.token}`, {
          method: "POST",
          credentials: "include",
        })

        const useData = await useResponse.json()

        if (!useResponse.ok) {
          setError(useData.error || "Failed to access content")
          setLoading(false)
          return
        }

        console.log("✅ Redirecting to:", useData.target_url)
        window.location.href = useData.target_url
      } catch (err) {
        console.error("❌ Link processing error:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    processLink()
  }, [params.token])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center forest-bg relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20"></div>
        <div className="text-center relative z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">Validating Access...</h2>
          <p className="text-white/80">Checking your permissions...</p>
        </div>
      </div>
    )
  }

  // Login required state
  if (requiresLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 forest-bg relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20"></div>

        <div className="w-full max-w-md relative z-10">
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
          </div>

          <Card className="nature-card shadow-2xl border-0 animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold forest-text-gradient">🔐 Login Required</CardTitle>
              <CardDescription className="text-gray-600">
                {linkData?.title
                  ? `You need to log in to access "${linkData.title}"`
                  : "You need to log in to access this content"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Access Restricted</AlertTitle>
                <AlertDescription className="text-red-700">
                  This content requires authentication. Please log in or create an account to continue.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full gap-3">
                <Button
                  onClick={() => router.push(`/user/login?redirect=/l/${params.token}`)}
                  className="flex-1 forest-button"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button
                  onClick={() => router.push(`/user/register?redirect=/l/${params.token}`)}
                  variant="outline"
                  className="flex-1 forest-outline-button"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Button>
              </div>

              <div className="text-center">
                <Button variant="link" onClick={() => router.push("/")} className="text-green-600">
                  ← Back to Home
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>There was a problem with this link</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return null
}
