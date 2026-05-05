"use client"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, FileText, Home } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"

interface SubscriptionDetails {
  id: number
  start_date: string
  end_date: string
  subscription: {
    name: string
  }
}

export default function PaymentSuccessPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (!userId) {
      window.location.href = "/user/login"
      return
    }

    async function fetchLatestSubscription() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get the most recent subscription for this user
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select(`
            id,
            start_date,
            end_date,
            subscription:subscription_id(name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (!error && data) {
          setSubscription(data)
        }
      } catch (err) {
        console.error("Error fetching subscription:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestSubscription()
  }, [])

  return (
    <UserLayout>
      <div className="container mx-auto py-12 max-w-2xl">
        <Card className="border-green-100">
          <div className="h-2 bg-green-600 w-full"></div>
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>Your subscription has been activated successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-center">
                Thank you for subscribing to our services. Your payment has been processed and your subscription is now
                active.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            ) : subscription ? (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-lg">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{subscription.subscription.name}</span>

                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{formatDate(subscription.start_date)}</span>

                  <span className="text-muted-foreground">End Date:</span>
                  <span>{formatDate(subscription.end_date)}</span>
                </div>
              </div>
            ) : null}

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Important Information</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>You can now access all content included in your subscription.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>
                    Remember that your login credentials and access links are for your personal use only and should not
                    be shared.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>As per our terms and conditions, this payment is non-refundable.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>A confirmation email with your receipt has been sent to your registered email address.</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/user/access-course">
                <Calendar className="mr-2 h-4 w-4" />
                Access Course
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/user/subscriptions">
                <FileText className="mr-2 h-4 w-4" />
                View Subscriptions
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/user/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </UserLayout>
  )
}
