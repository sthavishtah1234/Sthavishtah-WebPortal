import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get("active") === "true"
    const type = searchParams.get("type")

    const supabase = getSupabaseServerClient()

    let query = supabase.from("generated_links").select(`
        id,
        title,
        description,
        link_type,
        token,
        target_url,
        target_type,
        target_ids,
        expires_at,
        created_at,
        is_active,
        created_by
      `)

    // Apply filters
    if (active) {
      query = query.eq("is_active", true)
    }

    if (type) {
      query = query.eq("link_type", type)
    }

    // Order by created_at
    query = query.order("created_at", { ascending: false })

    const { data: links, error } = await query

    if (error) {
      console.error("Error fetching links:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Get usage counts for each link
    const linksWithUsage = await Promise.all(
      links.map(async (link) => {
        const { count, error: countError } = await supabase
          .from("link_usages")
          .select("id", { count: "exact" })
          .eq("link_id", link.id)

        if (countError) {
          console.error(`Error getting usage count for link ${link.id}:`, countError)
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        return {
          ...link,
          usage_count: count || 0,
          full_url: `${appUrl}/l/${link.token}`,
        }
      }),
    )

    return NextResponse.json({ success: true, links: linksWithUsage })
  } catch (error) {
    console.error("Unexpected error in links API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
