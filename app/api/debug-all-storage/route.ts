import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUGGING ALL STORAGE...")

    // Get ALL cookies from the request
    const allCookies = request.cookies.getAll()
    console.log("🍪 ALL COOKIES FROM REQUEST:", allCookies)

    // Get headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log("📋 ALL HEADERS:", headers)

    // Check specific auth-related cookies
    const authCookies = {
      userId: request.cookies.get("userId")?.value,
      user_id: request.cookies.get("user_id")?.value,
      userToken: request.cookies.get("userToken")?.value,
      authToken: request.cookies.get("authToken")?.value,
      sessionId: request.cookies.get("sessionId")?.value,
      visitor: request.cookies.get("visitor")?.value,
    }

    return NextResponse.json({
      success: true,
      debug: {
        allCookies,
        authCookies,
        headers: {
          cookie: headers.cookie,
          authorization: headers.authorization,
          userAgent: headers["user-agent"],
        },
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
