"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { InstructorLayout } from "@/components/instructor-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function InstructorProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [instructorId, setInstructorId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    dob: "",
    specialization: "",
    bio: "",
    profile_image: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  useEffect(() => {
    const id = localStorage.getItem("instructorId")
    if (id) {
      setInstructorId(Number.parseInt(id))
      fetchInstructorData(Number.parseInt(id))
    }
  }, [])

  const fetchInstructorData = async (id: number) => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("instructors").select("*").eq("id", id).single()

      if (error) throw error

      if (data) {
        setFormData({
          ...formData,
          name: data.name || "",
          phone_number: data.phone_number || "",
          email: data.email || "",
          dob: data.dob ? data.dob.split("T")[0] : "",
          specialization: data.specialization || "",
          bio: data.bio || "",
          profile_image: data.profile_image || "",
        })
      }
    } catch (error) {
      console.error("Error fetching instructor data:", error)
      setError("Failed to load your profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!instructorId) {
        throw new Error("Instructor ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Prepare update data (exclude password fields)
      const updateData = {
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email,
        dob: formData.dob,
        specialization: formData.specialization,
        bio: formData.bio,
        profile_image: formData.profile_image,
      }

      // Update profile information
      const { error: updateError } = await supabase.from("instructors").update(updateData).eq("id", instructorId)

      if (updateError) throw updateError

      // Handle password change if requested
      if (formData.new_password && formData.current_password) {
        // Verify current password
        const { data: passwordData, error: passwordError } = await supabase
          .from("instructors")
          .select("password")
          .eq("id", instructorId)
          .single()

        if (passwordError) throw passwordError

        if (passwordData.password !== formData.current_password) {
          throw new Error("Current password is incorrect")
        }

        if (formData.new_password !== formData.confirm_password) {
          throw new Error("New passwords do not match")
        }

        // Update password
        const { error: pwUpdateError } = await supabase
          .from("instructors")
          .update({ password: formData.new_password })
          .eq("id", instructorId)

        if (pwUpdateError) throw pwUpdateError
      }

      // Update local storage with new name if changed
      if (formData.name !== localStorage.getItem("instructorName")) {
        localStorage.setItem("instructorName", formData.name)
      }

      // Update profile image in local storage if changed
      if (formData.profile_image !== localStorage.getItem("instructorProfileImage")) {
        localStorage.setItem("instructorProfileImage", formData.profile_image || "")
      }

      setSuccess("Profile updated successfully")

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }))
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <div className="h-4 w-4 text-green-600">✓</div>
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            <Card>
              <form onSubmit={handleProfileUpdate}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="E.g., Hatha Yoga, Meditation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell students about yourself and your teaching style"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_image">Profile Image URL</Label>
                    <Input
                      id="profile_image"
                      name="profile_image"
                      value={formData.profile_image}
                      onChange={handleChange}
                      placeholder="URL to your profile image"
                    />
                    <p className="text-xs text-gray-500">Enter a URL to an image (JPG, PNG) for your profile picture</p>
                  </div>
                </CardContent>

                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Leave blank if you don't want to change your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        name="current_password"
                        type="password"
                        value={formData.current_password}
                        onChange={handleChange}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        name="new_password"
                        type="password"
                        value={formData.new_password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </>
        )}
      </div>
    </InstructorLayout>
  )
}
