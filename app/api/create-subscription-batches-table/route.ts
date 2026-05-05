import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const response = await fetch(new URL("/db/subscription_batches_schema.sql", import.meta.url))
    const sql = await response.text()

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating subscription batches table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Subscription batches table created successfully" })
  } catch (error: any) {
    console.error("Error in create-subscription-batches-table API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
