import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_id, event_name, attendees, amount } = body

    if (!event_id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 })
    }

    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json({ success: false, error: "No attendees provided" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    const key_id = process.env.RAZORPAY_KEY_ID || ""
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!key_id || !key_secret) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    const orderAmount = Math.round(amount * 100) // Convert to paise
    const authHeader = `Basic ${Buffer.from(`${key_id}:${key_secret}`).toString("base64")}`

    // Store attendee details in notes (will be used after payment verification)
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: orderAmount,
        currency: "INR",
        receipt: `tkt_${Date.now()}`,
        notes: {
          event_id,
          event_name: event_name || "Event Ticket",
          ticket_count: attendees.length.toString(),
          // Store attendee data as JSON string
          attendees_data: JSON.stringify(attendees),
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Razorpay order creation failed:", errorText)
      return NextResponse.json({ success: false, error: "Failed to create payment order" }, { status: 500 })
    }

    const order = await response.json()

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("[v0] Error creating combined order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
