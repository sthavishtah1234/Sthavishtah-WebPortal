import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSupabaseServerClient } from "@/lib/supabase"

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
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
      console.log("Webhook signature verified successfully")
    } else {
      console.warn("Webhook secret not configured - skipping signature verification")
    }

    // Parse the payload
    const event = JSON.parse(payload)
    console.log("Webhook event type:", event.event)

    // Handle different event types
    if (event.event === "payment.authorized" || event.event === "payment.captured") {
      // Get payment details
      const payment = event.payload.payment.entity
      console.log("Payment authorized:", payment.id)

      // Update payment status in database
      const supabase = getSupabaseServerClient()

      // First check if the payment exists
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("payment_id", payment.id)
        .single()

      if (existingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from("payments")
          .update({ status: "completed", webhook_received: true })
          .eq("payment_id", payment.id)

        if (error) {
          console.error("Error updating payment status:", error)
        } else {
          console.log("Payment status updated successfully")
        }
      } else {
        // Payment doesn't exist in our database yet
        // This might happen if the webhook arrives before the payment verification completes
        console.log("Payment not found in database, creating new record")

        // Try to extract order details from the payment
        const orderId = payment.order_id
        const amount = payment.amount / 100 // Convert from paise to rupees

        // Get order details to find user and subscription info
        const { data: orderData } = await supabase.from("razorpay_orders").select("*").eq("order_id", orderId).single()

        if (orderData) {
          // Create payment record
          await supabase.from("payments").insert([
            {
              payment_id: payment.id,
              order_id: orderId,
              user_id: orderData.user_id,
              subscription_id: orderData.subscription_id,
              amount: amount,
              status: "completed",
              webhook_received: true,
            },
          ])

          // Create subscription if it doesn't exist
          const { data: existingSub } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("payment_id", payment.id)
            .single()

          if (!existingSub) {
            // Calculate subscription dates
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
        } else {
          console.log("Order not found for payment:", payment.id)
        }
      }
    } else if (event.event === "payment.failed") {
      // Handle failed payment
      const payment = event.payload.payment.entity
      console.log("Payment failed:", payment.id)

      // Update payment status in database
      const supabase = getSupabaseServerClient()
      const { error } = await supabase
        .from("payments")
        .update({ status: "failed", webhook_received: true })
        .eq("payment_id", payment.id)

      if (error) {
        console.error("Error updating payment status:", error)
      } else {
        console.log("Payment status updated successfully")
      }
    }

    // Always return a 200 response to acknowledge receipt of the webhook
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
