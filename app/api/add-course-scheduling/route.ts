import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const response = await fetch(new URL("/db/add_course_scheduling_fields.sql", import.meta.url))
    const sql = await response.text()

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error adding course scheduling fields:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Course scheduling fields added successfully" })
  } catch (error: any) {
    console.error("Error in add-course-scheduling API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
