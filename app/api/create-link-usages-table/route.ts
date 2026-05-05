import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const sqlPath = join(process.cwd(), "db", "create_link_usages_table.sql")
    const sql = readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating link_usages table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Link usages table created successfully",
    })
  } catch (error) {
    console.error("Error in create-link-usages-table route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
