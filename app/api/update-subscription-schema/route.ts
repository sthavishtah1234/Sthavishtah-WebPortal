import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Add new columns to the subscriptions table
    const migrationSQL = `
    -- Add is_permanent and is_default_for_new_users columns to subscriptions table
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'is_permanent') THEN
            ALTER TABLE subscriptions ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'is_default_for_new_users') THEN
            ALTER TABLE subscriptions ADD COLUMN is_default_for_new_users BOOLEAN DEFAULT FALSE;
        END IF;
    END $$;

    -- Create system_settings table if it doesn't exist
    CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `

    // Execute the migration
    const { error } = await supabase.rpc("pgclient", { query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Schema updated successfully" })
  } catch (error) {
    console.error("Error updating schema:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
