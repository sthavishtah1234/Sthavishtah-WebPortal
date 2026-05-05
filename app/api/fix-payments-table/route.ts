import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "fix_payments_table.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully updated payments table with all required columns",
    })
  } catch (error: any) {
    console.error("Error in fix-payments-table API route:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
