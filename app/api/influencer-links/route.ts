import { getSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Function to create Supabase client
async function createClient() {
  return getSupabaseServerClient();
}

// GET - Fetch all influencer links with stats
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all influencer links
    const { data: links, error } = await supabase
      .from("influencer_links")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get booking counts for each influencer
    const linksWithStats = await Promise.all(
      (links || []).map(async (link) => {
        const { count } = await supabase
          .from("ticket_bookings")
          .select("*", { count: "exact", head: true })
          .eq("influencer_code", link.code)

        return {
          ...link,
          booking_count: count || 0,
        }
      })
    )

    return NextResponse.json({ success: true, links: linksWithStats })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new influencer link
export async function POST(request: Request) {
  try {
    const { code, influencer_name, notes } = await request.json()

    if (!code || !influencer_name) {
      return NextResponse.json({ success: false, error: "Code and name are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if code already exists
    const { data: existing } = await supabase
      .from("influencer_links")
      .select("code")
      .eq("code", code.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: "Code already exists" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("influencer_links")
      .insert({
        code: code.toLowerCase(),
        influencer_name,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, link: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete influencer link
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("influencer_links")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH - Toggle active status
export async function PATCH(request: Request) {
  try {
    const { id, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("influencer_links")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, link: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
