import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")
    const status = searchParams.get("status")
    const isAdmin = searchParams.get("admin") === "true"

    const supabase = getSupabaseServerClient()

    let query = supabase
      .from("aicte_submissions")
      .select("*")
      .order("submitted_at", { ascending: false })

    if (studentId && !isAdmin) {
      query = query.eq("student_id", studentId)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({ success: true, submissions: data || [] })
  } catch (error) {
    console.error("Submissions error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
