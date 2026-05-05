"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail } from "lucide-react"
import { countries } from "@/lib/utils"

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
  country: string | null
}

export default function EditUser({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = Number.parseInt(params.id)

  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [preferredBatch, setPreferredBatch] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) throw error

      if (data) {
        setUser(data)
        setName(data.name)
        setEmail(data.email)
        setPhoneNumber(data.phone_number)
        setWhatsappNumber(data.whatsapp_number || "")
        setPreferredBatch(data.preferred_batch || "")
        setCountry(data.country || "India") // Default to India if not set
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)
      const supabase = getSupabaseBrowserClient()

      // Check if phone number is already in use by another user
      if (phoneNumber !== user?.phone_number) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("phone_number", phoneNumber)
          .neq("id", userId)
          .single()

        if (!checkError && existingUser) {
          setErrors({
            ...errors,
            phoneNumber: "This phone number is already in use by another user",
          })
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          name,
          email,
          phone_number: phoneNumber,
          whatsapp_number: whatsappNumber || null,
          preferred_batch: preferredBatch || null,
          country,
        })
        .eq("id", userId)

      if (error) throw error

      router.push("/admin/users")
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setSaving(false)
    }
  }

  const sendPasswordEmail = async () => {
    if (!user) return

    try {
      setSendingEmail(true)
      setEmailStatus(null)

      // Get admin password from localStorage (this is just a simple implementation)
      const adminPassword = localStorage.getItem("adminPassword") || ""

      const response = await fetch("/api/send-password-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          adminPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailStatus({
          type: "success",
          message: "Password email sent successfully!",
        })
      } else {
        setEmailStatus({
          type: "error",
          message: data.message || "Failed to send password email",
        })
      }
    } catch (error) {
      console.error("Error sending password email:", error)
      setEmailStatus({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading user data...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>User not found</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit User</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Update user information for {user.user_id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User ID (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input id="user-id" value={user.user_id} disabled readOnly />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter user's name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter user's email"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter user's phone number"
                />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                <Input
                  id="whatsapp"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Enter user's WhatsApp number if different"
                />
                {errors.whatsappNumber && <p className="text-sm text-red-500">{errors.whatsappNumber}</p>}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Batch */}
              <div className="space-y-2">
                <Label htmlFor="batch">Preferred Batch</Label>
                <Select value={preferredBatch} onValueChange={setPreferredBatch}>
                  <SelectTrigger id="batch">
                    <SelectValue placeholder="Select preferred batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="morning-batch-1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                    <SelectItem value="morning-batch-2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                    <SelectItem value="morning-batch-3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                    <SelectItem value="evening-batch-4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                    <SelectItem value="evening-batch-5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                    <SelectItem value="evening-batch-6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center">
                  <Label>Password Management</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendPasswordEmail}
                    disabled={saving || sendingEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {sendingEmail ? "Sending..." : "Send Password Email"}
                  </Button>
                </div>
                {emailStatus && (
                  <Alert variant={emailStatus.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>{emailStatus.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
