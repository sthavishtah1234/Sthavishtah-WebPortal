import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "create_link_tables.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error creating link tables:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Link tables created successfully" })
  } catch (error) {
    console.error("Error in create-link-tables route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
