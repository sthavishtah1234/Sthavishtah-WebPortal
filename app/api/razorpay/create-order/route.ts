import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { amount, subscriptionId, userId, notes } = await request.json()

    console.log("[v0] Create order request:", { amount, subscriptionId, userId })

    if (!amount || !subscriptionId || !userId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Initialize Razorpay with the environment variables
    const key_id = process.env.RAZORPAY_KEY_ID || ""
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!key_id || !key_secret) {
      console.error("[v0] Razorpay credentials not configured properly")
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway not configured",
          details: "Missing API keys. Please contact the administrator.",
        },
        { status: 500 },
      )
    }

    // Log the key type for debugging
    const keyType = key_id.startsWith("rzp_test_") ? "TEST" : "LIVE"
    console.log(`[v0] Creating Razorpay order with ${keyType} key: ${key_id.substring(0, 10)}...`)

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      console.error(`[v0] Invalid amount: ${amount}`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount",
          details: `Amount must be a positive number. Received: ${amount}`,
        },
        { status: 400 },
      )
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const orderAmount = Math.round(amount * 100)

    if (orderAmount <= 0) {
      console.error(`[v0] Invalid amount conversion: ${amount} INR converted to ${orderAmount} paise`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount conversion",
          details: `Amount conversion resulted in invalid value: ${orderAmount} paise`,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Order amount:", amount, "INR (", orderAmount, "paise)")

    try {
      const orderOptions = {
        amount: orderAmount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          subscriptionId: subscriptionId.toString(),
          userId,
          original_amount: amount.toString(),
          ...notes,
        },
      }

      console.log("[v0] Creating order with options:", {
        amount: orderOptions.amount,
        currency: orderOptions.currency,
        receipt: orderOptions.receipt,
      })

      // Call Razorpay API directly using fetch
      const authHeader = `Basic ${Buffer.from(`${key_id}:${key_secret}`).toString('base64')}`
      
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(orderOptions)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Razorpay API error response:", errorData)
        throw new Error(errorData.error?.description || `Razorpay API returned ${response.status}`)
      }

      const order = await response.json()
      console.log("[v0] Order created successfully:", order.id)
      console.log("[v0] Order amount:", order.amount, "paise")

      return NextResponse.json({ success: true, order })
    } catch (razorpayError: any) {
      console.error("[v0] Razorpay API error:", razorpayError)

      const errorDetails = razorpayError.message || String(razorpayError)

      return NextResponse.json(
        {
          success: false,
          error: "Razorpay API error",
          details: errorDetails,
          code: 500,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error creating Razorpay order:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
