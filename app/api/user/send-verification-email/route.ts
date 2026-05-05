import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name, userId } = await request.json()

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/user/verify-email?token=${Buffer.from(`${userId}:${Date.now()}`).toString("base64")}`

    await resend.emails.send({
      from: "Sthavishtah Yoga <noreply@sthavishtah.com>",
      to: email,
      subject: "Verify Your Email - Sthavishtah Yoga",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Sthavishtah Yoga, ${name}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationLink}</p>
          <p style="color: #888; font-size: 12px; margin-top: 40px;">
            If you didn't create an account with Sthavishtah Yoga, please ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending verification email:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
