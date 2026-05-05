import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Add created_by_type column to existing tables
    const queries = [
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin'`,
      `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin'`,
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin'`,
      `ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin'`,

      // Update existing records
      `UPDATE courses SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL`,
      `UPDATE notifications SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL`,
      `UPDATE documents SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL`,
      `UPDATE user_documents SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL`,

      // Add constraints
      `ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_created_by_type_check CHECK (created_by_type IN ('admin', 'instructor'))`,
      `ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS notifications_created_by_type_check CHECK (created_by_type IN ('admin', 'instructor'))`,
      `ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS documents_created_by_type_check CHECK (created_by_type IN ('admin', 'instructor'))`,
      `ALTER TABLE user_documents ADD CONSTRAINT IF NOT EXISTS user_documents_created_by_type_check CHECK (created_by_type IN ('admin', 'instructor'))`,
    ]

    for (const query of queries) {
      const { error } = await supabase.rpc("exec_sql", { sql_query: query })
      if (error) {
        console.error(`Error executing query: ${query}`, error)
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added created_by_type columns and constraints",
    })
  } catch (error) {
    console.error("Error adding created_by_type columns:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
