import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Checking login status")

    // Get all cookies
    const allCookies = request.cookies.getAll()
    console.log("🍪 All cookies:", allCookies)

    // Check for user login cookies
    const userId = request.cookies.get("userId")?.value
    const userToken = request.cookies.get("userToken")?.value
    const user_id = request.cookies.get("user_id")?.value

    const loginStatus = {
      isLoggedIn: !!userId || !!userToken || !!user_id,
      userId: userId || null,
      userToken: userToken || null,
      user_id: user_id || null,
      allCookies: allCookies.map((cookie) => ({ name: cookie.name, value: cookie.value })),
      timestamp: new Date().toISOString(),
    }

    console.log("🔐 Login status:", loginStatus)

    return NextResponse.json(loginStatus)
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
