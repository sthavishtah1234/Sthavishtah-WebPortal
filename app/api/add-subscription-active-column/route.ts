import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Execute the SQL to add the is_active column
    const { error } = await supabase.rpc("run_sql", {
      sql: `
        -- Add is_active column to subscriptions table if it doesn't exist
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'is_active'
            ) THEN
                ALTER TABLE subscriptions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            END IF;
        END $$;

        -- Update existing subscriptions to be active by default
        UPDATE subscriptions SET is_active = TRUE WHERE is_active IS NULL;
      `,
    })

    if (error) {
      console.error("Error adding is_active column:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "is_active column added to subscriptions table" })
  } catch (error: any) {
    console.error("Error in add-subscription-active-column API:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
