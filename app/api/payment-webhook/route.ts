export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSupabaseServerClient } from "@/lib/supabase"

/**
 * Safely update a payment record in the database.
 * Tries with webhook_received first; if the column doesn't exist, retries without it.
 */
async function safeUpdatePayment(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  paymentId: string,
  status: string
) {
  // Try with webhook_received column first
  const { error } = await supabase
    .from("payments")
    .update({ status, webhook_received: true })
    .eq("payment_id", paymentId)

  if (error) {
    // If the error is about the webhook_received column not existing, retry without it
    if (error.message?.includes("webhook_received") || error.code === "PGRST204") {
      console.warn("webhook_received column not found in payments table, updating without it")
      const { error: retryError } = await supabase
        .from("payments")
        .update({ status })
        .eq("payment_id", paymentId)

      if (retryError) {
        console.error("Error updating payment status (retry):", retryError)
      } else {
        console.log("Payment status updated successfully (without webhook_received)")
      }
    } else {
      console.error("Error updating payment status:", error)
    }
  } else {
    console.log("Payment status updated successfully")
  }
}

/**
 * Safely insert a payment record into the database.
 * Tries with webhook_received first; if the column doesn't exist, retries without it.
 */
async function safeInsertPayment(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  record: Record<string, any>
) {
  const { error } = await supabase.from("payments").insert([record])

  if (error) {
    if (error.message?.includes("webhook_received") || error.code === "PGRST204") {
      console.warn("webhook_received column not found in payments table, inserting without it")
      const { webhook_received, ...recordWithoutWebhook } = record
      const { error: retryError } = await supabase.from("payments").insert([recordWithoutWebhook])

      if (retryError) {
        console.error("Error inserting payment record (retry):", retryError)
      } else {
        console.log("Payment record created successfully (without webhook_received)")
      }
    } else {
      console.error("Error inserting payment record:", error)
    }
  } else {
    console.log("Payment record created successfully")
  }
}

/**
 * Process the webhook event asynchronously.
 * All database operations are wrapped in try/catch to prevent any errors
 * from propagating and causing a non-200 response.
 */
async function processWebhookEvent(event: any) {
  try {
    if (event.event === "payment.authorized" || event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      console.log("Processing payment:", payment.id)

      const supabase = getSupabaseServerClient()

      // First check if the payment exists
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("payment_id", payment.id)
        .single()

      if (existingPayment) {
        // Update existing payment
        await safeUpdatePayment(supabase, payment.id, "completed")
      } else {
        // Payment doesn't exist in our database yet
        // This might happen if the webhook arrives before the payment verification completes
        console.log("Payment not found in database, creating new record")

        const orderId = payment.order_id
        const amount = payment.amount / 100 // Convert from paise to rupees

        // Get order details to find user and subscription info
        const { data: orderData } = await supabase
          .from("razorpay_orders")
          .select("*")
          .eq("order_id", orderId)
          .single()

        if (orderData) {
          // Create payment record
          await safeInsertPayment(supabase, {
            payment_id: payment.id,
            order_id: orderId,
            user_id: orderData.user_id,
            subscription_id: orderData.subscription_id,
            amount: amount,
            status: "completed",
            webhook_received: true,
          })

          // Create subscription if it doesn't exist
          try {
            const { data: existingSub } = await supabase
              .from("user_subscriptions")
              .select("*")
              .eq("payment_id", payment.id)
              .single()

            if (!existingSub) {
              const startDate = new Date()
              const endDate = new Date(startDate)
              endDate.setDate(endDate.getDate() + orderData.duration_days)

              await supabase.from("user_subscriptions").insert([
                {
                  user_id: orderData.user_id,
                  subscription_id: orderData.subscription_id,
                  start_date: startDate.toISOString(),
                  end_date: endDate.toISOString(),
                  is_active: true,
                  payment_id: payment.id,
                  terms_accepted: true,
                },
              ])

              console.log("Created new subscription from webhook data")
            }
          } catch (subError) {
            console.error("Error creating subscription from webhook:", subError)
          }
        } else {
          console.log("Order not found for payment:", payment.id)
        }
      }
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity
      console.log("Payment failed:", payment.id)

      const supabase = getSupabaseServerClient()
      await safeUpdatePayment(supabase, payment.id, "failed")
    }

    console.log("Webhook event processed successfully:", event.event)
  } catch (error) {
    // Log but never throw — we already returned 200 to Razorpay
    console.error("Error processing webhook event (non-fatal):", error)
  }
}

export async function POST(request: Request) {
  try {
    // Get the raw request body
    const payload = await request.text()
    console.log("Webhook received from Razorpay")

    // Get the signature from headers
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      console.error("No signature in webhook request")
      return NextResponse.json({ error: "No signature provided" }, { status: 400 })
    }

    // Verify the signature with the webhook secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (webhookSecret) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex")

      if (signature !== expectedSignature) {
        const maskedSecret = webhookSecret.length > 4 
          ? `${webhookSecret.slice(0, 2)}...${webhookSecret.slice(-2)}` 
          : "***";
        console.error("Invalid webhook signature mismatch!");
        console.error(`Received signature: ${signature}`);
        console.error(`Expected signature: ${expectedSignature}`);
        console.error(`Using Webhook Secret (masked): ${maskedSecret} (length: ${webhookSecret.length})`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
      console.log("Webhook signature verified successfully")
    } else {
      console.warn("Webhook secret not configured - skipping signature verification")
    }

    // Parse the payload
    let event: any
    try {
      event = JSON.parse(payload)
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    console.log("Webhook event type:", event.event)

    // Process the event — all DB work happens here but errors are caught internally
    // so that we always return 200 to Razorpay
    await processWebhookEvent(event)

    // Always return a 200 response to acknowledge receipt of the webhook
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    // Even on unexpected errors, return 200 to prevent Razorpay from retrying
    // and eventually disabling the webhook. The error is logged for debugging.
    return NextResponse.json({ received: true, warning: "processed with errors" })
  }
}
