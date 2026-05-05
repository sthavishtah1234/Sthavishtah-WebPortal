import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Run the SQL to add the missing columns
    const { error } = await supabase.rpc("run_sql", {
      sql: `
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_default_for_new_users BOOLEAN DEFAULT FALSE;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_one_time_only BOOLEAN DEFAULT FALSE;
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_one_time_subscription BOOLEAN DEFAULT FALSE;
      `,
    })

    if (error) {
      throw new Error(`Error running migration: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
    })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
