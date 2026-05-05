import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const migrationSQL = `
    -- Add start_date and end_date columns to subscriptions table if they don't exist
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'start_date') THEN
            ALTER TABLE subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'end_date') THEN
            ALTER TABLE subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
        END IF;

        -- Update existing subscriptions with default values
        UPDATE subscriptions 
        SET 
            start_date = COALESCE(start_date, NOW()),
            end_date = COALESCE(end_date, NOW() + (duration_days || ' days')::INTERVAL)
        WHERE 
            start_date IS NULL OR end_date IS NULL;
    END $$;
    `

    // Execute the migration
    const { error } = await supabase.rpc("pgclient", { query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
