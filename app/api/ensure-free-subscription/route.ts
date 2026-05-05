import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Check if a free 30-day subscription exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("price", 0)
      .eq("duration_days", 30)
      .eq("is_default_for_new_users", true)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking for free subscription:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    // If it already exists, return it
    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "Free 30-day subscription already exists",
        subscription: existingSubscription,
      })
    }

    // Create the free 30-day subscription
    const { data: newSubscription, error: createError } = await supabase
      .from("subscriptions")
      .insert({
        name: "1 Month Free Trial",
        description: "Free 30-day access to basic yoga content for new users",
        price: 0,
        duration_days: 30,
        is_default_for_new_users: true,
        is_one_time_only: true,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating free subscription:", createError)
      return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Free 30-day subscription created successfully",
      subscription: newSubscription,
    })
  } catch (error: any) {
    console.error("Error in ensure-free-subscription API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
