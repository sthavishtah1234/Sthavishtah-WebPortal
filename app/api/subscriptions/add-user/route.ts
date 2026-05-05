import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, subscriptionId, durationDays, batchId } = await request.json()

    if (!userId || !subscriptionId) {
      return NextResponse.json({ success: false, error: "User ID and Subscription ID are required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Calculate end date based on subscription duration
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (durationDays || 30))

    // Add user to subscription
    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      subscription_id: subscriptionId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      is_active: true,
      batch_id: batchId || null,
    })

    if (error) {
      console.error("Error adding user to subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // If a batch ID was provided, update the batch's seats_taken count
    if (batchId) {
      const { error: batchError } = await supabase.rpc("increment_batch_seats", { batch_id: batchId })

      if (batchError) {
        console.error("Error updating batch seats:", batchError)
        // Don't return an error here, as the subscription was already created
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in add-user API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
