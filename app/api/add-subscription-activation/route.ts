import { getSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "db", "add_subscription_activation_fields.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Added subscription activation fields successfully",
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
