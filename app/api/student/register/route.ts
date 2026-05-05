import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

function generateStudentId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "STU-"
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, collegeName, usnNumber } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Name, email, phone, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", phone)
      .single()

    if (existingPhone) {
      return NextResponse.json({ error: "This phone number is already registered." }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = generateStudentId()

    const userData: Record<string, any> = {
      user_id: userId,
      name,
      email,
      phone_number: phone,
      whatsapp_number: phone,
      password: hashedPassword,
      role: "student",
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("users").insert([userData]).select()

    if (error) {
      console.error("Student registration error:", error)
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
    }

    // Create student profile if we have extra fields
    if (data && data[0] && (collegeName || usnNumber)) {
      try {
        await supabase.from("student_profiles").insert({
          user_id: data[0].id,
          college_name: collegeName || null,
          usn_number: usnNumber || null,
        })
      } catch (profileError) {
        console.warn("Student profile creation failed (table may not exist yet):", profileError)
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Student registration successful",
      user: {
        id: data[0].id,
        user_id: userId,
        name,
        email,
        phone_number: phone,
        role: "student",
      },
    })

    response.cookies.set({
      name: "studentId",
      value: data[0].id.toString(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Student registration error:", error)
    return NextResponse.json({ error: "Server error during registration." }, { status: 500 })
  }
}
