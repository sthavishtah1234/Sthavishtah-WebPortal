"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RazorpayPaymentButtonProps {
  amount: number
  subscriptionId: number | string
  userId: string
  duration?: number
  buttonText?: string
  className?: string
  notes?: Record<string, string>
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export function RazorpayPaymentButton({
  amount,
  subscriptionId,
  userId,
  duration,
  buttonText = "Pay Now",
  className = "",
  notes = {},
  onSuccess,
  onError,
}: RazorpayPaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const router = useRouter()

  const [userData, setUserData] = useState<{
    name: string
    email: string
    phone: string
  } | null>(null)

  useEffect(() => {
    // Fetch user data for prefill
    async function fetchUserData() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("users")
          .select("name, email, phone_number")
          .eq("id", userId)
          .single()

        if (data && !error) {
          setUserData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone_number || "",
          })
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId])

  useEffect(() => {
    // Fetch Razorpay key
    async function fetchRazorpayKey() {
      try {
        const response = await fetch("/api/razorpay/get-key")
        const data = await response.json()

        if (data.key) {
          setRazorpayKey(data.key)
        } else {
          setError("Failed to load payment gateway. Please try again later.")
        }
      } catch (err) {
        console.error("Error fetching Razorpay key:", err)
        setError("Failed to initialize payment gateway. Please try again later.")
      }
    }

    fetchRazorpayKey()
  }, [])

  const createOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Creating order with amount:", amount, "subscriptionId:", subscriptionId)

      // Create an order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          subscriptionId,
          userId,
          notes: {
            ...notes,
            duration: duration ? duration.toString() : "",
          },
        }),
      })

      console.log("[v0] Order response status:", orderResponse.status)
      console.log("[v0] Order response content-type:", orderResponse.headers.get("content-type"))

      const contentType = orderResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await orderResponse.text()
        console.error("[v0] Non-JSON response:", textResponse)
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}`)
      }

      const orderData = await orderResponse.json()
      console.log("[v0] Order data:", orderData)

      if (!orderResponse.ok) {
        throw new Error(orderData.error || orderData.details || "Failed to create order")
      }

      if (!orderData.success || !orderData.order) {
        throw new Error(orderData.error || orderData.details || "Failed to create order")
      }

      // Store order in database
      const supabase = getSupabaseBrowserClient()
      await supabase.from("razorpay_orders").insert([
        {
          order_id: orderData.order.id,
          user_id: userId,
          subscription_id: subscriptionId,
          amount: amount,
          duration_days: duration || 0,
          status: "created",
        },
      ])

      return orderData.order
    } catch (err) {
      console.error("[v0] Error creating order:", err)
      setError(err instanceof Error ? err.message : "Failed to create order. Please try again.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!razorpayKey) {
      setError("Payment gateway not initialized. Please try again later.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create an order
      const order = await createOrder()
      setOrderId(order.id)

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "Sthavishtah Yoga",
        description: `Subscription: ${notes.plan_name || "Yoga Plan"}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,
                subscriptionId,
                userId,
                amount,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok) {
              if (verifyData.code === "DUPLICATE_SUBSCRIPTION") {
                setError("You already have an active subscription to this plan.")
                router.push("/user/subscriptions")
                return
              }
              throw new Error(verifyData.error || "Payment verification failed")
            }

            if (!verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed")
            }

            // Payment successful
            if (onSuccess) {
              onSuccess(verifyData)
            } else {
              // Redirect to success page
              router.push("/user/payment-success")
            }
          } catch (err) {
            console.error("Payment verification error:", err)
            setError(err instanceof Error ? err.message : "Payment verification failed. Please contact support.")
            if (onError) onError(err)
          }
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phone || "",
        },
        notes: {
          subscription_id: subscriptionId.toString(),
          user_id: userId,
          ...notes,
        },
        theme: {
          color: "#16a34a",
        },
      }

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error("Payment error:", err)
      setError(err instanceof Error ? err.message : "Failed to process payment. Please try again.")
      if (onError) onError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handlePayment} disabled={loading || !razorpayKey} className={className} size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  )
}
