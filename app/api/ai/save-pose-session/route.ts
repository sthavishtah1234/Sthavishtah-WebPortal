import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Received pose batch upload request")
    const { courseId, videoName, videoUrl, poses, is_final } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    const posesArray = poses.map((pose: any) => ({
      timestamp: pose.timestamp || 0,
      landmarks: pose.landmarks,
    }))

    const { data: existingData } = await aiSupabase
      .from("instructor_poses")
      .select("id, total_frames, poses_chunk_1, poses_chunk_2, poses_chunk_3, poses_chunk_4, poses_chunk_5")
      .eq("course_id", courseId)
      .single()

    if (!existingData) {
      const { data: poseData, error: insertError } = await aiSupabase
        .from("instructor_poses")
        .insert({
          course_id: courseId,
          video_url: videoUrl || null,
          total_frames: posesArray.length,
          poses_chunk_1: posesArray,
          poses_chunk_2: [],
          poses_chunk_3: [],
          poses_chunk_4: [],
          poses_chunk_5: [],
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Insert error:", insertError)
        throw insertError
      }

      console.log("[v0] Created new pose record with", posesArray.length, "frames in chunk_1")
      return NextResponse.json({
        sessionId: poseData.id,
        success: true,
        totalFrames: posesArray.length,
      })
    } else {
      const currentTotal = existingData.total_frames || 0
      const newTotal = currentTotal + posesArray.length
      const chunkNumber = Math.floor(currentTotal / 1000) + 1

      console.log(`[v0] Appending ${posesArray.length} frames to chunk_${chunkNumber} (current total: ${currentTotal})`)

      if (chunkNumber > 5) {
        return NextResponse.json({ error: "Maximum frame limit reached (5000 frames)" }, { status: 400 })
      }

      const chunkColumnName = `poses_chunk_${chunkNumber}`
      const existingChunk = existingData[chunkColumnName] || []
      const updatedChunk = [...existingChunk, ...posesArray]

      const updateData: any = {
        [chunkColumnName]: updatedChunk,
        total_frames: newTotal,
      }

      if (videoUrl) {
        updateData.video_url = videoUrl
      }

      const { error: updateError } = await aiSupabase
        .from("instructor_poses")
        .update(updateData)
        .eq("course_id", courseId)

      if (updateError) {
        console.error("[v0] Update error:", updateError)
        throw updateError
      }

      console.log(`[v0] Successfully updated chunk_${chunkNumber}, new total: ${newTotal}`)
      return NextResponse.json({
        sessionId: existingData.id,
        success: true,
        totalFrames: newTotal,
      })
    }
  } catch (error: any) {
    console.error("[v0] Error saving pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { courseId, totalFrames } = await request.json()

    const aiSupabase = getAISupabaseClient()

    const { error } = await aiSupabase
      .from("instructor_poses")
      .update({
        total_frames: totalFrames,
      })
      .eq("course_id", courseId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error updating pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
