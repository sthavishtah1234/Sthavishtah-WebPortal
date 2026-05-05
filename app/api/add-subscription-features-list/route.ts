import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // SQL to add the features_list column if it doesn't exist
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Add features_list column if it doesn't exist
        ALTER TABLE subscriptions 
        ADD COLUMN IF NOT EXISTS features_list TEXT[] DEFAULT NULL;
        
        -- Update existing subscriptions with default features based on duration
        UPDATE subscriptions 
        SET features_list = ARRAY['Access to all basic yoga sessions', 'Monthly progress tracking', 'Email support']
        WHERE duration_days = 30 AND features_list IS NULL;
        
        UPDATE subscriptions 
        SET features_list = ARRAY['Access to all basic and intermediate yoga sessions', 'Quarterly progress tracking', 'Priority email support', 'Access to community forums']
        WHERE duration_days = 90 AND features_list IS NULL;
        
        UPDATE subscriptions 
        SET features_list = ARRAY['Access to all yoga sessions (basic, intermediate, advanced)', 'Annual progress tracking', 'Priority email and phone support', 'Access to community forums', 'Exclusive workshops and events']
        WHERE duration_days = 365 AND features_list IS NULL;
      `,
    })

    if (error) {
      console.error("Error adding features_list column:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added features_list column to subscriptions table and populated default values",
    })
  } catch (error) {
    console.error("Error in add-subscription-features-list:", error)
    return NextResponse.json({ success: false, error: "Failed to add features_list column" }, { status: 500 })
  }
}
