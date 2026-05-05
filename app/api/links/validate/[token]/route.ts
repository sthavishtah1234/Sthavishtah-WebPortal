import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const { token } = params

    console.log("🔍 STARTING VALIDATION for token:", token)
    console.log("🍪 ALL COOKIES:", request.cookies.getAll())

    // Get the link first
    const { data: link, error: linkError } = await supabase
      .from("generated_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (linkError || !link) {
      console.error("❌ Link not found:", linkError)
      return NextResponse.json(
        {
          success: false,
          error: "Link not found or inactive",
        },
        { status: 404 },
      )
    }

    console.log("✅ Link found:", link.title)

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.log("❌ Link expired")
      return NextResponse.json(
        {
          success: false,
          error: "Link has expired",
        },
        { status: 403 },
      )
    }

    // 🚨 CRITICAL: STRICT LOGIN CHECK
    console.log("🔐 CHECKING LOGIN STATUS...")

    // Try to find user ID in cookies
    let userId = null
    const cookieNames = ["userId", "user_id", "userToken", "authToken", "sessionId"]

    // Check all possible cookie names
    for (const cookieName of cookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue && cookieValue !== "undefined" && cookieValue !== "null") {
        console.log(`✅ Found cookie ${cookieName}:`, cookieValue)
        userId = cookieValue
        break
      }
    }

    // 🚨 FORCE LOGIN REQUIREMENT - NO EXCEPTIONS
    if (!userId) {
      console.log("❌ NO USER ID FOUND - FORCING LOGIN REQUIREMENT")

      return NextResponse.json(
        {
          success: false,
          error: "Login required to access this content",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
          linkInfo: {
            title: link.title,
            description: link.description,
            link_type: link.link_type,
          },
          debugInfo: {
            foundCookies: request.cookies.getAll().map((c) => c.name),
            checkedCookieNames: cookieNames,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 },
      )
    }

    // Validate user ID format
    const userIdNum = Number.parseInt(userId)
    if (isNaN(userIdNum)) {
      console.log("❌ Invalid user ID format:", userId)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user session",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
        },
        { status: 401 },
      )
    }

    // Verify user exists in database
    console.log("🔍 Verifying user exists in database:", userIdNum)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userIdNum)
      .single()

    if (userError || !user) {
      console.log("❌ User not found in database:", userError)
      return NextResponse.json(
        {
          success: false,
          error: "User session invalid - please login again",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
        },
        { status: 401 },
      )
    }

    console.log("✅ User verified:", user.name)

    // Now check authorization
    let isAuthorized = false

    switch (link.target_type) {
      case "all":
        isAuthorized = true
        console.log("✅ All users allowed")
        break

      case "user":
      case "users":
        if (link.target_ids) {
          let allowedUserIds = []
          if (Array.isArray(link.target_ids)) {
            allowedUserIds = link.target_ids.map((id) => Number(id))
          } else {
            try {
              allowedUserIds = JSON.parse(link.target_ids).map((id) => Number(id))
            } catch {
              allowedUserIds = String(link.target_ids)
                .split(",")
                .map((id) => Number(id.trim()))
            }
          }
          isAuthorized = allowedUserIds.includes(userIdNum)
          console.log("🔍 User authorization:", { allowedUserIds, userIdNum, isAuthorized })
        }
        break

      case "subscription":
        if (link.target_ids) {
          let allowedSubIds = []
          if (Array.isArray(link.target_ids)) {
            allowedSubIds = link.target_ids.map((id) => Number(id))
          } else {
            try {
              allowedSubIds = JSON.parse(link.target_ids).map((id) => Number(id))
            } catch {
              allowedSubIds = String(link.target_ids)
                .split(",")
                .map((id) => Number(id.trim()))
            }
          }

          const { data: userSubs } = await supabase
            .from("user_subscriptions")
            .select("subscription_id")
            .eq("user_id", userIdNum)

          if (userSubs && userSubs.length > 0) {
            const userSubIds = userSubs.map((sub) => sub.subscription_id)
            isAuthorized = allowedSubIds.some((subId) => userSubIds.includes(subId))
            console.log("🔍 Subscription authorization:", { allowedSubIds, userSubIds, isAuthorized })
          }
        }
        break

      default:
        console.log("❌ Unknown target_type:", link.target_type)
        isAuthorized = false
    }

    if (!isAuthorized) {
      console.log("❌ User not authorized for this link")
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to access this content. Please check your subscription status.",
        },
        { status: 403 },
      )
    }

    // For WhatsApp links, check if already used
    if (link.link_type === "whatsapp") {
      console.log("🔍 Checking if WhatsApp link already used by this user...")

      const { data: usages, error: usageError } = await supabase
        .from("link_usages")
        .select("*")
        .eq("link_id", link.id)
        .eq("user_id", userIdNum)

      if (!usageError && usages && usages.length > 0) {
        console.log("❌ WhatsApp link already used by this user:", usages.length, "times")
        return NextResponse.json(
          {
            success: false,
            error: "You have already used this WhatsApp link. Please contact admin for additional access.",
            alreadyUsed: true,
          },
          { status: 403 },
        )
      }

      console.log("✅ WhatsApp link not used by this user yet")
    }

    console.log("✅ User authorized - allowing access")
    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        description: link.description,
        target_url: link.target_url,
        link_type: link.link_type,
      },
      userInfo: {
        id: user.id,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("❌ Validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        requiresLogin: true,
        loginUrl: `/user/login?redirect=/l/${params.token}`,
      },
      { status: 500 },
    )
  }
}
