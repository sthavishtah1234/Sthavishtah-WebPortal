import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.corn_secret || process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")

    if (authHeader && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[v0] Unauthorized cron request - invalid Bearer token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting subscription day update API...")

    const supabase = getSupabaseServerClient()
    console.log("[v0] Supabase client created")

    const { count: totalCount } = await supabase.from("user_subscriptions").select("*", { count: "exact", head: true })

    console.log("[v0] Total subscriptions in table:", totalCount)

    console.log("[v0] Fetching user subscriptions...")
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
        days_left
      `)
      .eq("is_active", true) // Only get active subscriptions

    if (fetchError) {
      console.error("[v0] Error fetching subscriptions:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch subscriptions",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Found", userSubscriptions?.length || 0, "active subscriptions")

    if (userSubscriptions && userSubscriptions.length > 0) {
      console.log("[v0] Sample subscriptions:", JSON.stringify(userSubscriptions.slice(0, 3), null, 2))
    }

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No active subscriptions to update",
        totalInTable: totalCount,
        activeFound: 0,
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]
    console.log("[v0] Today's date:", todayStr)

    let updatedCount = 0
    let alreadyProcessedToday = 0
    let expiredCount = 0
    let errorCount = 0

    for (const subscription of userSubscriptions) {
      try {
        if (subscription.last_day_counted === todayStr) {
          alreadyProcessedToday++
          console.log(`[v0] Subscription ${subscription.id} already processed today, skipping`)
          continue
        }

        const currentDaysLeft = subscription.days_left || 0

        if (currentDaysLeft <= 0) {
          console.log(`[v0] Subscription ${subscription.id} already expired (days_left: ${currentDaysLeft}), skipping`)
          continue
        }

        const newDaysLeft = Math.max(0, currentDaysLeft - 1)
        const shouldExpire = newDaysLeft <= 0

        console.log(`[v0] Subscription ${subscription.id}: days_left ${currentDaysLeft} → ${newDaysLeft}`)

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            days_left: newDaysLeft,
            is_active: !shouldExpire,
            last_day_counted: todayStr,
            total_active_days_used: (subscription.total_active_days_used || 0) + 1,
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`[v0] Error updating subscription ${subscription.id}:`, updateError)
          errorCount++
          continue
        }

        if (shouldExpire) {
          expiredCount++
          console.log(`[v0] Subscription ${subscription.id} EXPIRED`)
        }

        updatedCount++
      } catch (error) {
        console.error(`[v0] Error processing subscription ${subscription.id}:`, error)
        errorCount++
        continue
      }
    }

    const result = {
      message: `Updated ${updatedCount} subscriptions`,
      totalInTable: totalCount,
      activeFound: userSubscriptions.length,
      updatedCount,
      alreadyProcessedToday,
      expiredCount,
      errorCount,
    }

    console.log("[v0] Update complete:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] CRITICAL ERROR in update-subscription-days:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
