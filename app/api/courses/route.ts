import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Fetch all courses
    const { data: courses, error } = await supabase.from("courses").select("id, title, description").order("title")

    if (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, courses })
  } catch (error) {
    console.error("Unexpected error in courses API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
