import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    const sql = `
      -- Add features column to subscriptions table
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
      
      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_subscriptions_features ON subscriptions USING GIN (features);
    `

    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: "Subscription features column added successfully" },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
