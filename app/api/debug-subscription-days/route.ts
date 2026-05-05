import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const adminPassword = request.headers.get("x-admin-password")
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get detailed subscription information
    const { data: subscriptions, error } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        activation_date,
        is_active,
        total_active_days_used,
        created_at,
        subscriptions!inner(
          id,
          name,
          duration_days
        )
      `)
      .not("activation_date", "is", null)
      .order("activation_date", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calculate what the days should be for each subscription
    const today = new Date()
    const debugInfo = subscriptions?.map((sub) => {
      const activationDate = new Date(sub.activation_date)
      const timeDiff = today.getTime() - activationDate.getTime()
      const daysSinceActivation = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1

      return {
        id: sub.id,
        user_id: sub.user_id,
        subscription_name: sub.subscriptions.name,
        activation_date: sub.activation_date,
        is_active: sub.is_active,
        current_days_used: sub.total_active_days_used,
        calculated_days_should_be: Math.max(0, daysSinceActivation),
        duration_days: sub.subscriptions.duration_days,
        days_difference: daysSinceActivation - (sub.total_active_days_used || 0),
        is_expired: daysSinceActivation >= sub.subscriptions.duration_days,
        should_be_active: daysSinceActivation < sub.subscriptions.duration_days,
        activation_date_formatted: activationDate.toLocaleDateString(),
        today_formatted: today.toLocaleDateString(),
        raw_time_diff_ms: timeDiff,
        raw_days_calculation: timeDiff / (1000 * 60 * 60 * 24),
      }
    })

    return NextResponse.json({
      success: true,
      today: today.toISOString(),
      total_subscriptions: subscriptions?.length || 0,
      debug_info: debugInfo,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to debug subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const adminPassword = request.headers.get("x-admin-password")
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServerClient()

    // Fix all subscription days based on activation date
    const { data: subscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        activation_date,
        subscriptions!inner(duration_days)
      `)
      .not("activation_date", "is", null)

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    const today = new Date()
    const updates = []

    for (const sub of subscriptions || []) {
      const activationDate = new Date(sub.activation_date)
      const timeDiff = today.getTime() - activationDate.getTime()
      const daysSinceActivation = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1
      const correctDays = Math.max(0, Math.min(daysSinceActivation, sub.subscriptions.duration_days))
      const shouldBeActive = daysSinceActivation < sub.subscriptions.duration_days

      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          total_active_days_used: correctDays,
          is_active: shouldBeActive,
        })
        .eq("id", sub.id)

      if (updateError) {
        updates.push({
          id: sub.id,
          error: updateError.message,
        })
      } else {
        updates.push({
          id: sub.id,
          days_set_to: correctDays,
          is_active: shouldBeActive,
          days_since_activation: daysSinceActivation,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} subscriptions`,
      updates,
    })
  } catch (error) {
    console.error("Fix error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
