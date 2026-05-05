import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, subject, message, adminPassword } = await request.json()

    // Verify admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get user details from database
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Send custom email
    const result = await sendEmail({
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5;">Sthavishtah Yoga</h1>
          </div>
          <p>Hello ${user.name},</p>
          ${message}
          <p>Thank you,<br>Sthavishtah Yoga Team</p>
        </div>
      `,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send email", error: result.error },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Error in send-custom-email API:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
