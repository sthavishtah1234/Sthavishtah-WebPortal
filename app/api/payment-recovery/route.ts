import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Initialize Razorpay with your API key and secret
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: "Razorpay API keys not configured" }, { status: 500 })
    }

    // Create Basic Auth header for Razorpay API
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64")

    // Fetch payments from Razorpay (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = Math.floor(thirtyDaysAgo.getTime() / 1000)

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments?from=${fromDate}&count=100&status=captured`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    )

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      throw new Error(`Razorpay API error: ${errorText}`)
    }

    const razorpayData = await razorpayResponse.json()
    const razorpayPayments = razorpayData.items || []

    // Get payment IDs from Razorpay
    const razorpayPaymentIds = razorpayPayments.map((payment) => payment.id)

    if (razorpayPaymentIds.length === 0) {
      return NextResponse.json({ unrecordedPayments: [] })
    }

    // Check which payments exist in your database
    const supabase = getSupabaseServerClient()

    // Check in payments table
    const { data: existingPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("payment_id, razorpay_payment_id")
      .in("payment_id", razorpayPaymentIds)
      .or(`razorpay_payment_id.in.(${razorpayPaymentIds.map((id) => `"${id}"`).join(",")})`)

    if (paymentsError) {
      console.error("Error checking payments table:", paymentsError)
    }

    // Check in razorpay_payments table
    const { data: existingRazorpayPayments, error: razorpayPaymentsError } = await supabase
      .from("razorpay_payments")
      .select("payment_id")
      .in("payment_id", razorpayPaymentIds)

    if (razorpayPaymentsError) {
      console.error("Error checking razorpay_payments table:", razorpayPaymentsError)
    }

    // Combine existing payment IDs from both tables
    const existingPaymentIds = new Set(
      [
        ...(existingPayments || []).map((p) => p.payment_id || p.razorpay_payment_id),
        ...(existingRazorpayPayments || []).map((p) => p.payment_id),
      ].filter(Boolean),
    )

    // Filter out payments that don't exist in your database
    const unrecordedPayments = razorpayPayments
      .filter((payment) => !existingPaymentIds.has(payment.id))
      .map((payment) => ({
        id: payment.id,
        payment_id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        email: payment.email || "Not provided",
        contact: payment.contact || "Not provided",
        created_at: new Date(payment.created_at * 1000).toISOString(),
        status: payment.status,
      }))

    return NextResponse.json({ unrecordedPayments })
  } catch (error) {
    console.error("Error in payment recovery API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch unrecorded payments" }, { status: 500 })
  }
}
