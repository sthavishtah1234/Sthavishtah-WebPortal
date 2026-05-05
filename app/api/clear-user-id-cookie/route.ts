import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔥 CLEARING userId COOKIE...")

  const response = NextResponse.json({
    success: true,
    message: "userId cookie cleared",
    timestamp: new Date().toISOString(),
  })

  // Clear the userId cookie with multiple approaches
  response.cookies.set({
    name: "userId",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  // Also try with different paths
  const paths = ["/", "/user", "/admin", "/api", "/l"]
  paths.forEach((path) => {
    response.cookies.set({
      name: "userId",
      value: "",
      expires: new Date(0),
      path: path,
    })
  })

  // Also try with domain
  response.cookies.set({
    name: "userId",
    value: "",
    expires: new Date(0),
    path: "/",
    domain: "sthavishtah.com",
  })

  console.log("✅ userId cookie clearing complete")
  return response
}
