import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const linkId = params.id

    // Validate link ID
    if (!linkId) {
      return NextResponse.json({ success: false, error: "Missing link ID" }, { status: 400 })
    }

    // Delete the link
    const { error } = await supabase.from("generated_links").delete().eq("id", linkId)

    if (error) {
      console.error("Error deleting link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Link deleted successfully" })
  } catch (error) {
    console.error("Unexpected error in links API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
