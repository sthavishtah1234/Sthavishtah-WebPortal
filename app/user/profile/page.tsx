"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Eye, EyeOff, User, Mail, Phone, Calendar, CheckCircle, AlertCircle } from "lucide-react"

interface UserProfile {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
}

export default function UserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  async function fetchUserProfile() {
    try {
      setLoading(true)
      setError(null)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      const { data, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (fetchError) throw fetchError

      setUser(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("Failed to load user profile. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setSuccess(null)
    setIsChangingPassword(true)

    try {
      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("All password fields are required")
        return
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match")
        return
      }

      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long")
        return
      }

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // First verify the current password
      const { data: userData, error: verifyError } = await supabase
        .from("users")
        .select("password")
        .eq("id", userId)
        .single()

      if (verifyError) throw verifyError

      // In a real app, you'd use proper password hashing and verification
      // This is a simplified version for demonstration
      if (userData.password !== currentPassword) {
        setError("Current password is incorrect")
        return
      }

      // Update the password
      const { error: updateError } = await supabase.from("users").update({ password: newPassword }).eq("id", userId)

      if (updateError) throw updateError

      // Clear the form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSuccess("Password updated successfully")
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Failed to change password. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getBatchLabel = (batchValue: string | null) => {
    if (!batchValue) return "No preference"

    const batchLabels = {
      morning: "Morning (6:00 AM - 7:00 AM)",
      sunrise: "Sunrise (8:00 AM - 9:00 AM)",
      evening: "Evening (5:30 PM - 6:30 PM)",
      night: "Night (7:00 PM - 8:00 PM)",
      weekend_morning: "Weekend Morning (9:00 AM - 10:00 AM)",
      weekend_evening: "Weekend Evening (5:00 PM - 6:00 PM)",
      "1": "Morning Batch 1 (5:30 to 6:30)",
      "2": "Morning Batch 2 (6:40 to 7:40)",
      "3": "Morning Batch 3 (7:50 to 8:50)",
      "4": "Evening Batch 4 (5:30 to 6:30)",
      "5": "Evening Batch 5 (6:40 to 7:40)",
      "6": "Evening Batch 6 (7:50 to 8:50)",
    }

    return batchLabels[batchValue] || batchValue
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Profile Information</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Your personal details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-4">Loading profile information...</div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : user ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                      <User className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{user.phone_number}</p>
                      </div>
                    </div>

                    {user.whatsapp_number && (
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                        <Phone className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">WhatsApp Number</p>
                          <p className="font-medium">{user.whatsapp_number}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Preferred Batch</p>
                        <p className="font-medium">{getBatchLabel(user.preferred_batch)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border rounded-md">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="font-medium">{formatDate(user.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">No profile information found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
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

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Updating..." : "Change Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  )
}
