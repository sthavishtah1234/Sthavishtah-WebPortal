import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("🔐 Logout request received")

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // 🚨 COMPLETELY REMOVE userId COOKIE
    response.cookies.set({
      name: "userId",
      value: "",
      expires: new Date(0),
      path: "/",
      maxAge: 0,
    })

    // Also clear pvisitor if it's related to auth
    response.cookies.set({
      name: "pvisitor",
      value: "",
      expires: new Date(0),
      path: "/",
      maxAge: 0,
    })

    console.log("✅ Logout successful - userId cookie removed")
    return response
  } catch (error) {
    console.error("❌ Error logging out:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error during logout",
      },
      { status: 500 },
    )
  }
}
