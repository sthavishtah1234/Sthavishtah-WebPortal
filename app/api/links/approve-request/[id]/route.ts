import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id
    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json({ success: false, error: "Link ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Update the request status to approved
    const { error } = await supabase
      .from("whatsapp_access_requests")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
        approved_link_id: linkId,
      })
      .eq("id", requestId)

    if (error) {
      console.error("Error approving access request:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Get the request details to send notification
    const { data: requestData, error: requestError } = await supabase
      .from("whatsapp_access_requests")
      .select(`
        user_id,
        subscription_id,
        user:users(email, name),
        subscription:subscriptions(name)
      `)
      .eq("id", requestId)
      .single()

    if (!requestError && requestData) {
      // Send email notification to user (implementation depends on your email service)
      // This is just a placeholder - you would implement actual email sending here
      console.log(`Sending email to ${requestData.user.email} about approved WhatsApp access`)
    }

    return NextResponse.json({
      success: true,
      message: "Access request approved successfully",
    })
  } catch (error) {
    console.error("Error in approve-request route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
