import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const response = await fetch(new URL("/db/batch_procedures.sql", import.meta.url))
    const sql = await response.text()

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating batch procedures:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Batch procedures created successfully" })
  } catch (error: any) {
    console.error("Error in create-batch-procedures API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
