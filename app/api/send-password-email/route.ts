import { type NextRequest, NextResponse } from "next/server"
import { sendPasswordEmail } from "@/lib/email"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, adminPassword } = await request.json()

    // Verify admin password (simple security check)
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get user details from database
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Generate a temporary password if needed
    // In this case, we're assuming the password is already stored in the database
    // If you're storing hashed passwords, you'll need to generate a new temporary password here

    // Send email
    const result = await sendPasswordEmail(
      user.email,
      user.name,
      user.user_id,
      user.password || "Your password is stored securely. Please use the forgot password feature to reset it.",
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send email", error: result.error },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Password email sent successfully" })
  } catch (error) {
    console.error("Error in send-password-email API:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
