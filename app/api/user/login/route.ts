import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()
    console.log("🔐 Login attempt for phone:", phone)

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 })
    }

    let supabase
    try {
      console.log("[v0] Using main Supabase database for login")
      supabase = getSupabaseServerClient()
    } catch (supabaseError) {
      console.error("❌ Supabase client creation failed:", supabaseError)
      return NextResponse.json(
        {
          error: "Database connection error. Please contact support.",
          details: supabaseError instanceof Error ? supabaseError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\s+|-|$$|$$|\+|\./g, "")
    console.log("📱 Cleaned phone:", cleanPhone)

    // Try different phone formats
    const phoneVariants = [
      phone,
      cleanPhone,
      `+91${cleanPhone}`,
      `91${cleanPhone}`,
      cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone,
    ]

    console.log("🔍 Trying phone variants:", phoneVariants)

    let user = null

    for (const phoneVariant of phoneVariants) {
      console.log("[v0] Querying users table with phone variant:", phoneVariant)
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, user_id, name, email, phone_number, phone, whatsapp_number, password")
        .or(`phone_number.eq.${phoneVariant},phone.eq.${phoneVariant},whatsapp_number.eq.${phoneVariant}`)
        .limit(1)

      if (error) {
        console.error("[v0] Database query error:", error)
        return NextResponse.json(
          {
            error: "Database query failed. Please try again.",
            details: error.message,
          },
          { status: 500 },
        )
      }

      if (userData && userData.length > 0) {
        user = userData[0]
        console.log("✅ User found with phone variant:", phoneVariant)
        break
      }
    }

    if (!user) {
      console.log("❌ No user found with provided phone number")
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    // Verify password
    let isValidPassword = false

    if (user.password) {
      try {
        if (user.password.startsWith("$2")) {
          isValidPassword = await bcrypt.compare(password, user.password)
        } else {
          isValidPassword = password === user.password
        }
      } catch (passwordError) {
        console.error("❌ Password comparison error:", passwordError)
        isValidPassword = password === user.password
      }
    }

    if (!isValidPassword) {
      console.log("❌ Password validation failed")
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    console.log("✅ Login successful - setting userId cookie")

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || user.phone || user.whatsapp_number,
      },
    })

    // Set userId cookie ONLY after successful login
    response.cookies.set({
      name: "userId",
      value: user.id.toString(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    // Log successful login
    try {
      await supabase.from("auth_logs").insert({
        event_type: "user_login_success",
        user_id: user.id,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
        success: true,
      })
    } catch (logErr) {
      console.warn("⚠️ Auth logging error:", logErr)
    }

    return response
  } catch (error) {
    console.error("❌ Login error:", error)
    console.error("[v0] Full error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: "Server error during login. Please try again or contact support.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
