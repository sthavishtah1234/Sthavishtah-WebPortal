"use server"

import { getSupabaseServerClient } from "@/lib/supabase"
import { createPasswordEmailTemplate } from "@/lib/email-template"

// Function to send an email using Resend API
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: { to: string; subject: string; text: string; html?: string }) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] ❌ RESEND_API_KEY is not configured in environment variables")
      return {
        success: false,
        error:
          "Email service not configured. Please set RESEND_API_KEY environment variable in Vercel project settings.",
      }
    }

    console.log(`[v0] 📧 Attempting to send email to ${to} with subject: ${subject}`)
    console.log(`[v0] 🔑 Using Resend API key: ${resendApiKey.substring(0, 10)}...`)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sthavishtah Yoga <noreply@sthavishtah.com>",
        to: [to],
        subject,
        html: html || text,
        text,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`[v0] ✅ Email sent successfully to ${to}:`, data.id)
      return { success: true, messageId: data.id }
    } else {
      const errorData = await response.json()
      console.error(`[v0] ❌ Resend API Error (Status ${response.status}):`, JSON.stringify(errorData, null, 2))
      console.error(`[v0] 📧 Failed email details - To: ${to}, Subject: ${subject}`)

      // Provide specific error messages based on common Resend errors
      let errorMessage = errorData.message || "Failed to send email"

      if (response.status === 401) {
        errorMessage = "Invalid Resend API key. Please check your RESEND_API_KEY in Vercel settings."
      } else if (response.status === 403) {
        errorMessage = "Domain not verified in Resend. Please verify sthavishtah.com in your Resend dashboard."
      } else if (response.status === 422) {
        errorMessage = `Invalid email data: ${errorData.message || "Check email format and content"}`
      }

      return {
        success: false,
        error: errorMessage,
        details: errorData,
      }
    }
  } catch (error) {
    console.error("[v0] ❌ Exception while sending email:", error)
    return {
      success: false,
      error: `Network error: ${String(error)}. Check your internet connection and Resend API status.`,
    }
  }
}

export async function sendPasswordEmail(email: string, name: string, userId: string, password?: string) {
  try {
    console.log(`[v0] Preparing password email for ${email}`)

    // Use the professional letterhead template for password emails
    const htmlContent = createPasswordEmailTemplate(name, userId, password || "Please use forgot password feature")

    const result = await sendEmail({
      to: email,
      subject: "Welcome to Sthavishtah Yoga - Your Account Details",
      text: `
        Namaste ${name},

        Welcome to Sthavishtah Yoga! Your account has been created successfully.

        Your login details:
        User ID: ${userId}
        Password: ${password || "Please use the forgot password feature to reset it."}

        Please keep this information secure.

        With gratitude and light,
        The Sthavishtah Yoga Team
      `,
      html: htmlContent,
    })

    return result
  } catch (error) {
    console.error("[v0] Error sending password email:", error)
    return { success: false, error: String(error) }
  }
}

// Legacy function kept for backward compatibility
export async function getEmailConfig() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from("email_config").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching email config:", error)
      return {
        host: process.env.EMAIL_HOST || "smtp.resend.com",
        port: process.env.EMAIL_PORT || "587",
        secure: process.env.EMAIL_SECURE === "true" || false,
        email_user: process.env.EMAIL_USER || "",
        password: process.env.EMAIL_PASSWORD || "",
      }
    }

    return {
      host: data.host || "smtp.gmail.com",
      port: data.port || "587",
      secure: data.secure || false,
      email_user: data.email_user,
      password: data.password,
    }
  } catch (error) {
    console.error("Error in getEmailConfig:", error)
    return {
      host: process.env.EMAIL_HOST || "smtp.resend.com",
      port: process.env.EMAIL_PORT || "587",
      secure: process.env.EMAIL_SECURE === "true" || false,
      email_user: process.env.EMAIL_USER || "",
      password: process.env.EMAIL_PASSWORD || "",
    }
  }
}
