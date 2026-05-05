import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Skip admin password validation for now

    // First try to get config from database
    const supabase = getSupabaseServerClient()

    try {
      const { data, error } = await supabase.from("email_config").select("*").limit(1)

      if (data && data.length > 0) {
        // Return the database config
        return NextResponse.json({
          EMAIL_HOST: data[0].host,
          EMAIL_PORT: data[0].port,
          EMAIL_SECURE: data[0].secure.toString(),
          EMAIL_USER: data[0].email_user,
          EMAIL_PASSWORD: data[0].password,
          ADMIN_PASSWORD: data[0].admin_password,
        })
      }
    } catch (dbError) {
      console.log("Database error or table doesn't exist yet:", dbError)
      // Continue to use environment variables
    }

    // If no database config, return environment variables
    return NextResponse.json({
      EMAIL_HOST: process.env.EMAIL_HOST || "",
      EMAIL_PORT: process.env.EMAIL_PORT || "",
      EMAIL_SECURE: process.env.EMAIL_SECURE || "false",
      EMAIL_USER: process.env.EMAIL_USER || "",
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    })
  } catch (error) {
    console.error("Error in get-email-config API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to get email configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
