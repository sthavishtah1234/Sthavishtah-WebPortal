import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// This API is called when user opens the app to check and update subscription days
export async function POST() {
  try {
    console.log("[v0] Client-initiated subscription day check...")

    const supabase = getSupabaseServerClient()

    // Get all active subscriptions that haven't been updated today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    const { data: userSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        activation_date,
        total_active_days_used,
        is_active,
        last_day_counted,
        subscription:subscriptions (
          duration_days,
          is_active
        )
      `)
      .not("activation_date", "is", null)
      .or(`last_day_counted.is.null,last_day_counted.lt.${todayStr}`)

    if (fetchError) {
      console.error("[v0] Error fetching subscriptions:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json({ message: "All subscriptions are up to date", updated: 0 })
    }

    console.log("[v0] Found", userSubscriptions.length, "subscriptions to check")

    let updatedCount = 0

    for (const subscription of userSubscriptions) {
      try {
        const baseDurationDays = subscription.subscription?.duration_days || 30
        const durationDays = baseDurationDays + 3
        const currentDaysUsed = subscription.total_active_days_used || 0

        // Skip if already expired
        if (currentDaysUsed >= durationDays) {
          if (subscription.is_active) {
            await supabase.from("user_subscriptions").update({ is_active: false }).eq("id", subscription.id)
          }
          continue
        }

        // Skip if subscription plan is inactive
        if (!subscription.subscription?.is_active) {
          await supabase.from("user_subscriptions").update({ last_day_counted: todayStr }).eq("id", subscription.id)
          continue
        }

        const activationDate = new Date(subscription.activation_date)
        activationDate.setHours(0, 0, 0, 0)

        // Calculate days since activation
        const daysSinceActivation = Math.floor((today.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24))
        const correctDaysUsed = Math.min(daysSinceActivation, durationDays)

        // Only update if there's a change
        if (correctDaysUsed !== currentDaysUsed || subscription.last_day_counted !== todayStr) {
          const shouldExpire = correctDaysUsed >= durationDays

          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .update({
              total_active_days_used: correctDaysUsed,
              is_active: !shouldExpire,
              last_day_counted: todayStr,
            })
            .eq("id", subscription.id)

          if (!updateError) {
            updatedCount++
            console.log(`[v0] Updated subscription ${subscription.id}: ${correctDaysUsed} days`)
          }
        }
      } catch (error) {
        console.error(`[v0] Error processing subscription ${subscription.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: `Checked and updated ${updatedCount} subscriptions`,
      updated: updatedCount,
    })
  } catch (error) {
    console.error("[v0] Error in check-and-update-days:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
