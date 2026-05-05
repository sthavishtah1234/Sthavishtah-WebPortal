import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()

    // Get user ID from query params or cookies
    const url = new URL(request.url)
    const userIdParam = url.searchParams.get("userId")
    const userIdCookie = request.cookies.get("userId")?.value

    const userId = userIdParam || userIdCookie

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 })
    }

    console.log("🔍 Debugging subscriptions for user:", userId)
    const userIdNum = Number.parseInt(userId)

    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userIdNum).single()

    // Get user subscriptions from user_subscriptions table
    const { data: userSubs, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userIdNum)

    // Get subscription details
    const { data: allSubscriptions } = await supabase.from("subscriptions").select("*")

    // Get any generated links for testing
    const { data: testLinks } = await supabase.from("generated_links").select("*").eq("is_active", true).limit(5)

    console.log("👤 User data:", user)
    console.log("📊 User subscriptions:", userSubs)

    return NextResponse.json({
      success: true,
      userId,
      userIdNum,
      user,
      userError,
      userSubscriptions: userSubs,
      subscriptionError: subError,
      allAvailableSubscriptions: allSubscriptions,
      sampleLinks: testLinks,
      debug: {
        userIdType: typeof userId,
        userIdParsed: userIdNum,
        timestamp: new Date().toISOString(),
        cookieUserId: userIdCookie,
        paramUserId: userIdParam,
      },
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
