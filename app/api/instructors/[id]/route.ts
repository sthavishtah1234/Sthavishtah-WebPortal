import { getSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

// Get a specific instructor
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const id = params.id

    const { data, error } = await supabase.from("instructors").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching instructor:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Instructor not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching instructor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Update a specific instructor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const id = params.id
    const body = await request.json()

    // Create an update object with all fields from the request body
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("instructors").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating instructor:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: "Instructor not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error updating instructor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Delete a specific instructor
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const id = params.id

    const { error } = await supabase.from("instructors").delete().eq("id", id)

    if (error) {
      console.error("Error deleting instructor:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting instructor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
