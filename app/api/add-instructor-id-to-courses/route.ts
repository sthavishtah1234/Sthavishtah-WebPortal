import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // SQL to add instructor_id column to courses table
    const sql = `
      -- Add instructor_id column to courses table if it doesn't exist
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id);
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error adding instructor_id to courses:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Added instructor_id to courses table" })
  } catch (error) {
    console.error("Error in add-instructor-id-to-courses:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
