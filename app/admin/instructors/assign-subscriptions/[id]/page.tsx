"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, User, Settings } from "lucide-react"
import Link from "next/link"

interface Instructor {
  id: number
  instructor_id: string
  name: string
  email: string
  phone_number: string
  specialization: string
}

interface Subscription {
  id: number
  name: string
  price: number
  duration_months: number
  features: string[] | string
  description: string
  active: boolean
}

interface SubscriptionAccess {
  subscription_id: number
  has_access: boolean
}

export default function AssignSubscriptionsPage() {
  const params = useParams()
  const router = useRouter()
  const instructorId = Number.parseInt(params.id as string)

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [currentAccess, setCurrentAccess] = useState<SubscriptionAccess[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (instructorId) {
      fetchData()
    }
  }, [instructorId])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch instructor details
      const instructorResponse = await fetch(`/api/instructors/${instructorId}`)
      const instructorResult = await instructorResponse.json()

      if (!instructorResult.success) {
        throw new Error(instructorResult.error || "Failed to fetch instructor")
      }

      setInstructor(instructorResult.data)

      // Fetch all subscriptions
      const subscriptionsResponse = await fetch("/api/subscriptions")
      const subscriptionsResult = await subscriptionsResponse.json()

      if (subscriptionsResult.success) {
        setSubscriptions(subscriptionsResult.data || [])
      }

      // Fetch current access
      const accessResponse = await fetch(`/api/instructors/subscription-access/${instructorId}`)
      const accessResult = await accessResponse.json()

      if (accessResult.success) {
        setCurrentAccess(accessResult.data || [])
        // Set initially selected subscriptions
        const accessibleIds =
          accessResult.data
            ?.filter((access: SubscriptionAccess) => access.has_access)
            .map((access: SubscriptionAccess) => access.subscription_id) || []
        setSelectedSubscriptions(accessibleIds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/instructors/assign-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructor_id: instructorId,
          subscription_ids: selectedSubscriptions,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess("Subscription access updated successfully!")
        // Refresh the current access data
        await fetchData()
      } else {
        setError(result.error || "Failed to update subscription access")
      }
    } catch (err) {
      setError("An error occurred while saving")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleSubscriptionToggle(subscriptionId: number, checked: boolean) {
    if (checked) {
      setSelectedSubscriptions([...selectedSubscriptions, subscriptionId])
    } else {
      setSelectedSubscriptions(selectedSubscriptions.filter((id) => id !== subscriptionId))
    }
  }

  function formatFeatures(features: string[] | string): string {
    if (Array.isArray(features)) {
      return features.join(", ")
    }
    if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features)
        return Array.isArray(parsed) ? parsed.join(", ") : features
      } catch {
        return features
      }
    }
    return "No features listed"
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!instructor) {
    return (
      <AdminLayout>
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">Instructor not found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/instructors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Instructors
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin/instructors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Assign Subscriptions</h1>
              <p className="text-gray-600">Manage subscription access for {instructor.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-500">
            <CardContent className="pt-6">
              <p className="text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Instructor Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{instructor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{instructor.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{instructor.phone_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Specialization</p>
                <p className="font-medium">{instructor.specialization || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Subscription Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No subscriptions available</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => {
                  const isSelected = selectedSubscriptions.includes(subscription.id)
                  const currentlyHasAccess =
                    currentAccess.find((access) => access.subscription_id === subscription.id)?.has_access || false

                  return (
                    <div
                      key={subscription.id}
                      className={`border rounded-lg p-4 ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`subscription-${subscription.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSubscriptionToggle(subscription.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={`subscription-${subscription.id}`}
                              className="text-lg font-medium cursor-pointer"
                            >
                              {subscription.name}
                            </label>
                            <div className="flex items-center space-x-2">
                              {currentlyHasAccess && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Currently Has Access
                                </span>
                              )}
                              <span className="text-lg font-bold text-blue-600">₹{subscription.price}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-1">{subscription.description}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            <span>Duration: {subscription.duration_months} months</span>
                            {subscription.features && (
                              <span className="ml-4">Features: {formatFeatures(subscription.features)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
