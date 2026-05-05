import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// GET - List all active events (with dynamically computed available_seats)
export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: true, events: [] })
    }

    const supabase = getSupabaseServerClient()

    let events: any[] = []
    try {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching events:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      events = data || []
    } catch (fetchErr) {
      console.error("[v0] Supabase fetch exception:", fetchErr)
      return NextResponse.json({ success: true, events: [] })
    }

    if (events.length === 0) {
      return NextResponse.json({ success: true, events: [] })
    }

    // Dynamically compute available_seats by counting actual paid bookings
    try {
      const eventIds = events.map((e: any) => e.id)
      const { data: bookings, error: bookingsError } = await supabase
        .from("ticket_bookings")
        .select("ticket_id")
        .in("ticket_id", eventIds)
        .eq("is_paid", true)

      if (!bookingsError && bookings) {
        // Count paid bookings per event
        const paidCountMap: Record<string, number> = {}
        for (const b of bookings) {
          paidCountMap[b.ticket_id] = (paidCountMap[b.ticket_id] || 0) + 1
        }

        // Override available_seats with dynamic calculation
        events = events.map((event: any) => ({
          ...event,
          available_seats: Math.max(0, event.total_seats - (paidCountMap[event.id] || 0)),
        }))
      }
    } catch (countErr) {
      // Fallback: return events with stored available_seats
      console.error("[v0] Error counting bookings, using stored seats:", countErr)
    }

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST - Create new event (Admin only)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-password")
    if (authHeader !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event_name, event_date, event_time, venue, description, ticket_price, total_seats, image_url } = body

    if (!event_name || !event_date || !event_time || !venue) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: event, error } = await supabase
      .from("event_tickets")
      .insert({
        event_name,
        event_date,
        event_time,
        venue,
        description: description || "",
        ticket_price: ticket_price || 0,
        total_seats: total_seats || 100,
        available_seats: total_seats || 100,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating event:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 })
  }
}
