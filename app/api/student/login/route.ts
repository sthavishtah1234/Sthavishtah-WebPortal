import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Clean phone number
    const cleanPhone = phone.replace(/\s+|-|\(|\)|\+|\./g, "")

    // Try different phone formats
    const phoneVariants = [
      phone,
      cleanPhone,
      `+91${cleanPhone}`,
      `91${cleanPhone}`,
      cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone,
    ]

    let user = null

    for (const phoneVariant of phoneVariants) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, user_id, name, email, phone_number, phone, whatsapp_number, password, role")
        .eq("role", "student")
        .or(`phone_number.eq.${phoneVariant},phone.eq.${phoneVariant},whatsapp_number.eq.${phoneVariant}`)
        .limit(1)

      if (error) {
        console.error("Student login DB error:", error)
        return NextResponse.json({ error: "Database query failed." }, { status: 500 })
      }

      if (userData && userData.length > 0) {
        user = userData[0]
        break
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid phone number or password. Make sure you registered as a student." }, { status: 401 })
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
      } catch {
        isValidPassword = password === user.password
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      message: "Student login successful",
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || user.phone || user.whatsapp_number,
        role: "student",
      },
    })

    response.cookies.set({
      name: "studentId",
      value: user.id.toString(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Student login error:", error)
    return NextResponse.json({ error: "Server error during login." }, { status: 500 })
  }
}
