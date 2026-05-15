export const dynamic = "force-dynamic"

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
      .select("id, student_id, event_id, status")
      .single()

    if (error) {
      console.error("Review update error:", error)
      return NextResponse.json({ success: false, error: "Failed to update submission" }, { status: 500 })
    }

    // ✅ On approval — allocate AICTE points to the student
    if (action === "approved" && data) {
      try {
        // 1. Fetch how many points this event awards
        const { data: eventData, error: eventError } = await supabase
          .from("aicte_events")
          .select("points")
          .eq("id", data.event_id)
          .single()

        if (eventError || !eventData) {
          console.error("Could not fetch event points:", eventError)
        } else {
          const pointsToAdd = eventData.points ?? 1

          // 2. Check if student_profile exists
          const { data: profile } = await supabase
            .from("student_profiles")
            .select("id, aicte_points")
            .eq("user_id", data.student_id)
            .single()

          if (profile) {
            // 3a. Update existing profile — increment points
            const { error: updateError } = await supabase
              .from("student_profiles")
              .update({ aicte_points: (profile.aicte_points ?? 0) + pointsToAdd })
              .eq("user_id", data.student_id)

            if (updateError) {
              console.error("Error updating student points:", updateError)
            } else {
              console.log(`✅ Awarded ${pointsToAdd} AICTE point(s) to student ${data.student_id}`)
            }
          } else {
            // 3b. Create a new profile for the student with the points
            const { error: insertError } = await supabase
              .from("student_profiles")
              .insert({ user_id: data.student_id, aicte_points: pointsToAdd })

            if (insertError) {
              console.error("Error creating student profile with points:", insertError)
            } else {
              console.log(`✅ Created profile and awarded ${pointsToAdd} AICTE point(s) to student ${data.student_id}`)
            }
          }
        }
      } catch (pointsErr) {
        // Non-fatal — log but don't fail the approval
        console.error("Points allocation error (non-fatal):", pointsErr)
      }
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
