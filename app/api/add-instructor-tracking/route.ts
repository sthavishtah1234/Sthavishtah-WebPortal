import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Execute the SQL to add instructor tracking columns
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        -- Add instructor_id to notifications table to track who created them
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id);

        -- Add instructor_id to documents table to track who created them  
        ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id);

        -- Add instructor_id to user_documents table to track who created them
        ALTER TABLE user_documents  
        ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id);

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_notifications_instructor_id ON notifications(instructor_id);
        CREATE INDEX IF NOT EXISTS idx_documents_instructor_id ON documents(instructor_id);  
        CREATE INDEX IF NOT EXISTS idx_user_documents_instructor_id ON user_documents(instructor_id);
      `,
    })

    if (error) {
      console.error("Error adding instructor tracking:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Instructor tracking columns added successfully",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
