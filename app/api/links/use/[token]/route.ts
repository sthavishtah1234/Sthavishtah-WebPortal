import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const { token } = params

    console.log("🔗 Using link token:", token)

    // Get the link
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

    // 🚨 CRITICAL: VERIFY USER IS LOGGED IN
    let userId = null
    const cookieNames = ["userId", "user_id", "userToken", "authToken", "sessionId"]

    for (const cookieName of cookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue && cookieValue !== "undefined" && cookieValue !== "null") {
        console.log(`✅ Found cookie ${cookieName}:`, cookieValue)
        userId = cookieValue
        break
      }
    }

    if (!userId) {
      console.log("❌ No user ID found - login required")
      return NextResponse.json(
        {
          success: false,
          error: "Login required to use this link",
          requiresLogin: true,
        },
        { status: 401 },
      )
    }

    const userIdNum = Number.parseInt(userId)
    if (isNaN(userIdNum)) {
      console.log("❌ Invalid user ID format:", userId)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user session",
          requiresLogin: true,
        },
        { status: 401 },
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

    // Record usage
    const { error: usageError } = await supabase.from("link_usages").insert({
      link_id: link.id,
      user_id: userIdNum,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    if (usageError) {
      console.error("❌ Error recording link usage:", usageError)
      // Continue anyway - don't block access due to usage recording failure
    }

    console.log("✅ Link usage recorded, returning target URL:", link.target_url)
    return NextResponse.json({
      success: true,
      target_url: link.target_url,
    })
  } catch (error) {
    console.error("❌ Error using link:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while processing this link",
      },
      { status: 500 },
    )
  }
}
