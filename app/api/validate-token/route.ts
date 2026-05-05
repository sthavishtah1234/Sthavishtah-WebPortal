import { type NextRequest, NextResponse } from "next/server"
import { validateToken } from "@/lib/auth-tokens"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { token, deviceFingerprint } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 })
    }

    if (!deviceFingerprint) {
      return NextResponse.json({ success: false, message: "Device information is required" }, { status: 400 })
    }

    // Get client IP for logging
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Validate the token with device binding
    const validationResult = await validateToken(token, deviceFingerprint)

    if (!validationResult) {
      // Log failed attempt
      const supabase = getSupabaseServerClient()
      await supabase.from("auth_logs").insert({
        event_type: "token_validation_failed",
        ip_address: ip,
        user_agent: userAgent,
        details: JSON.stringify({ token_partial: token.substring(0, 8) + "..." }),
      })

      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const { userId } = validationResult

    // Get user details
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone_number")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Log successful login
    await supabase.from("auth_logs").insert({
      event_type: "token_login_success",
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
    })

    // Return user information for client-side storage
    return NextResponse.json({
      success: true,
      userId: user.id.toString(),
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone_number,
    })
  } catch (error) {
    console.error("Error validating token:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
