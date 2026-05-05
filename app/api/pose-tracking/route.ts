import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function POST(request: NextRequest) {
  try {
    const {
      user_email,
      course_id,
      video_timestamp_ms,
      overall_accuracy,
      form_score,
      joint_accuracies,
      velocity_score,
      stability_score,
      transition_quality,
      detected_pose,
      feedback,
    } = await request.json()

    console.log("[v0] 📊 Advanced pose tracking data received:", {
      user_email,
      course_id,
      overall_accuracy,
      form_score,
      detected_pose,
    })

    const aiSupabase = getAISupabaseClient()

    const { data, error } = await aiSupabase.from("user_pose_tracking").insert({
      user_email,
      course_id,
      video_timestamp_ms,
      overall_accuracy,
      joint_accuracies: {
        ...joint_accuracies,
        form_score,
        velocity_score,
        stability_score,
        transition_quality,
        detected_pose,
        feedback,
      },
    })

    if (error) {
      console.error("[v0] ❌ Pose tracking insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] ✅ Pose tracking data saved successfully")
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] ❌ Pose tracking API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
