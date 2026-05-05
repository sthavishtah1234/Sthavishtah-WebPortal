import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Add is_default_for_new_users column if it doesn't exist
    const { error: defaultError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "subscriptions",
      column_name: "is_default_for_new_users",
      column_type: "boolean",
      default_value: "false",
    })

    if (defaultError) {
      console.error("Error adding is_default_for_new_users column:", defaultError)
    }

    // Add is_one_time_only column if it doesn't exist
    const { error: oneTimeError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "subscriptions",
      column_name: "is_one_time_only",
      column_type: "boolean",
      default_value: "false",
    })

    if (oneTimeError) {
      console.error("Error adding is_one_time_only column:", oneTimeError)
    }

    // Add is_one_time_subscription column to user_subscriptions if it doesn't exist
    const { error: userSubError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "user_subscriptions",
      column_name: "is_one_time_subscription",
      column_type: "boolean",
      default_value: "false",
    })

    if (userSubError) {
      console.error("Error adding is_one_time_subscription column:", userSubError)
    }

    return NextResponse.json({
      success: true,
      message: "Subscription schema updated successfully",
    })
  } catch (error) {
    console.error("Error updating subscription schema:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
