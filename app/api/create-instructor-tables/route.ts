import { getSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "instructor_tables.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.from("_exec_sql").select("*").eq("query", sqlQuery)

    if (error) {
      console.error("Error creating instructor tables:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Instructor tables created successfully",
      tables: [
        "instructors",
        "instructor_sessions",
        "instructor_courses",
        "instructor_availability",
        "instructor_qualifications",
        "instructor_payments",
      ],
    })
  } catch (error) {
    console.error("Error creating instructor tables:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
