import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionId } = await request.json()

    if (!userId || !subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and Subscription ID are required",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Check if there's already a pending request
    const { data: existingRequest, error: checkError } = await supabase
      .from("whatsapp_access_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("subscription_id", subscriptionId)
      .eq("status", "pending")
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing request:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: "Access request already exists",
        existing: true,
      })
    }

    // Create a new access request
    const { error } = await supabase.from("whatsapp_access_requests").insert({
      user_id: userId,
      subscription_id: subscriptionId,
      status: "pending",
    })

    if (error) {
      console.error("Error creating access request:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Access request submitted successfully",
    })
  } catch (error) {
    console.error("Error in request-access route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
