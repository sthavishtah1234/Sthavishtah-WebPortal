import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Map the database column names to camelCase for frontend
    const mappedSubscriptions = subscriptions.map((sub) => ({
      ...sub,
      whatsappGroupLink: sub.whatsapp_group_link, // Map snake_case to camelCase
      whatsapp_group_link: sub.whatsapp_group_link, // Keep original for compatibility
    }))

    return NextResponse.json({ success: true, subscriptions: mappedSubscriptions })
  } catch (error) {
    console.error("Unexpected error in subscriptions API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
