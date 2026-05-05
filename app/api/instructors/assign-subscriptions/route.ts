import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { instructor_id, subscription_ids } = await request.json()

    if (!instructor_id || !Array.isArray(subscription_ids)) {
      return NextResponse.json({ success: false, error: "Invalid instructor_id or subscription_ids" }, { status: 400 })
    }

    // First, remove all existing access for this instructor
    const { error: deleteError } = await supabase
      .from("instructor_subscription_access")
      .delete()
      .eq("instructor_id", instructor_id)

    if (deleteError) {
      console.error("Error removing existing access:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to update subscription access" }, { status: 500 })
    }

    // Then, add new access records
    if (subscription_ids.length > 0) {
      const accessRecords = subscription_ids.map((subscription_id) => ({
        instructor_id,
        subscription_id,
        granted_at: new Date().toISOString(),
        granted_by: "admin", // You might want to track which admin granted this
      }))

      const { error: insertError } = await supabase.from("instructor_subscription_access").insert(accessRecords)

      if (insertError) {
        console.error("Error inserting new access:", insertError)
        return NextResponse.json({ success: false, error: "Failed to grant subscription access" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription access updated successfully",
    })
  } catch (error) {
    console.error("Error in assign-subscriptions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
