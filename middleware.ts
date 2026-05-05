import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only run middleware on client-side navigation
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // For server-side rendering, just continue
    if (!request.headers.get("user-agent")) {
      return NextResponse.next()
    }

    // Let the client-side authentication handle the rest
    return NextResponse.next()
  }

  // Student routes — let client-side auth handle
  if (request.nextUrl.pathname.startsWith("/student") && !request.nextUrl.pathname.startsWith("/student/login") && !request.nextUrl.pathname.startsWith("/student/register")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
