import { getSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

// Generate a unique instructor ID
function generateInstructorId() {
  const prefix = "INST"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}${timestamp}${random}`
}

// Get all instructors
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.from("instructors").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching instructors:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching instructors:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Update the instructor model to be more flexible with potential new fields
// by using a more generic approach to handle the request body

// Update the POST method to handle any fields in the request body
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const body = await request.json()

    // Generate a unique instructor ID
    const instructor_id = generateInstructorId()

    // Create a data object with all fields from the request body
    const instructorData = {
      instructor_id,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert the new instructor with all provided fields
    const { data, error } = await supabase.from("instructors").insert([instructorData]).select()

    if (error) {
      console.error("Error creating instructor:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error creating instructor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
