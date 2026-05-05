import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get all bookings by phone number - no passkey required
    const { data: bookings, error } = await supabase
      .from("ticket_bookings")
      .select(`
        *,
        event_tickets (*)
      `)
      .eq("booking_phone", phone)
      .eq("is_paid", true)
      .order("booking_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching bookings:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: false, error: "No bookings found for this phone number" }, { status: 404 })
    }

    return NextResponse.json({ success: true, bookings })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 })
  }
}
