import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    // Fetch admin password from database
    const { data, error } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "admin_password")
      .single()

    if (error || !data) {
      console.error("[v0] Error fetching admin password:", error)
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const isValid = password === data.setting_value

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("[v0] Admin password verification error:", error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
