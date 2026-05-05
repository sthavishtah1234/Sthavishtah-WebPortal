import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // Run the populate_video_analytics function
    await supabase.rpc("populate_video_analytics")

    // Return success
    return NextResponse.json({
      success: true,
      message: "Dashboard data refreshed successfully",
    })
  } catch (error) {
    console.error("Error refreshing dashboard data:", error)
    return NextResponse.json({ success: false, message: "Failed to refresh dashboard data", error }, { status: 500 })
  }
}
