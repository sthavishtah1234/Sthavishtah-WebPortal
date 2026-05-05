import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const instructorId = Number.parseInt(params.id)

    if (isNaN(instructorId)) {
      return NextResponse.json({ success: false, error: "Invalid instructor ID" }, { status: 400 })
    }

    // Get all subscriptions and check which ones the instructor has access to
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("active", true)

    if (subscriptionsError) {
      console.error("Error fetching subscriptions:", subscriptionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    // Get instructor's current access
    const { data: access, error: accessError } = await supabase
      .from("instructor_subscription_access")
      .select("subscription_id")
      .eq("instructor_id", instructorId)

    if (accessError) {
      console.error("Error fetching access:", accessError)
      return NextResponse.json({ success: false, error: "Failed to fetch subscription access" }, { status: 500 })
    }

    const accessibleIds = access?.map((a) => a.subscription_id) || []

    // Create access map for all subscriptions
    const accessData =
      subscriptions?.map((sub) => ({
        subscription_id: sub.id,
        has_access: accessibleIds.includes(sub.id),
      })) || []

    return NextResponse.json({
      success: true,
      data: accessData,
    })
  } catch (error) {
    console.error("Error in subscription-access:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
