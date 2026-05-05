import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    script_url: "https://checkout.razorpay.com/v1/checkout.js",
    instructions: "Load this script in a browser to test if Razorpay's CDN is accessible from your location",
  })
}
