import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { generateUserToken } from "@/lib/auth-tokens"

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Find user by phone number
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("phone_number", phoneNumber)
      .single()

    if (error || !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Generate token for the user
    const token = await generateUserToken(user.id.toString())

    if (!token) {
      return NextResponse.json({ success: false, message: "Failed to generate token" }, { status: 500 })
    }

    // Create the access link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"
    const accessLink = `${baseUrl}/auto-login?token=${token}`

    return NextResponse.json({
      success: true,
      accessLink,
      userName: user.name,
      userId: user.id,
    })
  } catch (error) {
    console.error("Error generating access link:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
