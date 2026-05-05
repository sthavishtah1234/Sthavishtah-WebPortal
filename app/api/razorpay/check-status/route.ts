import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Razorpay keys are configured
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    const status = {
      key_id_configured: !!key_id,
      key_secret_configured: !!key_secret,
      key_type: key_id ? (key_id.startsWith("rzp_test_") ? "TEST" : "LIVE") : "NOT_CONFIGURED",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      status,
      message: "Razorpay configuration status check completed",
    })
  } catch (error) {
    console.error("Error checking Razorpay status:", error)
    return NextResponse.json(
      {
        error: "Failed to check Razorpay status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
