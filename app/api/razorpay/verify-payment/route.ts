import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionId, userId, amount } =
      await request.json()

    // Validate required parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters for payment verification" },
        { status: 400 },
      )
    }

    // Get the Razorpay key secret from environment variables
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_secret) {
      console.error("Razorpay key secret not configured")
      return NextResponse.json(
        { success: false, error: "Payment verification not configured properly" },
        { status: 500 },
      )
    }

    // Create the signature verification string
    const signatureVerificationString = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", key_secret).update(signatureVerificationString).digest("hex")

    // Verify the signature
    const isSignatureValid = expectedSignature === razorpay_signature

    if (!isSignatureValid) {
      console.error("Payment signature verification failed")
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
    }

    console.log("Payment signature verified successfully")

    // Initialize Supabase client
    const supabase = getSupabaseServerClient()

    // Check if user already has an active subscription to this plan
    const { data: existingSubscriptions, error: checkError } = await supabase
      .from("user_subscriptions")
      .select("id, subscription_id, end_date, is_active")
      .eq("user_id", userId)
      .eq("subscription_id", subscriptionId)

    if (checkError) {
      console.error("Error checking existing subscriptions:", checkError)
    } else if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Check if any of the subscriptions are active
      const hasActiveSubscription = existingSubscriptions.some((sub) => {
        const endDate = new Date(sub.end_date)
        const now = new Date()
        return sub.is_active || endDate > now
      })

      if (hasActiveSubscription) {
        console.error("User already has an active subscription to this plan")
        return NextResponse.json(
          {
            success: false,
            error: "You already have an active subscription to this plan",
            code: "DUPLICATE_SUBSCRIPTION",
          },
          { status: 400 },
        )
      }
    }

    // Get subscription details to calculate duration
    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (subError) {
      console.error("Error fetching subscription details:", subError)
      return NextResponse.json({ success: false, error: "Failed to fetch subscription details" }, { status: 500 })
    }

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + subscriptionData.duration_days + 3)

    // Store the payment details in the database
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          user_id: userId,
          subscription_id: subscriptionId,
          amount: amount,
          status: "completed",
        },
      ])
      .select()

    if (paymentError) {
      console.error("Error storing payment details:", paymentError)
      return NextResponse.json({ success: false, error: "Failed to store payment details" }, { status: 500 })
    }

    // Create a subscription for the user
    const { data: subscriptionResult, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert([
        {
          user_id: userId,
          subscription_id: subscriptionId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          payment_id: razorpay_payment_id,
          terms_accepted: true,
          days_left: subscriptionData.duration_days + 3, // Include 3-day grace period
        },
      ])
      .select()

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription created successfully",
      subscription: subscriptionResult[0],
      payment: paymentData[0],
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
