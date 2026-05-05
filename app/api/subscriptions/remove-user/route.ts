import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, subscriptionId } = await request.json()

    if (!userId || !subscriptionId) {
      return NextResponse.json({ success: false, error: "User ID and Subscription ID are required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Update user subscription to inactive
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("subscription_id", subscriptionId)

    if (error) {
      console.error("Error removing user from subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in remove-user API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
