import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if the table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("whatsapp_access_requests")
      .select("id")
      .limit(1)

    // If table doesn't exist, return empty array
    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      return NextResponse.json({
        success: true,
        requests: [],
        message: "WhatsApp access requests table not found. No requests available.",
      })
    }

    // Get all pending access requests
    const { data: requests, error: requestsError } = await supabase
      .from("whatsapp_access_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (requestsError) {
      console.error("Error fetching access requests:", requestsError)
      return NextResponse.json({ success: false, error: requestsError.message }, { status: 500 })
    }

    // If no requests, return empty array
    if (!requests || requests.length === 0) {
      return NextResponse.json({
        success: true,
        requests: [],
      })
    }

    // Fetch user and subscription details separately
    const userIds = [...new Set(requests.map((r) => r.user_id))]
    const subscriptionIds = [...new Set(requests.map((r) => r.subscription_id))]

    const [usersResult, subscriptionsResult] = await Promise.all([
      supabase.from("users").select("id, name, email").in("id", userIds),
      supabase.from("subscriptions").select("id, name").in("id", subscriptionIds),
    ])

    // Create lookup maps
    const usersMap = new Map(usersResult.data?.map((u) => [u.id, u]) || [])
    const subscriptionsMap = new Map(subscriptionsResult.data?.map((s) => [s.id, s]) || [])

    // Combine the data
    const enrichedRequests = requests.map((request) => ({
      ...request,
      user: usersMap.get(request.user_id) || null,
      subscription: subscriptionsMap.get(request.subscription_id) || null,
    }))

    return NextResponse.json({
      success: true,
      requests: enrichedRequests,
    })
  } catch (error) {
    console.error("Error in access-requests route:", error)
    return NextResponse.json(
      {
        success: true,
        requests: [],
        error: "Table not found - no access requests available",
      },
      { status: 200 },
    )
  }
}
