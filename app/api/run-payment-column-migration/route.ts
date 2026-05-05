import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "add_order_id_to_payments.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to run migration",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added order_id column to payments table",
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
