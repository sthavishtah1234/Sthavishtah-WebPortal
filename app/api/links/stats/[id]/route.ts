import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const linkId = params.id
    const supabase = createClient()

    // Fetch the link
    const { data: link, error: linkError } = await supabase
      .from("generated_links")
      .select("*")
      .eq("id", linkId)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 })
    }

    // Fetch usage statistics
    const { data: usages, error: usageError } = await supabase
      .from("link_usages")
      .select(`
        *,
        user:users(id, name, email, phone)
      `)
      .eq("link_id", linkId)
      .order("used_at", { ascending: false })

    if (usageError) {
      console.error("Error fetching link usages:", usageError)
      return NextResponse.json({ success: false, error: usageError.message }, { status: 500 })
    }

    // Get usage count by day for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyStats, error: statsError } = await supabase
      .from("link_usages")
      .select("used_at")
      .eq("link_id", linkId)
      .gte("used_at", thirtyDaysAgo.toISOString())

    if (statsError) {
      console.error("Error fetching daily stats:", statsError)
      return NextResponse.json({ success: false, error: statsError.message }, { status: 500 })
    }

    // Process daily stats
    const dailyCounts: Record<string, number> = {}
    dailyStats?.forEach((stat) => {
      const date = new Date(stat.used_at).toISOString().split("T")[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })

    // Convert to array for easier consumption by charts
    const dailyUsage = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }))

    return NextResponse.json({
      success: true,
      link,
      usages,
      usage_count: usages?.length || 0,
      daily_usage: dailyUsage,
    })
  } catch (error) {
    console.error("Error in links/stats route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
