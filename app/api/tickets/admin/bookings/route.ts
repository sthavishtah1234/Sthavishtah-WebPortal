import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const authHeader = request.headers.get("x-admin-password")
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id")

    const supabase = getSupabaseServerClient()

    let query = supabase
      .from("ticket_bookings")
      .select(`
        *,
        event_tickets (*)
      `)
      .order("booking_date", { ascending: false })

    if (eventId) {
      query = query.eq("ticket_id", eventId)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calculate stats
    const totalBookings = bookings?.length || 0
    const paidBookings = bookings?.filter((b) => b.is_paid).length || 0
    const attendedBookings = bookings?.filter((b) => b.is_attended).length || 0
    const totalRevenue = bookings
      ?.filter((b) => b.is_paid)
      .reduce((sum, b) => sum + (b.event_tickets?.ticket_price || 0), 0) || 0

    return NextResponse.json({
      success: true,
      bookings,
      stats: {
        totalBookings,
        paidBookings,
        attendedBookings,
        totalRevenue,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 })
  }
}

// DELETE - Delete a booking (seats are recalculated dynamically so no need to manually update available_seats)
export async function DELETE(request: Request) {
  const authHeader = request.headers.get("x-admin-password")
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("id")

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from("ticket_bookings")
      .delete()
      .eq("id", bookingId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Booking deleted" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete booking" }, { status: 500 })
  }
}
