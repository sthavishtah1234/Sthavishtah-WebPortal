import { getSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient()

    // SQL to add activation_date column
    const sql = `
      -- Add activation_date column to subscriptions table
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE;
      
      -- Create an index for faster queries
      CREATE INDEX IF NOT EXISTS idx_subscriptions_activation_date 
      ON subscriptions(activation_date);
      
      -- Update existing subscriptions to have an activation date if they don't already
      UPDATE subscriptions 
      SET activation_date = created_at
      WHERE activation_date IS NULL;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error adding activation_date column:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Added activation_date column to subscriptions table successfully",
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
