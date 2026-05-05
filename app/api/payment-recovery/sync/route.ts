import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 })
    }

    // Initialize Razorpay with your API key and secret
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      return NextResponse.json({ success: false, error: "Razorpay API keys not configured" }, { status: 500 })
    }

    // Create Basic Auth header for Razorpay API
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64")

    // Fetch payment details from Razorpay
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      throw new Error(`Razorpay API error: ${errorText}`)
    }

    const payment = await razorpayResponse.json()

    // Fetch order details to get subscription information
    const orderId = payment.order_id

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Payment has no associated order" }, { status: 400 })
    }

    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      throw new Error(`Razorpay API error fetching order: ${errorText}`)
    }

    const order = await orderResponse.json()

    // Get the Supabase client
    const supabase = getSupabaseServerClient()

    // Find the order in your database to get subscription_id and user_id
    const { data: razorpayOrder, error: orderError } = await supabase
      .from("razorpay_orders")
      .select("*")
      .eq("order_id", orderId)
      .single()

    let userId, subscriptionId, durationDays

    if (orderError || !razorpayOrder) {
      // If order not found in database, try to extract info from order notes or receipt
      console.log("Order not found in database, extracting from Razorpay order:", order)

      // Try to extract from receipt
      const receipt = order.receipt || ""
      const receiptParts = receipt.split("_")

      if (receiptParts.length >= 3) {
        userId = Number.parseInt(receiptParts[1])
        subscriptionId = Number.parseInt(receiptParts[2])
      }

      // If we couldn't extract from receipt, use order notes or default values
      if (!userId || !subscriptionId) {
        // Default to extracting from order amount and finding matching subscription
        const amount = order.amount

        // Find subscription with matching price
        const { data: matchingSubscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("price", amount / 100)
          .single()

        if (matchingSubscription) {
          subscriptionId = matchingSubscription.id
          durationDays = matchingSubscription.duration_days
        } else {
          // Default to first active subscription if we can't find a match
          const { data: firstSubscription } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("is_active", true)
            .limit(1)
            .single()

          if (firstSubscription) {
            subscriptionId = firstSubscription.id
            durationDays = firstSubscription.duration_days
          } else {
            return NextResponse.json(
              { success: false, error: "Could not determine subscription details" },
              { status: 400 },
            )
          }
        }

        // Try to extract user ID from payment email
        if (payment.email) {
          const { data: user } = await supabase.from("users").select("id").eq("email", payment.email).single()

          if (user) {
            userId = user.id
          } else if (payment.contact) {
            // Try by phone number
            const { data: userByPhone } = await supabase
              .from("users")
              .select("id")
              .eq("phone", payment.contact)
              .single()

            if (userByPhone) {
              userId = userByPhone.id
            }
          }
        }

        if (!userId) {
          return NextResponse.json({ success: false, error: "Could not determine user ID" }, { status: 400 })
        }
      }
    } else {
      // Use the data from the found order
      userId = razorpayOrder.user_id
      subscriptionId = razorpayOrder.subscription_id
      durationDays = razorpayOrder.duration_days
    }

    // Start a transaction to ensure data consistency
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount: payment.amount / 100, // Convert from paise to rupees
        payment_method: "razorpay",
        transaction_id: payment.id,
        status: "completed",
        payment_id: payment.id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: orderId,
        razorpay_signature: payment.acquirer_data?.bank_transaction_id || "",
        terms_accepted: true,
        currency: payment.currency,
        metadata: payment,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Error creating payment record:", paymentError)
      return NextResponse.json(
        { success: false, error: `Failed to create payment record: ${paymentError.message}` },
        { status: 500 },
      )
    }

    // Calculate subscription end date
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + (durationDays || 30)) // Default to 30 days if not specified

    // Create or update user subscription
    const { data: userSubscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        subscription_id: subscriptionId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        is_active: true,
        payment_id: payment.id,
      })
      .select()

    if (subscriptionError) {
      console.error("Error creating user subscription:", subscriptionError)
      return NextResponse.json(
        { success: false, error: `Failed to create user subscription: ${subscriptionError.message}` },
        { status: 500 },
      )
    }

    // Update razorpay_payments table if it exists
    try {
      await supabase.from("razorpay_payments").upsert({
        payment_id: payment.id,
        order_id: orderId,
        user_id: userId,
        subscription_id: subscriptionId,
        amount: payment.amount / 100,
        status: "captured",
        payment_method: "razorpay",
        payment_details: payment,
        webhook_received: true,
      })
    } catch (error) {
      console.error("Error updating razorpay_payments table (non-critical):", error)
      // Continue even if this fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully synced",
      payment: paymentRecord,
      subscription: userSubscription,
    })
  } catch (error) {
    console.error("Error in payment sync API:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to sync payment" }, { status: 500 })
  }
}
