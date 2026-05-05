import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const adminPassword = request.headers.get("x-admin-password")
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get ALL user subscriptions (active and inactive) that have activation dates
    const { data: allSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        is_active,
        activation_date,
        total_active_days_used,
        subscriptions!inner(duration_days, name)
      `)
      .not("activation_date", "is", null)

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (!allSubscriptions || allSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions with activation dates found",
        updated: 0,
      })
    }

    const today = new Date()
    let updatedCount = 0
    const results = []

    for (const subscription of allSubscriptions) {
      const durationDays = subscription.subscriptions.duration_days
      const activationDate = new Date(subscription.activation_date)

      // Calculate days since activation
      const timeDiff = today.getTime() - activationDate.getTime()
      const daysSinceActivation = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 to include activation day

      // Cap at duration days and ensure not negative
      const correctTotalDays = Math.min(Math.max(daysSinceActivation, 0), durationDays)
      const currentDays = subscription.total_active_days_used || 0

      // Determine if should be active (not expired)
      const shouldBeActive = correctTotalDays < durationDays

      // Always update to ensure consistency
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          total_active_days_used: correctTotalDays,
          is_active: shouldBeActive,
        })
        .eq("id", subscription.id)

      if (updateError) {
        console.error(`Error updating subscription ${subscription.id}:`, updateError)
        results.push({
          subscription_id: subscription.id,
          subscription_name: subscription.subscriptions.name,
          error: updateError.message,
        })
      } else {
        updatedCount++
        results.push({
          subscription_id: subscription.id,
          subscription_name: subscription.subscriptions.name,
          user_id: subscription.user_id,
          activation_date: subscription.activation_date,
          old_days: currentDays,
          correct_days: correctTotalDays,
          days_since_activation: daysSinceActivation,
          duration_days: durationDays,
          was_active: subscription.is_active,
          now_active: shouldBeActive,
          changed: currentDays !== correctTotalDays || subscription.is_active !== shouldBeActive,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Force updated ${updatedCount} subscriptions`,
      updated: updatedCount,
      total_processed: allSubscriptions.length,
      results: results,
    })
  } catch (error) {
    console.error("Error force updating subscription days:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to force update subscription days",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
