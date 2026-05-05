import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number and verification code are required",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseServerClient()

    // Get the verification record
    const { data, error } = await supabase
      .from("phone_verification")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("code", code)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code",
        },
        { status: 401 },
      )
    }

    // Mark the code as used
    await supabase.from("phone_verification").update({ is_used: true }).eq("id", data.id)

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, phone_number")
      .eq("id", data.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Return user information for client-side storage
    return NextResponse.json({
      success: true,
      userId: user.id.toString(),
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone_number,
      verified: true,
    })
  } catch (error) {
    console.error("Error verifying phone:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
