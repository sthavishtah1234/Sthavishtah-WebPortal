import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient()
    const { subscriptionIds, activationDate, notes } = await request.json()

    if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0 || !activationDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get all selected subscriptions to calculate new end dates
    const { data: selectedSubs, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        subscription:subscriptions (duration_days)
      `)
      .in("id", subscriptionIds)

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    const activationDateObj = new Date(activationDate)
    const results = []

    // Process each subscription
    for (const sub of selectedSubs || []) {
      const durationDays = sub?.subscription?.duration_days || 30
      const newEndDate = new Date(activationDateObj)
      newEndDate.setDate(newEndDate.getDate() + durationDays)

      // Update the subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          is_active: true,
          activation_date: activationDateObj.toISOString(),
          admin_activated: true,
          activation_notes: notes || "Bulk activated by admin",
          end_date: newEndDate.toISOString(), // Update end date based on activation date
        })
        .eq("id", sub.id)

      results.push({
        id: sub.id,
        success: !error,
        error: error?.message,
      })
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      message: `${successCount} subscriptions activated successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      results,
    })
  } catch (error: any) {
    console.error("Error bulk activating subscriptions:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
