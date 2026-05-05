import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { submission_id, action, admin_note } = await request.json()

    if (!submission_id || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const updateData: Record<string, any> = {
      status: action,
      reviewed_at: new Date().toISOString(),
    }

    if (admin_note) {
      updateData.admin_note = admin_note
    }

    const { data, error } = await supabase
      .from("aicte_submissions")
      .update(updateData)
      .eq("id", submission_id)
      .select()
      .single()

    if (error) {
      console.error("Review update error:", error)
      return NextResponse.json({ success: false, error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submission: data,
      message: `Submission ${action} successfully`,
    })
  } catch (error) {
    console.error("Review error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
