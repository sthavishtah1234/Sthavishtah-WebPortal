import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Checking all cookies and headers")

    // Get all cookies
    const allCookies = request.cookies.getAll()
    console.log("🍪 All cookies:", allCookies)

    // Check specific cookie names that might be used
    const possibleUserCookies = [
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
    ]

    const foundCookies = {}
    possibleUserCookies.forEach((cookieName) => {
      const value = request.cookies.get(cookieName)?.value
      if (value) {
        foundCookies[cookieName] = value
      }
    })

    // Check headers for authorization
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    const debugInfo = {
      allCookies: allCookies.map((cookie) => ({ name: cookie.name, value: cookie.value })),
      foundUserCookies: foundCookies,
      authorizationHeader: authHeader,
      bearerToken: bearerToken,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    }

    console.log("🔐 Debug info:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
