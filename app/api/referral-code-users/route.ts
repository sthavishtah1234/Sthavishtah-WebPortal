import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Code parameter is required" }, { status: 400 })
    }

    const supabase = getSupabaseBrowserClient()

    // Fetch users who have this referral code
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("referral_code", code)
      .order("created_at", { ascending: false })

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [], count: 0 })
    }

    // Fetch subscription details for these users
    const userIds = users.map((u) => u.id)
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select(
        `
        user_id,
        is_active,
        start_date,
        end_date,
        subscription:subscriptions(name, price)
      `,
      )
      .in("user_id", userIds)

    if (subsError) throw subsError

    // Combine users with their subscriptions
    const usersWithSubscriptions = users.map((user) => ({
      ...user,
      subscriptions: subscriptions?.filter((sub) => sub.user_id === user.id) || [],
    }))

    return NextResponse.json({
      users: usersWithSubscriptions,
      count: users.length,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching referral code users:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 })
  }
}
