import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Check if the free subscription already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("name", "Joining 1 Month Free Sessions")
      .eq("price", 0)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Error checking for existing subscription: ${checkError.message}`)
    }

    // If the subscription already exists, return its ID
    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "Free subscription already exists",
        id: existingSubscription.id,
      })
    }

    // Create the free subscription with minimal required fields
    // to avoid issues with schema cache
    const subscriptionData = {
      name: "Joining 1 Month Free Sessions",
      description: "Free access to basic sessions for new users",
      price: 0,
      duration_days: 30,
    }

    // Try to add the default for new users flag if it exists
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            ...subscriptionData,
            is_default_for_new_users: true,
          },
        ])
        .select()

      if (!error) {
        return NextResponse.json({
          success: true,
          message: "Free subscription created successfully",
          id: data[0].id,
        })
      }

      // If that fails, try without the flag
      console.warn("Could not set is_default_for_new_users, trying without it")
    } catch (err) {
      console.warn("Error setting is_default_for_new_users:", err)
    }

    // Fallback to basic insert without additional columns
    const { data, error } = await supabase.from("subscriptions").insert([subscriptionData]).select()

    if (error) {
      throw new Error(`Error creating free subscription: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Free subscription created successfully (basic version)",
      id: data[0].id,
    })
  } catch (error) {
    console.error("Error creating free subscription:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
