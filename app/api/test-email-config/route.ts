import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json()

    // Validate the configuration
    if (!config.host || !config.port || !config.email_user || !config.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required email configuration. Please fill in all fields.",
        },
        { status: 400 },
      )
    }

    // In preview mode, we can't actually send emails due to DNS lookup limitations
    // Instead, we'll validate the configuration format and return a success message

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(config.email_user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format. Please enter a valid email address.",
        },
        { status: 400 },
      )
    }

    // Validate port number
    const port = Number.parseInt(config.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid port number. Port must be between 1 and 65535.",
        },
        { status: 400 },
      )
    }

    // Check for common SMTP hosts
    const commonHosts = [
      "smtp.gmail.com",
      "smtp.office365.com",
      "smtp.mail.yahoo.com",
      "smtp-mail.outlook.com",
      "smtp.zoho.com",
      "smtp.mailgun.org",
      "smtp.sendgrid.net",
    ]

    const isCommonHost = commonHosts.includes(config.host.toLowerCase())
    let hostMessage = ""

    if (!isCommonHost) {
      hostMessage = " (Note: This doesn't appear to be a common SMTP host. Please verify it's correct.)"
    }

    // Log the configuration for debugging
    console.log("Email configuration validated:", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      email_user: config.email_user,
      // Don't log the password
    })

    return NextResponse.json({
      success: true,
      message: `Configuration validated successfully.${hostMessage} Note: Actual email sending is not available in preview mode.`,
      previewMode: true,
      configValidated: true,
    })
  } catch (error) {
    console.error("Error validating email config:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Configuration validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        previewMode: true,
      },
      { status: 500 },
    )
  }
}
