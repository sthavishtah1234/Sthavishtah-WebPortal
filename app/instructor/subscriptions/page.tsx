"use client"

import { useState, useEffect } from "react"
import { InstructorLayout } from "@/components/instructor-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { Users, ArrowRight, Info, BookOpen } from "lucide-react"

export default function InstructorSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Fetch all active subscriptions (instructors can see all available plans)
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
        id,
        name,
        description,
        price,
        is_active,
        features
      `)
        .eq("is_active", true)
        .order("price", { ascending: true })

      if (error) throw error

      // For each subscription, get the count of users and courses by this instructor
      const instructorId = localStorage.getItem("instructorId")
      const subscriptionsWithCounts = await Promise.all(
        (data || []).map(async (subscription) => {
          // Get user count for this subscription
          const { count: userCount, error: userCountError } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)

          // Get course count for this subscription by this instructor
          const { count: courseCount, error: courseCountError } = await supabase
            .from("courses")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)
            .eq("instructor_id", instructorId)

          if (userCountError || courseCountError) {
            console.error("Error fetching counts:", userCountError || courseCountError)
          }

          return {
            ...subscription,
            userCount: userCount || 0,
            myCourseCount: courseCount || 0,
          }
        }),
      )

      setSubscriptions(subscriptionsWithCounts)
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error)
      setError(error.message || "Failed to load subscriptions")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format price display
  const formatPrice = (price: number | string) => {
    if (price === undefined || price === null) return "Free"
    return `₹${price}`
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-gray-500">View available subscription plans (managed by admin)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading subscriptions</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-9 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">No active subscriptions found</h2>
            <p className="text-gray-600 mt-2">There are no active subscription plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>{subscription.name}</CardTitle>
                  <CardDescription>{subscription.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-2xl font-bold mb-4">{formatPrice(subscription.price)}</div>

                  {subscription.features && typeof subscription.features === "string" && (
                    <div className="space-y-2 mb-4">
                      {subscription.features.split(",").map((feature: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-sm">{feature.trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{subscription.userCount} active users</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{subscription.myCourseCount} courses by you</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/instructor/subscriptions/${subscription.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  )
}
