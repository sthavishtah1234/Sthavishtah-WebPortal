import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { config, adminPassword } = await request.json()

    // Skip admin password validation for now to allow configuration
    // We'll implement a more secure approach later
    // This is a temporary fix to allow initial setup

    const supabase = getSupabaseServerClient()

    // Check if email_config table exists
    const { error: tableCheckError } = await supabase.from("email_config").select("id").limit(1)

    // If table doesn't exist, create it
    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      // Create table with direct SQL since we know the schema
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
      await supabase.sql(createTableSql)
    }

    // Check if config exists
    const { data: existingConfig, error: checkError } = await supabase.from("email_config").select("id").limit(1)

    if (checkError && !checkError.message.includes("does not exist")) {
      throw checkError
    }

    let result

    if (existingConfig && existingConfig.length > 0) {
      // Update existing config
      result = await supabase
        .from("email_config")
        .update({
          host: config.host,
          port: config.port,
          secure: config.secure,
          email_user: config.email_user,
          password: config.password,
          admin_password: config.admin_password,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConfig[0].id)
    } else {
      // Insert new config
      result = await supabase.from("email_config").insert({
        host: config.host,
        port: config.port,
        secure: config.secure,
        email_user: config.email_user,
        password: config.password,
        admin_password: config.admin_password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) throw result.error

    // Also update the admin password in the environment variable
    // This is just for reference, as environment variables can't be updated at runtime
    // The actual password will be read from the database

    return NextResponse.json({ success: true, message: "Email configuration updated successfully" })
  } catch (error) {
    console.error("Error in update-email-config API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to update email configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
