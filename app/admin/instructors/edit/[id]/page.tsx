"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InstructorData {
  id: number
  instructor_id: string
  name: string
  phone_number: string
  email: string
  dob: string
  password: string
  specialization: string
  bio: string
  profile_image: string
  // Add potential new fields
  qualification?: string
  experience_years?: string | number
  hourly_rate?: string | number
  status?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  emergency_contact?: string
  emergency_phone?: string
  join_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
  [key: string]: any // Allow for any additional fields
}

export default function EditInstructorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState<InstructorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstructor() {
      try {
        setFetchLoading(true)
        const response = await fetch(`/api/instructors/${params.id}`)
        const result = await response.json()

        if (result.success) {
          setFormData(result.data)
        } else {
          setError(result.error || "Failed to fetch instructor")
        }
      } catch (err) {
        setError("An error occurred while fetching the instructor")
        console.error(err)
      } finally {
        setFetchLoading(false)
      }
    }

    fetchInstructor()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return

    const { name, value } = e.target
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData) return

    // Basic validation
    if (!formData.name) {
      setError("Name is required")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/instructors/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        router.push("/admin/instructors")
      } else {
        setError(result.error || "Failed to update instructor")
      }
    } catch (err) {
      setError("An error occurred while updating the instructor")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!formData) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Edit Instructor</h1>
            <Button variant="outline" asChild>
              <Link href="/admin/instructors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Instructors
              </Link>
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Instructor not found or failed to load</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Edit Instructor</h1>
          <Button variant="outline" asChild>
            <Link href="/admin/instructors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Instructors
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructor Details</CardTitle>
            <p className="text-sm text-gray-500">Instructor ID: {formData.instructor_id}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter instructor name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob ? formData.dob.split("T")[0] : ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  <p className="text-xs text-gray-500">Leave blank to keep current password</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization || ""}
                    onChange={handleChange}
                    placeholder="E.g., Hatha Yoga, Meditation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  placeholder="Enter instructor bio"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_image">Profile Image URL</Label>
                <Input
                  id="profile_image"
                  name="profile_image"
                  value={formData.profile_image || ""}
                  onChange={handleChange}
                  placeholder="Enter profile image URL"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualifications</Label>
                  <Input
                    id="qualification"
                    name="qualification"
                    value={formData.qualification || ""}
                    onChange={handleChange}
                    placeholder="Enter qualifications"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    value={formData.experience_years || ""}
                    onChange={handleChange}
                    placeholder="Enter years of experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    value={formData.hourly_rate || ""}
                    onChange={handleChange}
                    placeholder="Enter hourly rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || "active"}
                    onChange={handleChange as any}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  name="join_date"
                  type="date"
                  value={formData.join_date ? formData.join_date.split("T")[0] : ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Instructor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
