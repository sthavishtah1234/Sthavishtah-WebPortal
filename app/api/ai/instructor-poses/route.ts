export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")
    const courseId = searchParams.get("courseId")

    if (!sessionId && !courseId) {
      return NextResponse.json({ error: "Session ID or Course ID required" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    let query = aiSupabase.from("instructor_poses").select("*")

    if (sessionId) {
      query = query.eq("id", sessionId)
    } else if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data: session, error: dataError } = await query.single()

    if (dataError) throw dataError

    if (!session) {
      return NextResponse.json({ error: "No pose data found" }, { status: 404 })
    }

    const allPoses = [
      ...(session.poses_chunk_1 || []),
      ...(session.poses_chunk_2 || []),
      ...(session.poses_chunk_3 || []),
      ...(session.poses_chunk_4 || []),
      ...(session.poses_chunk_5 || []),
    ]

    // Format poses for compatibility with existing code
    const poses = allPoses.map((pose: any) => ({
      timestamp: pose.timestamp || 0,
      landmarks: pose.landmarks || [],
    }))

    // If video_url is missing in instructor_poses, fall back to courses.youtube_link
    let videoUrl: string | null = session.video_url || null
    if (!videoUrl && session.course_id) {
      try {
        const supabase = getSupabaseServerClient()
        const { data: courseData } = await supabase
          .from("courses")
          .select("youtube_link")
          .eq("id", session.course_id)
          .single()
        if (courseData?.youtube_link) {
          videoUrl = courseData.youtube_link
          console.log("[instructor-poses] Resolved video_url from courses.youtube_link:", videoUrl)
        }
      } catch (e) {
        console.warn("[instructor-poses] Could not fetch fallback youtube_link from courses:", e)
      }
    }

    return NextResponse.json({
      poses,
      video_url: videoUrl,
      session: {
        id: session.id,
        course_id: session.course_id,
        video_url: videoUrl,
        total_frames: session.total_frames,
        processed_at: session.processed_at,
      },
    })
  } catch (error: any) {
    console.error("Error fetching instructor poses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
