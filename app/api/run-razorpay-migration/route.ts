import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "db", "razorpay_orders_schema.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
