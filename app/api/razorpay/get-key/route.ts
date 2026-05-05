import { NextResponse } from "next/server"

export async function GET() {
  try {
    const key = process.env.RAZORPAY_KEY_ID

    if (!key) {
      console.error("Razorpay key not configured")
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    // Log which key we're using (for debugging)
    const keyType = key.startsWith("rzp_test_") ? "TEST" : "LIVE"
    console.log(`Returning ${keyType} Razorpay key: ${key.substring(0, 10)}...`)

    return NextResponse.json({ key })
  } catch (error) {
    console.error("Error fetching Razorpay key:", error)
    return NextResponse.json({ error: "Failed to get payment gateway key" }, { status: 500 })
  }
}
