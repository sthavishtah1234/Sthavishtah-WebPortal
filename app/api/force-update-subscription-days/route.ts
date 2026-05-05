import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Get ALL subscriptions (not just active ones) to fix any inconsistencies
    const { data: allSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        is_active,
        activation_date,
        created_at,
        start_date,
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
        message: "No subscriptions found to update",
        updated: 0,
      })
    }

    const today = new Date()
    let updatedCount = 0
    const results = []

    for (const subscription of allSubscriptions) {
      const durationDays = subscription.subscriptions.duration_days
      const activationDate = new Date(subscription.activation_date)

      // Ensure activation date is not in the future
      if (activationDate > today) {
        results.push({
          subscription_id: subscription.id,
          subscription_name: subscription.subscriptions.name,
          error: "Activation date is in the future",
          activation_date: subscription.activation_date,
        })
        continue
      }

      // Calculate days since activation
      const timeDiffMs = today.getTime() - activationDate.getTime()
      const daysSinceActivation = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24)) + 1

      // Ensure we don't have negative days
      const calculatedDays = Math.max(0, daysSinceActivation)

      // Cap at duration days
      const newTotalDays = Math.min(calculatedDays, durationDays)
      const currentDays = subscription.total_active_days_used || 0

      // Determine if subscription should be active
      const shouldBeActive = newTotalDays < durationDays
      const currentlyActive = subscription.is_active

      // Update if days are different OR status is wrong
      if (newTotalDays !== currentDays || shouldBeActive !== currentlyActive) {
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            total_active_days_used: newTotalDays,
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
            old_days: currentDays,
            new_days: newTotalDays,
            old_status: currentlyActive ? "active" : "inactive",
            new_status: shouldBeActive ? "active" : "inactive",
            activation_date: subscription.activation_date,
            days_since_activation: calculatedDays,
            duration_days: durationDays,
            remaining_days: Math.max(0, durationDays - newTotalDays),
          })
        }
      } else {
        results.push({
          subscription_id: subscription.id,
          subscription_name: subscription.subscriptions.name,
          days: currentDays,
          status: currentlyActive ? "active" : "inactive",
          message: "no_change_needed",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Force updated ${updatedCount} subscriptions`,
      updated: updatedCount,
      total_checked: allSubscriptions.length,
      timestamp: new Date().toISOString(),
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

export async function GET() {
  return POST()
}
