export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")

    if (!studentId) {
      return NextResponse.json({ success: false, error: "student_id is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("student_profiles")
      .select("aicte_points, college_name, usn_number")
      .eq("user_id", parseInt(studentId))
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not really an error — student just has no profile yet)
      console.error("Error fetching student profile:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      aicte_points: data?.aicte_points ?? 0,
      college_name: data?.college_name ?? null,
      usn_number: data?.usn_number ?? null,
    })
  } catch (error) {
    console.error("Student profile fetch error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
