import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Run the SQL to update the payments table constraint
    const { error } = await supabase.rpc("run_sql", {
      sql: `
        -- Allow NULL values in subscription_id column of payments table
        ALTER TABLE payments ALTER COLUMN subscription_id DROP NOT NULL;
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Payment constraints updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
