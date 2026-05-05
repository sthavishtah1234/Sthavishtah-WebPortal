import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // SQL to add new columns
    const sql = `
      -- Add difficulty and category columns to courses table
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'beginner',
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'hatha';
      
      -- Update existing records to have default values
      UPDATE courses 
      SET difficulty = 'beginner', category = 'hatha'
      WHERE difficulty IS NULL OR category IS NULL;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Course fields added successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
