import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { meetingNumber, role = 0 } = await request.json()

    console.log("[v0 SERVER] ===== Zoom Signature Generation Started =====")
    console.log("[v0 SERVER] Meeting Number:", meetingNumber)
    console.log("[v0 SERVER] Role:", role)

    // Get Zoom credentials from environment variables
    const sdkKey = process.env.ZOOM_API_KEY
    const sdkSecret = process.env.ZOOM_API_SECRET

    console.log("[v0 SERVER] SDK Key present:", !!sdkKey)
    console.log("[v0 SERVER] SDK Secret present:", !!sdkSecret)

    if (!sdkKey || !sdkSecret) {
      console.error("[v0 SERVER] ERROR: Zoom credentials not configured")
      return NextResponse.json(
        {
          error: "Zoom integration not configured. Please add ZOOM_API_KEY and ZOOM_API_SECRET environment variables.",
        },
        { status: 500 },
      )
    }

    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + 60 * 60 * 2 // 2 hours expiration

    // Create JWT payload with required Zoom fields
    const payload = {
      sdkKey: sdkKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp,
    }

    console.log("[v0 SERVER] Payload:", JSON.stringify(payload, null, 2))

    const header = { alg: "HS256", typ: "JWT" }

    const base64UrlEncode = (obj: any) => {
      return Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
    }

    const encodedHeader = base64UrlEncode(header)
    const encodedPayload = base64UrlEncode(payload)
    const signatureInput = `${encodedHeader}.${encodedPayload}`

    console.log("[v0 SERVER] Signature input:", signatureInput.substring(0, 50) + "...")

    const hmac = crypto.createHmac("sha256", sdkSecret)
    hmac.update(signatureInput)
    const signature = hmac.digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

    const jwtToken = `${signatureInput}.${signature}`

    console.log("[v0 SERVER] JWT Token generated successfully")
    console.log("[v0 SERVER] Token length:", jwtToken.length)
    console.log("[v0 SERVER] ===== Zoom Signature Generation Complete =====")

    return NextResponse.json({ signature: jwtToken })
  } catch (error: any) {
    console.error("[v0 SERVER] ===== ERROR IN SIGNATURE GENERATION =====")
    console.error("[v0 SERVER] Error type:", error.constructor.name)
    console.error("[v0 SERVER] Error message:", error.message)
    console.error("[v0 SERVER] Error stack:", error.stack)
    return NextResponse.json({ error: "Failed to generate meeting signature: " + error.message }, { status: 500 })
  }
}
