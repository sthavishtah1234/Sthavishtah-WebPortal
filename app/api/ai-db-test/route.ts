import { NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET() {
  try {
    const supabase = getAISupabaseClient()

    // Test connection by checking tables
    const { data: poseSessions, error: poseSessionsError } = await supabase
      .from("pose_sessions")
      .select("count")
      .limit(1)

    const { data: instructorPoses, error: instructorPosesError } = await supabase
      .from("instructor_poses")
      .select("count")
      .limit(1)

    const { data: userTracking, error: userTrackingError } = await supabase
      .from("user_pose_tracking")
      .select("count")
      .limit(1)

    return NextResponse.json({
      success: true,
      connection: "OK",
      tables: {
        pose_sessions: !poseSessionsError,
        instructor_poses: !instructorPosesError,
        user_pose_tracking: !userTrackingError,
      },
      errors: {
        pose_sessions: poseSessionsError?.message,
        instructor_poses: instructorPosesError?.message,
        user_pose_tracking: userTrackingError?.message,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
