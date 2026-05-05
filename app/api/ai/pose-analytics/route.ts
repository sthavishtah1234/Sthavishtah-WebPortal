import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    const aiSupabase = getAISupabaseClient()

    if (type === "instructor-videos") {
      const { data, error } = await aiSupabase
        .from("instructor_poses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching instructor videos:", error)
        throw error
      }

      const processedData = (data || []).map((item: any) => {
        let totalFrames = item.total_frames || 0

        // If total_frames is 0, calculate from chunks
        if (totalFrames === 0) {
          const chunk1 = Array.isArray(item.poses_chunk_1) ? item.poses_chunk_1.length : 0
          const chunk2 = Array.isArray(item.poses_chunk_2) ? item.poses_chunk_2.length : 0
          const chunk3 = Array.isArray(item.poses_chunk_3) ? item.poses_chunk_3.length : 0
          const chunk4 = Array.isArray(item.poses_chunk_4) ? item.poses_chunk_4.length : 0
          const chunk5 = Array.isArray(item.poses_chunk_5) ? item.poses_chunk_5.length : 0
          totalFrames = chunk1 + chunk2 + chunk3 + chunk4 + chunk5
        }

        return {
          id: item.id,
          course_id: item.course_id,
          video_url: item.video_url,
          total_frames: totalFrames,
          created_at: item.created_at,
          processed_at: item.processed_at,
        }
      })

      console.log("[v0] Instructor videos found:", processedData.length)
      return NextResponse.json({ data: processedData })
    }

    if (type === "user-performance") {
      const { data, error } = await aiSupabase
        .from("user_pose_tracking")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("[v0] Error fetching user performance:", error)
        throw error
      }

      console.log("[v0] User sessions found:", data?.length || 0)
      return NextResponse.json({ data })
    }

    if (type === "insights") {
      const { data: sessions, error } = await aiSupabase.from("user_pose_tracking").select("*")

      if (error) {
        console.error("[v0] Error fetching insights:", error)
        throw error
      }

      if (sessions && sessions.length > 0) {
        const avgAccuracy = sessions.reduce((sum, s) => sum + (s.overall_accuracy || 0), 0) / sessions.length
        const totalSessions = sessions.length
        const uniqueUsers = new Set(sessions.map((s) => s.user_email || s.user_id)).size

        const jointData = sessions.reduce((acc, s) => {
          const joints = s.joint_accuracies || {}
          Object.entries(joints).forEach(([joint, accuracy]: [string, any]) => {
            if (!acc[joint]) acc[joint] = []
            acc[joint].push(accuracy)
          })
          return acc
        }, {} as any)

        const jointAccuracy = Object.entries(jointData).reduce((acc, [joint, values]: [string, any]) => {
          acc[joint] = values.reduce((sum: number, v: number) => sum + v, 0) / values.length
          return acc
        }, {} as any)

        return NextResponse.json({
          data: {
            avgAccuracy,
            totalSessions,
            uniqueUsers,
            jointAccuracy,
          },
        })
      }

      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error in pose analytics:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    const aiSupabase = getAISupabaseClient()

    const { error } = await aiSupabase.from("instructor_poses").delete().eq("id", sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
