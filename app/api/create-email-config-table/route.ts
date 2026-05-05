import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Create the email_config table using SQL
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS email_config (
        id SERIAL PRIMARY KEY,
        host VARCHAR(255) NOT NULL,
        port VARCHAR(10) NOT NULL,
        secure BOOLEAN DEFAULT false,
        email_user VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        admin_password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error } = await supabase.sql(createTableSql)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Email configuration table created successfully",
    })
  } catch (error) {
    console.error("Error creating email config table:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create email configuration table: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
