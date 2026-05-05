import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 FORCE CLEARING ALL COOKIES...")

    // Get current cookies to see what we're dealing with
    const currentCookies = request.cookies.getAll()
    console.log("🍪 Current cookies before clearing:", currentCookies)

    const response = NextResponse.json({
      success: true,
      message: "Force clearing all cookies",
      clearedCookies: currentCookies.map((c) => c.name),
    })

    // Clear ALL cookies that exist
    currentCookies.forEach((cookie) => {
      console.log(`🗑️ Clearing cookie: ${cookie.name}`)

      // Clear for root path
      response.cookies.set({
        name: cookie.name,
        value: "",
        expires: new Date(0),
        path: "/",
      })

      // Clear for all possible paths
      const paths = ["/", "/user", "/admin", "/api"]
      paths.forEach((path) => {
        response.cookies.set({
          name: cookie.name,
          value: "",
          expires: new Date(0),
          path: path,
        })
      })

      // Clear for domain and subdomains
      const domains = ["", ".sthavishtah.com", "sthavishtah.com"]
      domains.forEach((domain) => {
        if (domain) {
          response.cookies.set({
            name: cookie.name,
            value: "",
            expires: new Date(0),
            path: "/",
            domain: domain,
          })
        }
      })
    })

    // Also clear common auth cookie names even if not present
    const commonAuthCookies = [
      "userId",
      "user_id",
      "userToken",
      "user_token",
      "authToken",
      "auth_token",
      "sessionId",
      "session_id",
      "visitor",
      "loginToken",
      "accessToken",
    ]

    commonAuthCookies.forEach((cookieName) => {
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      })
    })

    console.log("✅ Force clear complete")
    return response
  } catch (error) {
    console.error("❌ Force clear error:", error)
    return NextResponse.json({ success: false, error: "Force clear failed" }, { status: 500 })
  }
}
