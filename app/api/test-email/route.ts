import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ success: false, message: "Test email address is required" }, { status: 400 })
    }

    // Use Resend API with your verified domain
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured. RESEND_API_KEY environment variable is missing.",
        },
        { status: 500 },
      )
    }

    console.log("Sending test email using Resend API with verified domain...")

    // Send test email using Resend API with your verified domain
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sthavishtah Yoga <noreply@sthavishtah.com>", // Your verified domain
        to: [testEmail],
        subject: "Email Configuration Test - Sthavishtah Yoga",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #4a5568; margin-bottom: 20px;">🌍 Verified Domain Email Test - Sthavishtah Yoga</h2>
              <p style="color: #2d3748; font-size: 16px; line-height: 1.6;">Namaste!</p>
              <p style="color: #2d3748; font-size: 16px; line-height: 1.6;">
                This email is being sent from our verified domain <strong>sthavishtah.com</strong> using Resend.
              </p>
              <div style="background-color: #e6fffa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38b2ac;">
                <h3 style="color: #2c7a7b; margin: 0 0 10px 0;">🎉 Success!</h3>
                <p style="color: #2c7a7b; margin: 0; font-size: 14px;">
                  Your verified domain is working! You can now send emails to anyone worldwide.
                </p>
              </div>
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1e40af; margin: 0 0 10px 0;">✅ Verified Domain Benefits</h4>
                <ul style="color: #1e40af; margin: 0; font-size: 14px; padding-left: 20px;">
                  <li>Send to any email address (no restrictions)</li>
                  <li>Better deliverability and reputation</li>
                  <li>Professional sender identity</li>
                  <li>Higher sending limits</li>
                </ul>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #718096; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Sthavishtah Yoga Team</strong><br>
                <em>Serving students worldwide with verified email delivery 🧘‍♀️</em>
              </p>
            </div>
          </div>
        `,
        text: `
Namaste!

Verified Domain Email Test - Sthavishtah Yoga

This email is being sent from our verified domain sthavishtah.com using Resend.

✅ SUCCESS: Your verified domain is working! You can now send emails to anyone worldwide.

✅ Verified Domain Benefits:
- Send to any email address (no restrictions)
- Better deliverability and reputation  
- Professional sender identity
- Higher sending limits

Best regards,
Sthavishtah Yoga Team
Serving students worldwide with verified email delivery 🧘‍♀️
        `,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`Test email sent successfully to ${testEmail}:`, data.id)

      return NextResponse.json({
        success: true,
        message: `✅ Verified domain test email sent successfully to ${testEmail}! You can now send to anyone.`,
        messageId: data.id,
        service: "Resend API (Verified Domain)",
        domain: "sthavishtah.com",
        capabilities: "Can send to any email address worldwide",
      })
    } else {
      const errorData = await response.json()
      console.error("Error sending test email:", errorData)

      return NextResponse.json(
        {
          success: false,
          message: `Test email failed: ${errorData.message || "Unknown error"}`,
          error: errorData,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Test email failed: ${String(error)}`,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
