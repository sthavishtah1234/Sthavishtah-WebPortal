import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const linkId = params.id
    const supabase = createClient()

    // Update the link to set is_active to false
    const { data, error } = await supabase
      .from("generated_links")
      .update({ is_active: false })
      .eq("id", linkId)
      .select()
      .single()

    if (error) {
      console.error("Error deactivating link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Link deactivated successfully",
      link: data,
    })
  } catch (error) {
    console.error("Error in links/deactivate route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
