"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/db"
import { SubscriptionDetails } from "@/components/subscription/subscription-details"
import { isInstructorLoggedIn } from "@/lib/auth-client"

export default function SubscriptionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isInstructorLoggedIn()) {
      router.replace("/instructor/login")
      return
    }
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await db
        .from("subscriptions")
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .eq("id", params.id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setSubscription(data)
    } catch (err) {
      console.error("Error fetching subscription:", err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Loading subscription details...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Subscription not found.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-md border bg-muted p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          This subscription is managed by an administrator. You have read-only access.
        </p>
      </div>
      <SubscriptionDetails subscription={subscription} readOnly={true} />
    </div>
  )
}
