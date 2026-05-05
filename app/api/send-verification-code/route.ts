import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the code in the database with expiration
    const supabase = getSupabaseServerClient()

    // Check if this phone number exists in our users table
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", phoneNumber)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This phone number is not registered in our system",
        },
        { status: 404 },
      )
    }

    // Store the verification code
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // Code expires in 10 minutes

    const { error } = await supabase.from("phone_verification").insert({
      phone_number: phoneNumber,
      code: verificationCode,
      expires_at: expiresAt.toISOString(),
      user_id: existingUser.id,
    })

    if (error) throw error

    // In a real system, you would send this via SMS or WhatsApp API
    // For this example, we'll just return it (in production, never return codes directly)
    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      // Remove this in production:
      code: verificationCode,
    })
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
