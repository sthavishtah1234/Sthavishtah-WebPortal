"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CheckCircle, Copy } from "lucide-react"

export default function SendCourseLinks() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("Click the link below to access your yoga course:")
  const [generatedLink, setGeneratedLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copied, setCopied] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")

  const generateLink = async () => {
    if (!phoneNumber) {
      setError("Please enter a phone number")
      return
    }

    if (!adminPassword) {
      setError("Please enter the admin password")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setCopied(false)

    try {
      const response = await fetch("/api/generate-access-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate link")
      }

      setGeneratedLink(data.accessLink)
      setSuccess(`Link generated successfully for ${data.userName}`)
    } catch (error) {
      console.error("Error generating link:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${message}\n\n${generatedLink}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const searchUser = async () => {
    if (!phoneNumber) {
      setError("Please enter a phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("users")
        .select("name, email")
        .eq("phone_number", phoneNumber)
        .single()

      if (error) {
        throw new Error("User not found with this phone number")
      }

      setSuccess(`Found user: ${data.name} (${data.email})`)
    } catch (error) {
      console.error("Error searching user:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Send Course Access Links</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Access Link</CardTitle>
            <CardDescription>
              Create a direct access link for registered users to access courses without login
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">User Phone Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter user's phone number"
                />
                <Button variant="outline" onClick={searchUser} disabled={loading}>
                  Verify
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message to send with the link"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateLink} disabled={loading} className="mr-2">
              {loading ? "Generating..." : "Generate Link"}
            </Button>
          </CardFooter>
        </Card>

        {generatedLink && (
          <Card>
            <CardHeader>
              <CardTitle>Access Link Generated</CardTitle>
              <CardDescription>Copy this link and send it to the user via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="mb-2">{message}</p>
                <p className="font-mono text-sm break-all">{generatedLink}</p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={copyToClipboard} variant="outline" className="flex items-center">
                  {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Message & Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
