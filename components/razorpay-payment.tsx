"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getRazorpayKey } from "@/lib/razorpay-client"

interface RazorpayPaymentProps {
  orderId: string
  amount: number // in paise (e.g., ₹100 = 10000)
  currency?: string
  name: string
  description: string
  prefillEmail?: string
  prefillContact?: string
  prefillName?: string
  onSuccess: (paymentId: string, orderId: string, signature: string) => void
  onError?: (error: any) => void
}

export function RazorpayPayment({
  orderId,
  amount,
  currency = "INR",
  name,
  description,
  prefillEmail = "",
  prefillContact = "",
  prefillName = "",
  onSuccess,
  onError,
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null)

  useEffect(() => {
    // Fetch the Razorpay key from the server
    async function fetchKey() {
      try {
        setLoading(true)
        const key = await getRazorpayKey()
        setRazorpayKey(key)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch Razorpay key:", err)
        setError("Failed to initialize payment gateway. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchKey()
  }, [])

  const handlePayment = () => {
    if (!razorpayKey) {
      setError("Payment gateway not initialized. Please try again.")
      return
    }

    setLoading(true)

    try {
      // Load the Razorpay script if it's not already loaded
      if (!(window as any).Razorpay) {
        setError("Payment gateway not loaded. Please refresh the page and try again.")
        setLoading(false)
        return
      }

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: name,
        description: description,
        order_id: orderId,
        handler: (response: any) => {
          setLoading(false)
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature)
        },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
        notes: {
          address: "Your Organization Address",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.on("payment.failed", (response: any) => {
        setLoading(false)
        const error = {
          code: response.error.code,
          description: response.error.description,
          source: response.error.source,
          step: response.error.step,
          reason: response.error.reason,
          orderId: response.error.metadata.order_id,
          paymentId: response.error.metadata.payment_id,
        }
        if (onError) {
          onError(error)
        } else {
          setError(`Payment failed: ${response.error.description}`)
        }
      })

      razorpay.open()
    } catch (err) {
      setLoading(false)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(`Failed to initialize payment: ${errorMessage}`)
      if (onError) onError(err)
    }
  }

  return (
    <div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <Button onClick={handlePayment} disabled={loading || !razorpayKey}>
        {loading ? "Initializing Payment..." : "Pay Now"}
      </Button>
    </div>
  )
}
