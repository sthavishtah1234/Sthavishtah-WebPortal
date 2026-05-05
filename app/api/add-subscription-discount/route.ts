import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // SQL to add discount columns
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Add discount-related columns to the subscriptions table
        ALTER TABLE subscriptions 
        ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) DEFAULT NULL;
        
        -- Update existing subscriptions to have has_discount = FALSE
        UPDATE subscriptions
        SET has_discount = FALSE
        WHERE has_discount IS NULL;
        
        -- Set discount_percentage to 0 for existing subscriptions
        UPDATE subscriptions
        SET discount_percentage = 0
        WHERE discount_percentage IS NULL;
      `,
    })

    if (error) {
      console.error("Error adding discount columns:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added discount columns to subscriptions table",
    })
  } catch (error) {
    console.error("Error in add-subscription-discount:", error)
    return NextResponse.json({ success: false, error: "Failed to add discount columns" }, { status: 500 })
  }
}
