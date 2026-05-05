import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("aicte_events")
      .select("*")
      .eq("is_active", true)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching AICTE events:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
    }

    return NextResponse.json({ success: true, events: data || [] })
  } catch (error) {
    console.error("AICTE events error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
