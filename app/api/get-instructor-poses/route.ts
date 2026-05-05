import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const aiSupabase = createClient(process.env.AI_SUPABASE_URL!, process.env.AI_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const { data: session, error } = await aiSupabase.from("instructor_poses").select("*").eq("id", sessionId).single()

    if (error) {
      console.error("[v0] ❌ Failed to fetch instructor poses:", error)
      return NextResponse.json({ error: "Failed to fetch poses" }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Extract poses array from JSONB column and format for compatibility
    const poses = (session.poses || []).map((pose: any) => ({
      timestamp_ms: pose.timestamp,
      pose_landmarks: pose.landmarks,
      visibility_scores: pose.visibility,
    }))

    console.log("[v0] ✅ Fetched", poses.length, "poses from optimized table")

    return NextResponse.json({ poses })
  } catch (error) {
    console.error("[v0] ❌ Error fetching instructor poses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
