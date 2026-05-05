"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import {
  AlertCircle,
  Calendar,
  XCircle,
  CreditCard,
  Info,
  Package,
  Check,
  PlayCircle,
  PauseCircle,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  id: string
  user_id: string
  subscription_id: string
  start_date: string
  end_date: string
  is_active: boolean
  activation_date: string | null
  admin_activated: boolean
  total_active_days_used?: number
  paused_days?: number
  last_status_change?: string
  effective_end_date?: string
  subscription?: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    features?: string[] | null
    features_list?: string[] | null
    has_discount?: boolean
    discount_percentage?: number
    original_price?: number
    is_active?: boolean
  }
}

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [currentSubscriptions, setCurrentSubscriptions] = useState<Subscription[]>([])
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/user/login")
      return
    }

    fetchUserSubscriptions()
  }, [router])

  const fetchUserSubscriptions = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const supabase = getSupabaseBrowserClient()

      // First, trigger a subscription day update
      try {
        await fetch("/api/update-subscription-days", { method: "POST" })
      } catch (updateError) {
        console.log("Update API not available, continuing with current data")
      }

      const { data: userSubs, error: userSubsError } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription:subscriptions!inner (
            id,
            name,
            description,
            price,
            duration_days,
            features,
            features_list,
            has_discount,
            discount_percentage,
            original_price,
            is_active
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (userSubsError) {
        console.error("Error fetching user subscriptions:", userSubsError)
        throw new Error(`Database error: ${userSubsError.message}`)
      }

      if (!userSubs || userSubs.length === 0) {
        setSubscriptions([])
        setCurrentSubscriptions([])
        setExpiredSubscriptions([])
        setLoading(false)
        return
      }

      // Process subscriptions with status based on is_active column
      const subscriptionsWithStatus = userSubs.map((sub) => {
        const daysLeft = sub.days_left ?? 0
        const durationDays = sub.subscription?.duration_days || 30

        const totalActiveDaysUsed = Math.min(sub.total_active_days_used || 0, durationDays)
        const remainingDays = daysLeft > 0 ? daysLeft : Math.max(0, durationDays - totalActiveDaysUsed)

        // Check if subscription plan is active (controlled by admin)
        const subscriptionPlanActive = sub.subscription?.is_active !== false

        // Simple logic: use is_active column directly
        const isCurrentlyActive = sub.is_active === true
        const isExpired = totalActiveDaysUsed >= durationDays

        // Calculate actual days since activation for display
        let actualDaysSinceActivation = 0
        if (sub.activation_date) {
          const activationDate = new Date(sub.activation_date)
          const today = new Date()
          actualDaysSinceActivation =
            Math.floor((today.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        return {
          ...sub,
          remaining_days: remainingDays,
          total_active_days_used: totalActiveDaysUsed,
          is_expired: isExpired,
          is_current_active: isCurrentlyActive,
          subscription_plan_active: subscriptionPlanActive,
          actual_days_since_activation: actualDaysSinceActivation,
          status: getSubscriptionStatus(sub, isExpired, subscriptionPlanActive),
        }
      })

      // Separate based on is_active column and expiry
      const current = subscriptionsWithStatus.filter((sub) => !sub.is_expired)
      const expired = subscriptionsWithStatus.filter((sub) => sub.is_expired)

      setSubscriptions(subscriptionsWithStatus)
      setCurrentSubscriptions(current)
      setExpiredSubscriptions(expired)
    } catch (err) {
      console.error("Failed to load subscriptions:", err)
      setError(`Failed to load your subscriptions: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSubscriptions = async () => {
    setUpdating(true)
    await fetchUserSubscriptions()
    setUpdating(false)
  }

  // Get subscription status based on is_active column and expiry
  const getSubscriptionStatus = (subscription: any, isExpiredByDays: boolean, subscriptionPlanActive: boolean) => {
    // First check if subscription plan itself is inactive (admin turned off)
    if (!subscriptionPlanActive) {
      return {
        text: "Plan Inactive",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        icon: AlertCircle,
        description: "This subscription plan is temporarily unavailable. Wait for admin to activate it.",
      }
    }

    // Then check if truly expired (all days used)
    if (isExpiredByDays) {
      return {
        text: "Expired",
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: XCircle,
        description: "All subscription days have been used up",
      }
    }

    // Use is_active column directly for status
    if (subscription.is_active === true) {
      return {
        text: "Active",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: PlayCircle,
        description: "Your subscription is currently active and counting days",
      }
    } else {
      return {
        text: "Inactive",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        icon: PauseCircle,
        description: "Your subscription is paused - days are not being counted",
      }
    }
  }

  // Check if a subscription allows access to content
  const canAccessContent = (subscription: any): boolean => {
    return (
      !subscription.is_expired && subscription.is_active === true && subscription.subscription_plan_active !== false
    )
  }

  // Get subscription period text
  const getSubscriptionPeriod = (durationDays: number | undefined) => {
    if (!durationDays) return "Subscription"

    if (durationDays === 30) return "Monthly Subscription"
    if (durationDays === 90) return "Quarterly Subscription"
    if (durationDays === 365) return "Annual Subscription"

    return `${durationDays}-Day Subscription`
  }

  // Get default features based on subscription duration
  const getDefaultFeatures = (durationDays: number) => {
    if (durationDays === 30) {
      return ["Access to all basic yoga sessions", "Monthly progress tracking", "Email support"]
    } else if (durationDays === 90) {
      return [
        "Access to all basic and intermediate yoga sessions",
        "Quarterly progress tracking",
        "Priority email support",
        "Access to community forums",
      ]
    } else if (durationDays === 365) {
      return [
        "Access to all yoga sessions (basic, intermediate, advanced)",
        "Annual progress tracking",
        "Priority email and phone support",
        "Access to community forums",
        "Exclusive workshops and events",
      ]
    }
    return ["Access to yoga sessions"]
  }

  // Format currency to show only whole numbers (no decimal places)
  const formatWholePrice = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">My Subscriptions</h1>
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">My Subscriptions</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshSubscriptions}
              disabled={updating}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Updating..." : "Refresh"}
            </Button>
            <Button asChild className="flex items-center gap-2">
              <Link href="/user/plans">
                <Package className="h-4 w-4" />
                View Available Plans
              </Link>
            </Button>
          </div>
        </div>

        {/* Subscription Status Explanation */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">How Subscription Status Works</AlertTitle>
          <AlertDescription className="text-blue-700 space-y-2">
            <div className="grid gap-2 mt-2">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Active:</strong> Days are being counted daily (1 day per 24 hours)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PauseCircle className="h-4 w-4 text-amber-500" />
                <span>
                  <strong>Inactive:</strong> Day counting is paused, remaining days are preserved
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>
                  <strong>Expired:</strong> All subscription days have been used up
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>
                  <strong>Plan Inactive:</strong> This subscription plan is temporarily unavailable
                </span>
              </div>
            </div>
            <p className="text-sm mt-3 p-3 bg-blue-100 rounded-md">
              <strong>Note:</strong> Only active subscriptions count days. When inactive, your remaining days are saved
              for when it becomes active again. Plan inactive subscriptions are paused and will not count days until
              reactivated.
            </p>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {subscriptions.length === 0 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>No Subscriptions Found</CardTitle>
                <CardDescription>
                  You don't have any subscriptions yet. Subscribe to a plan to access our premium content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Explore Our Plans</h3>
                  <p className="text-center text-muted-foreground mb-6">
                    Choose from our range of subscription plans designed to meet your yoga journey needs.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/user/plans">Browse Subscription Plans</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="current">
            <TabsList className="mb-6">
              <TabsTrigger value="current">Current ({currentSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredSubscriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {currentSubscriptions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Current Subscriptions</CardTitle>
                    <CardDescription>
                      All your subscriptions have expired. Subscribe to a new plan to continue accessing our content.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild>
                      <Link href="/user/plans">Browse Plans</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentSubscriptions.map((subscription) => {
                    const status = subscription.status
                    const StatusIcon = status.icon
                    const canAccess = canAccessContent(subscription)

                    // Get features from subscription or use defaults
                    const features =
                      subscription.subscription?.features ||
                      subscription.subscription?.features_list ||
                      (subscription.subscription?.duration_days
                        ? getDefaultFeatures(subscription.subscription.duration_days)
                        : ["Access to yoga sessions"])

                    return (
                      <Card
                        key={subscription.id}
                        className={`overflow-hidden border-2 ${
                          canAccess
                            ? "border-green-200"
                            : status.text === "Inactive"
                              ? "border-amber-200"
                              : "border-gray-200"
                        }`}
                      >
                        <div
                          className={`h-3 w-full ${
                            canAccess ? "bg-green-500" : status.text === "Inactive" ? "bg-amber-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg">
                              {subscription.subscription?.name || "Subscription"}
                            </CardTitle>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.text}
                            </span>
                          </div>
                          <CardDescription>
                            {subscription.subscription?.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 pt-2">
                            {subscription.subscription?.price !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Price:</span>
                                {subscription.subscription.has_discount &&
                                subscription.subscription.original_price &&
                                subscription.subscription.discount_percentage ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground line-through">
                                        {formatWholePrice(subscription.subscription.original_price)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700"
                                      >
                                        {subscription.subscription.discount_percentage}% OFF
                                      </Badge>
                                    </div>
                                    <span className="font-semibold">
                                      {formatWholePrice(subscription.subscription.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-semibold">
                                    {formatWholePrice(subscription.subscription.price)}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Type:</span>
                              <span className="text-gray-700">
                                {getSubscriptionPeriod(subscription.subscription?.duration_days)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Purchase Date:</span>
                              <span>{formatDate(subscription.start_date)}</span>
                            </div>
                            {subscription.activation_date && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Activation Date:</span>
                                <span>{formatDate(subscription.activation_date)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Days Used:</span>
                              <span className="font-medium">
                                {subscription.total_active_days_used || 0} /{" "}
                                {subscription.subscription?.duration_days || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Remaining Days:</span>
                              <span className={`font-medium ${status.color}`}>
                                {subscription.remaining_days || 0} days
                              </span>
                            </div>
                            {subscription.activation_date && subscription.actual_days_since_activation > 0 && (
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Actual days since activation:</span>
                                <span>{subscription.actual_days_since_activation} days</span>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>
                                {Math.round(
                                  ((subscription.total_active_days_used || 0) /
                                    (subscription.subscription?.duration_days || 1)) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  canAccess
                                    ? "bg-green-500"
                                    : status.text === "Inactive"
                                      ? "bg-amber-500"
                                      : "bg-gray-400"
                                }`}
                                style={{
                                  width: `${Math.min(((subscription.total_active_days_used || 0) / (subscription.subscription?.duration_days || 1)) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Status explanation */}
                          <div className={`mt-4 p-3 rounded-md ${status.bgColor}`}>
                            <p className={`text-sm ${status.color}`}>
                              <strong>{status.text}:</strong> {status.description}
                            </p>
                            {subscription.activation_date && (
                              <p className={`text-xs mt-1 ${status.color}`}>
                                {status.text === "Active"
                                  ? `Activated on ${formatDate(subscription.activation_date)} • Days counting daily`
                                  : `Activated on ${formatDate(subscription.activation_date)} • Days preserved while inactive`}
                              </p>
                            )}
                          </div>

                          {/* Features section */}
                          {features && features.length > 0 && (
                            <div className={`mt-4 pt-4 border-t ${canAccess ? "border-green-100" : "border-gray-200"}`}>
                              <h4
                                className={`font-medium text-sm mb-3 ${canAccess ? "text-green-700" : "text-gray-600"}`}
                              >
                                What's included:
                              </h4>
                              <ul className="space-y-2">
                                {features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <Check
                                      className={`h-4 w-4 mr-2 shrink-0 mt-0.5 ${canAccess ? "text-green-500" : "text-gray-400"}`}
                                    />
                                    <span className={`text-sm ${canAccess ? "" : "text-gray-500"}`}>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2">
                          {canAccess ? (
                            <div className="flex justify-between gap-2 w-full">
                              <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                                <Link href="/user/access-course">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  Access Content
                                </Link>
                              </Button>
                              <Button size="sm" className="flex-1" asChild>
                                <Link href="/user/dashboard">Dashboard</Link>
                              </Button>
                            </div>
                          ) : (
                            <Alert className={`w-full ${status.bgColor} border-current`}>
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                              <AlertDescription className={`${status.color} text-xs`}>
                                {status.description}
                                {status.text === "Plan Inactive" && " Contact support if this persists."}
                                {status.text === "Inactive" && " Your remaining days are preserved."}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expired">
              {expiredSubscriptions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Expired Subscriptions</CardTitle>
                    <CardDescription>You don't have any expired subscriptions.</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {expiredSubscriptions.map((subscription) => (
                    <Card key={subscription.id} className="overflow-hidden border-gray-200 opacity-75">
                      <div className="h-3 bg-red-400 w-full"></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg text-gray-600">
                            {subscription.subscription?.name || "Subscription"}
                          </CardTitle>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="mr-1 h-3 w-3" />
                            Expired
                          </span>
                        </div>
                        <CardDescription>
                          {subscription.subscription?.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 pt-2">
                          {subscription.subscription?.price !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-500">Price:</span>
                              <span className="text-gray-600">{formatWholePrice(subscription.subscription.price)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Type:</span>
                            <span className="text-gray-600">
                              {getSubscriptionPeriod(subscription.subscription?.duration_days)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Activated:</span>
                            <span className="text-gray-600">
                              {formatDate(subscription.activation_date || subscription.start_date)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Days Used:</span>
                            <span className="text-gray-600">
                              {subscription.total_active_days_used || 0} /{" "}
                              {subscription.subscription?.duration_days || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Final Status:</span>
                            <span className="text-red-600 font-medium">All days used - Expired</span>
                          </div>
                        </div>

                        {/* Full progress bar for expired */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Completed</span>
                            <span>100%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full w-full"></div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-md bg-red-50">
                          <p className="text-sm text-red-700">
                            <strong>Expired:</strong> This subscription has used all{" "}
                            {subscription.subscription?.duration_days} days
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button className="w-full" asChild>
                          <Link href="/user/plans">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Renew Subscription
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </UserLayout>
  )
}
