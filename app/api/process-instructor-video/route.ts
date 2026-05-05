import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, poses, videoDurationMs } = body

    if (!courseId || !poses) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] 📹 Processing instructor video for course:", courseId)
    console.log("[v0] 🎯 Total poses extracted:", poses.length)

    const aiSupabase = getAISupabaseClient()

    // Create pose session
    const { data: session, error: sessionError } = await aiSupabase
      .from("pose_sessions")
      .insert({
        course_id: courseId,
        video_duration_ms: videoDurationMs,
        total_frames_processed: poses.length,
        processing_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error("[v0] ❌ Failed to create pose session:", sessionError)
      return NextResponse.json({ error: "Failed to create pose session" }, { status: 500 })
    }

    console.log("[v0] ✅ Created pose session:", session.id)

    // Insert all pose landmarks in batch
    const poseRecords = poses.map((pose: any) => ({
      session_id: session.id,
      course_id: courseId,
      timestamp_ms: pose.timestamp_ms,
      pose_landmarks: pose.landmarks,
      visibility_scores: pose.visibility,
    }))

    const { error: insertError } = await aiSupabase.from("instructor_poses").insert(poseRecords)

    if (insertError) {
      console.error("[v0] ❌ Failed to insert poses:", insertError)
      return NextResponse.json({ error: "Failed to store poses" }, { status: 500 })
    }

    const supabase = getSupabaseServerClient()
    const { error: updateError } = await supabase
      .from("courses")
      .update({ pose_session_id: session.id })
      .eq("id", courseId)

    if (updateError) {
      console.warn("[v0] ⚠️ Failed to update course with pose_session_id:", updateError)
    } else {
      console.log("[v0] ✅ Updated course with pose_session_id")
    }

    console.log("[v0] ✅ Successfully stored all poses")

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      posesStored: poses.length,
    })
  } catch (error) {
    console.error("[v0] ❌ Error processing video:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
