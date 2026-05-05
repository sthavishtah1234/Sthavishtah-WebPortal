import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// Check if phone number exists in users table
export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if phone exists in users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone")
      .eq("phone", phone)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error checking phone:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (user) {
      // User exists - no passkey needed
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
    }

    // User doesn't exist - will need passkey
    return NextResponse.json({
      success: true,
      exists: false,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to check phone" }, { status: 500 })
  }
}
