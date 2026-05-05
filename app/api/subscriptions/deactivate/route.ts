import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(req: Request) {
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get the subscription to calculate active days since last activation
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        last_activation_date,
        total_active_days
      `)
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const lastActivation = subscription?.last_activation_date ? new Date(subscription.last_activation_date) : null
    const totalActiveDays = subscription?.total_active_days || 0

    // Calculate active days since last activation
    let newTotalActiveDays = totalActiveDays
    if (lastActivation) {
      const now = new Date()
      const diffTime = now.getTime() - lastActivation.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      newTotalActiveDays += diffDays
    }

    // Update the subscription
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        is_active: false,
        admin_activated: true,
        activation_notes: "Manually deactivated by admin",
        total_active_days: newTotalActiveDays, // Update total active days
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Subscription deactivated successfully" })
  } catch (error) {
    console.error("Error deactivating subscription:", error)
    return NextResponse.json({ error: "Failed to deactivate subscription" }, { status: 500 })
  }
}
