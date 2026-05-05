"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Check, AlertCircle, Loader2, Star, Clock, Users, Gift, ShoppingCart, ArrowLeft, FileText } from "lucide-react"
import { RazorpayPaymentButton } from "@/components/razorpay-payment-button"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[] | null
  features_list: string[] | null
  has_discount: boolean
  discount_percentage: number | null
  original_price: number | null
  is_active: boolean
  whatsapp_group_link: string | null
}

interface ReferralDiscount {
  hasDiscount: boolean
  discount: number
  code?: string
}

export default function SubscribePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showDirectPayment, setShowDirectPayment] = useState(false)
  const [referralDiscount, setReferralDiscount] = useState<ReferralDiscount>({ hasDiscount: false, discount: 0 })
  const [loadingReferral, setLoadingReferral] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan")

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    setUserId(storedUserId)

    fetchSubscriptions()
  }, [])

  useEffect(() => {
    if (selectedSubscription && userId && showDirectPayment) {
      fetchReferralDiscount()
    }
  }, [selectedSubscription, userId, showDirectPayment])

  const fetchReferralDiscount = async () => {
    if (!userId || !selectedSubscription) return

    try {
      setLoadingReferral(true)
      const response = await fetch("/api/user-referral-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          subscriptionId: selectedSubscription.id,
        }),
      })

      const data = await response.json()
      console.log("[v0] Referral discount data:", data)
      setReferralDiscount(data)
    } catch (error) {
      console.error("[v0] Error fetching referral discount:", error)
      setReferralDiscount({ hasDiscount: false, discount: 0 })
    } finally {
      setLoadingReferral(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("price", { ascending: true })

      if (fetchError) {
        console.error("Database error:", fetchError)
        throw new Error(`Failed to load subscription plans: ${fetchError.message}`)
      }

      if (!data || data.length === 0) {
        setError("No subscription plans are currently available. Please check back later.")
        setSubscriptions([])
        return
      }

      console.log("[v0] Fetched subscriptions:", data)
      setSubscriptions(data)

      if (planId) {
        const targetSubscription = data.find((sub) => sub.id.toString() === planId)
        if (targetSubscription) {
          console.log("[v0] Plan ID found in URL, showing direct payment page for:", targetSubscription.name)
          setSelectedSubscription(targetSubscription)
          setShowDirectPayment(true)
        } else {
          setError(`Subscription plan not found.`)
        }
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err)
      setError(err instanceof Error ? err.message : "Failed to load subscription plans. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSubscriptionPeriod = (durationDays: number) => {
    if (durationDays === 30) return "Monthly"
    if (durationDays === 90) return "Quarterly"
    if (durationDays === 365) return "Annual"
    return `${durationDays} Days`
  }

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
    return ["Access to yoga sessions", "Progress tracking", "Email support"]
  }

  const getPopularBadge = (durationDays: number) => {
    if (durationDays === 90) return "Most Popular"
    if (durationDays === 365) return "Best Value"
    return null
  }

  const calculateFinalPrice = () => {
    if (!selectedSubscription) return 0

    // Start with original price (before any discounts)
    const basePrice =
      selectedSubscription.has_discount && selectedSubscription.original_price
        ? selectedSubscription.original_price
        : selectedSubscription.price

    let subscriptionDiscount = 0
    let referralDiscountAmount = 0

    // Calculate subscription discount (from original price)
    if (
      selectedSubscription.has_discount &&
      selectedSubscription.discount_percentage &&
      selectedSubscription.original_price
    ) {
      subscriptionDiscount = (basePrice * selectedSubscription.discount_percentage) / 100
    }

    // Calculate referral discount (from original price) - Option B: Additive
    if (referralDiscount.hasDiscount && referralDiscount.discount) {
      referralDiscountAmount = (basePrice * referralDiscount.discount) / 100
    }

    // Final price = original - both discounts
    const finalPrice = basePrice - subscriptionDiscount - referralDiscountAmount

    return {
      originalPrice: basePrice,
      subscriptionDiscount,
      referralDiscountAmount,
      finalPrice: Math.max(0, finalPrice),
    }
  }

  if (showDirectPayment && selectedSubscription && userId) {
    const features =
      selectedSubscription.features ||
      selectedSubscription.features_list ||
      getDefaultFeatures(selectedSubscription.duration_days)

    const priceBreakdown = calculateFinalPrice()

    return (
      <UserLayout>
        <div className="container mx-auto py-8 max-w-4xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
            <p className="text-gray-600">Review your plan details and proceed with payment</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedSubscription.name}</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <CardDescription>{selectedSubscription.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Original Price</span>
                        <span className="text-gray-500 line-through text-lg">
                          {formatPrice(priceBreakdown.originalPrice)}
                        </span>
                      </div>

                      {priceBreakdown.subscriptionDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">
                            Plan Discount ({selectedSubscription.discount_percentage}%)
                          </span>
                          <span className="text-green-700 font-medium">
                            -{formatPrice(priceBreakdown.subscriptionDiscount)}
                          </span>
                        </div>
                      )}

                      {referralDiscount.hasDiscount && priceBreakdown.referralDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-purple-700">
                            Referral Discount ({referralDiscount.discount}%) - {referralDiscount.code}
                          </span>
                          <span className="text-purple-700 font-medium">
                            -{formatPrice(priceBreakdown.referralDiscountAmount)}
                          </span>
                        </div>
                      )}

                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Final Price</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(priceBreakdown.finalPrice)}
                          </span>
                        </div>
                      </div>

                      {(priceBreakdown.subscriptionDiscount > 0 || priceBreakdown.referralDiscountAmount > 0) && (
                        <div className="text-sm text-green-700 mt-2 font-medium">
                          Total Savings:{" "}
                          {formatPrice(priceBreakdown.subscriptionDiscount + priceBreakdown.referralDiscountAmount)}!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Duration</span>
                    </div>
                    <span className="font-semibold">{selectedSubscription.duration_days} days</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Plan Type</span>
                    </div>
                    <span className="font-semibold">{getSubscriptionPeriod(selectedSubscription.duration_days)}</span>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                    <div className="space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl">Payment Details</CardTitle>
                <CardDescription>Secure payment powered by Razorpay</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Bill Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price</span>
                      <span
                        className={
                          priceBreakdown.subscriptionDiscount > 0 || priceBreakdown.referralDiscountAmount > 0
                            ? "line-through text-gray-500"
                            : "font-medium"
                        }
                      >
                        {formatPrice(priceBreakdown.originalPrice)}
                      </span>
                    </div>

                    {priceBreakdown.subscriptionDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Plan Discount</span>
                        <span>-{formatPrice(priceBreakdown.subscriptionDiscount)}</span>
                      </div>
                    )}

                    {referralDiscount.hasDiscount && priceBreakdown.referralDiscountAmount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Referral Code ({referralDiscount.code})</span>
                        <span>-{formatPrice(priceBreakdown.referralDiscountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total Amount</span>
                        <span className="font-bold text-green-600 text-lg">
                          {formatPrice(priceBreakdown.finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Terms & Conditions
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 max-h-48 overflow-y-auto">
                    <p>• Payment is non-refundable once the subscription is activated.</p>
                    <p>• Access to the course will be granted immediately after successful payment.</p>
                    <p>
                      • Subscription is valid for {selectedSubscription.duration_days} days from the date of activation.
                    </p>
                    <p>• You will receive access to all features mentioned in the plan.</p>
                    <p>• No automatic renewal - you can choose to renew manually.</p>
                    <p>• For any issues, please contact our support team.</p>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I agree to the terms and conditions
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  {!termsAccepted ? (
                    <Button disabled className="w-full h-12 text-base font-semibold">
                      Please Accept Terms & Conditions
                    </Button>
                  ) : (
                    <RazorpayPaymentButton
                      subscriptionId={selectedSubscription.id}
                      amount={priceBreakdown.finalPrice}
                      userId={userId}
                      duration={selectedSubscription.duration_days}
                      buttonText="Proceed to Payment"
                      notes={{
                        plan_name: selectedSubscription.name,
                        referral_code: referralDiscount.code || "",
                        original_price: priceBreakdown.originalPrice,
                        discount_applied: priceBreakdown.subscriptionDiscount + priceBreakdown.referralDiscountAmount,
                      }}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    />
                  )}
                </div>

                <div className="text-center pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Our support team is here to assist you with any questions about your subscription.
                </p>
                <Button variant="outline" onClick={() => router.push("/user/contact")}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    )
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading subscription plans...</p>
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (error) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Subscriptions</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 ml-0 block bg-transparent"
                onClick={fetchSubscriptions}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </UserLayout>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-lg">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Plans Available</h2>
              <p className="text-gray-600 mb-6">
                We're currently updating our subscription plans. Please check back soon for exciting new options!
              </p>
              <Button onClick={() => router.push("/user/dashboard")}>Return to Dashboard</Button>
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Yoga Journey</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect subscription plan that fits your wellness goals and schedule
          </p>
        </div>

        {selectedSubscription && (
          <Alert className="mb-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Selected Plan</AlertTitle>
            <AlertDescription className="text-blue-700">
              You've selected the <strong>{selectedSubscription.name}</strong> plan. You can change your selection below
              or proceed with payment.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {subscriptions.map((subscription) => {
            const features =
              subscription.features || subscription.features_list || getDefaultFeatures(subscription.duration_days)
            const popularBadge = getPopularBadge(subscription.duration_days)
            const isSelected = selectedSubscription?.id === subscription.id
            const isInactive = !subscription.is_active

            return (
              <Card
                key={subscription.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-green-500 shadow-lg" : ""
                } ${isInactive ? "opacity-75" : ""}`}
              >
                {popularBadge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    {popularBadge}
                  </div>
                )}

                {isInactive && (
                  <div className="absolute top-0 left-0 bg-gray-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
                    Currently Unavailable
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Star className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{subscription.name}</CardTitle>
                  <CardDescription className="text-gray-600 min-h-[3rem] flex items-center justify-center">
                    {subscription.description ||
                      `Perfect for your ${getSubscriptionPeriod(subscription.duration_days).toLowerCase()} yoga practice`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    {subscription.has_discount && subscription.original_price && subscription.discount_percentage ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl text-gray-500 line-through">
                            {formatPrice(subscription.original_price)}
                          </span>
                          <Badge variant="destructive" className="bg-red-500">
                            {subscription.discount_percentage}% OFF
                          </Badge>
                        </div>
                        <div className="text-4xl font-bold text-green-600">{formatPrice(subscription.price)}</div>
                        <div className="text-sm text-gray-500">
                          You save {formatPrice(subscription.original_price - subscription.price)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-green-600">{formatPrice(subscription.price)}</div>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{getSubscriptionPeriod(subscription.duration_days)} Plan</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{subscription.duration_days} days of access</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <h4 className="font-semibold text-center text-gray-900 mb-3">What's included:</h4>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {subscription.whatsapp_group_link && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">
                        ✨ Includes access to exclusive WhatsApp community
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  {isInactive ? (
                    <Button disabled className="w-full">
                      Currently Unavailable
                    </Button>
                  ) : isSelected ? (
                    <div className="w-full space-y-2">
                      {userId && (
                        <RazorpayPaymentButton
                          subscriptionId={subscription.id}
                          amount={subscription.price}
                          userId={userId}
                          duration={subscription.duration_days}
                          buttonText="Proceed to Payment"
                          notes={{
                            plan_name: subscription.name,
                          }}
                          className="w-full"
                        />
                      )}
                      <Button variant="outline" onClick={() => setSelectedSubscription(null)} className="w-full">
                        Choose Different Plan
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedSubscription(subscription)}
                      className="w-full"
                      variant={popularBadge ? "default" : "outline"}
                    >
                      Choose Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gray-50 p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-gray-600 mb-4">
              Our team is here to help you find the perfect plan for your yoga journey.
            </p>
            <Button variant="outline" onClick={() => router.push("/user/contact")}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
