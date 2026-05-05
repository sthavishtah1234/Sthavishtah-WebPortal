import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DETAILED COOKIE DEBUG")

    // Get all cookies
    const allCookies = request.cookies.getAll()
    console.log("🍪 All cookies received:", allCookies)

    // Check specific cookie names
    const cookieNames = [
      "userId",
      "user_id",
      "userToken",
      "user_token",
      "authToken",
      "auth_token",
      "sessionId",
      "session_id",
      "loginToken",
      "login_token",
      "userSession",
      "user_session",
    ]

    const foundCookies = {}
    for (const name of cookieNames) {
      const value = request.cookies.get(name)?.value
      if (value) {
        foundCookies[name] = value
      }
    }

    // Get headers
    const userAgent = request.headers.get("user-agent")
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")

    return NextResponse.json({
      success: true,
      debug: {
        allCookies: allCookies,
        foundAuthCookies: foundCookies,
        totalCookies: allCookies.length,
        userAgent: userAgent,
        origin: origin,
        referer: referer,
        timestamp: new Date().toISOString(),
        url: request.url,
        method: request.method,
      },
    })
  } catch (error) {
    console.error("Cookie debug error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        error: "Failed to read cookies",
      },
    })
  }
}
