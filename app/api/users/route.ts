import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient()

    const adminPassword = request.headers.get("x-admin-password")
    const validAdminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || adminPassword !== validAdminPassword) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 })
    }

    // Fetch all users
    const { data: users, error } = await supabase.from("users").select("id, name, email").order("name")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Unexpected error in users API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
