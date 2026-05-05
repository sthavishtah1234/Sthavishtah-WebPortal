import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-password")
    if (authHeader !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { qr_code_data } = await request.json()

    if (!qr_code_data) {
      return NextResponse.json({ success: false, error: "QR code data required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Find booking by QR code
    const { data: booking, error } = await supabase
      .from("ticket_bookings")
      .select(`
        *,
        event_tickets (*)
      `)
      .eq("qr_code_data", qr_code_data)
      .single()

    if (error || !booking) {
      return NextResponse.json({ success: false, error: "Invalid QR code" }, { status: 404 })
    }

    // Check if ticket is paid
    if (!booking.is_paid) {
      return NextResponse.json({
        success: false,
        error: "Ticket not paid",
        booking,
      }, { status: 400 })
    }

    // Check if already attended
    if (booking.is_attended) {
      return NextResponse.json({
        success: false,
        error: "Already checked in",
        booking,
        attended_at: booking.attended_at,
      }, { status: 400 })
    }

    // Mark as attended
    const { data: updatedBooking, error: updateError } = await supabase
      .from("ticket_bookings")
      .update({
        is_attended: true,
        attended_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select(`
        *,
        event_tickets (*)
      `)
      .single()

    if (updateError) {
      console.error("[v0] Error marking attendance:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify QR" }, { status: 500 })
  }
}
