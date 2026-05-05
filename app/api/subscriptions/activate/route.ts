import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(req: Request) {
  const { id, activationDate, notes } = await req.json()

  if (!id || !activationDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get the subscription to calculate new end date
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription:subscriptions (duration_days)
      `)
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Calculate new end date based on activation date and duration with 3-day grace period
    const durationDays = subscription?.subscription?.duration_days || 30
    const newEndDate = new Date(activationDate)
    newEndDate.setDate(newEndDate.getDate() + durationDays + 3)

    // Update the subscription
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        is_active: true,
        activation_date: activationDate,
        admin_activated: true,
        activation_notes: notes || null,
        end_date: newEndDate.toISOString(), // Update end date based on activation date
        last_activation_date: new Date().toISOString(), // Track last activation date
        days_left: durationDays + 3, // Include 3-day grace period
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Subscription activated successfully" })
  } catch (error) {
    console.error("Error activating subscription:", error)
    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
  }
}
