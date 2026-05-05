import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id
    const supabase = createClient()

    // Update the request status to denied
    const { error } = await supabase
      .from("whatsapp_access_requests")
      .update({
        status: "denied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      console.error("Error denying access request:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Access request denied successfully",
    })
  } catch (error) {
    console.error("Error in deny-request route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
