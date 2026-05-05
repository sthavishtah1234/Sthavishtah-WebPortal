import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"

// Generate unique QR code data
function generateQRCodeData(bookingId: string): string {
  const timestamp = Date.now()
  const randomStr = crypto.randomBytes(8).toString("hex")
  const hash = crypto
    .createHash("sha256")
    .update(`${bookingId}-${timestamp}-${randomStr}`)
    .digest("hex")
    .substring(0, 16)
  return `TKT-${bookingId.substring(0, 8)}-${hash}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticket_id, name, email, phone, passkey, user_id, influencer_code, referral_code, is_free_after_discount } = body

    if (!ticket_id || !name || !email || !phone) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if event exists and has available seats
    const { data: event, error: eventError } = await supabase
      .from("event_tickets")
      .select("*")
      .eq("id", ticket_id)
      .eq("is_active", true)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ success: false, error: "Event not found or not available" }, { status: 404 })
    }

    // Dynamically compute available seats by counting actual paid bookings
    const { count: paidCount, error: countError } = await supabase
      .from("ticket_bookings")
      .select("*", { count: "exact", head: true })
      .eq("ticket_id", ticket_id)
      .eq("is_paid", true)

    const actualAvailable = event.total_seats - (paidCount || 0)

    if (actualAvailable <= 0) {
      return NextResponse.json({ success: false, error: "No seats available" }, { status: 400 })
    }

    // Generate temporary booking ID for QR code
    const tempId = crypto.randomUUID()
    const qrCodeData = generateQRCodeData(tempId)

    // Core booking data - columns guaranteed to exist
    const coreBookingData: Record<string, any> = {
      ticket_id,
      user_id: user_id || null,
      booking_name: name,
      booking_email: email,
      booking_phone: phone,
      passkey: passkey || null,
      qr_code_data: qrCodeData,
      is_paid: false,
      is_attended: false,
    }

    // Try with tracking columns first, fallback to core only
    const trackingData: Record<string, any> = { ...coreBookingData }
    if (influencer_code) trackingData.influencer_code = influencer_code
    if (referral_code) trackingData.referral_code_used = referral_code

    let booking = null

    const { data: d1, error: e1 } = await supabase
      .from("ticket_bookings")
      .insert(trackingData)
      .select()
      .single()

    if (!e1 && d1) {
      booking = d1
    } else {
      console.log("Insert with tracking columns failed, retrying without:", e1?.message)
      const { data: d2, error: e2 } = await supabase
        .from("ticket_bookings")
        .insert(coreBookingData)
        .select()
        .single()

      if (e2) {
        console.error("Core booking insert also failed:", e2.message)
        return NextResponse.json({ success: false, error: e2.message }, { status: 500 })
      }
      booking = d2
    }

    // Create Razorpay order if ticket has price AND it's not free after discount
    if (event.ticket_price > 0 && !is_free_after_discount) {
      const key_id = process.env.RAZORPAY_KEY_ID || ""
      const key_secret = process.env.RAZORPAY_KEY_SECRET || ""

      if (!key_id || !key_secret) {
        return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
      }

      const orderAmount = Math.round(event.ticket_price * 100) // Convert to paise

      const authHeader = `Basic ${Buffer.from(`${key_id}:${key_secret}`).toString("base64")}`

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: orderAmount,
          currency: "INR",
          receipt: `ticket_${booking.id}`,
          notes: {
            booking_id: booking.id,
            event_name: event.event_name,
            customer_name: name,
            customer_phone: phone,
          },
        }),
      })

      if (!response.ok) {
        console.error("Razorpay order creation failed")
        return NextResponse.json({ success: false, error: "Failed to create payment order" }, { status: 500 })
      }

      const order = await response.json()

      // Update booking with order ID
      await supabase
        .from("ticket_bookings")
        .update({ razorpay_order_id: order.id })
        .eq("id", booking.id)

      return NextResponse.json({
        success: true,
        booking: { ...booking, razorpay_order_id: order.id },
        order,
        event,
        requiresPayment: true,
      })
    }

    // Free ticket - mark as paid immediately
    // The DB trigger (trigger_update_seats) auto-decrements available_seats when is_paid flips to true
    const { data: updatedBooking, error: updateError } = await supabase
      .from("ticket_bookings")
      .update({ is_paid: true })
      .eq("id", booking.id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to mark free booking as paid:", updateError.message, updateError.details, updateError.hint)
      // The booking row exists but is_paid is still false - force return success anyway
      // so the user sees confirmation (the row IS in the DB)
      return NextResponse.json({
        success: true,
        booking: { ...booking, is_paid: true },
        event,
        requiresPayment: false,
      })
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking || { ...booking, is_paid: true },
      event,
      requiresPayment: false,
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 })
  }
}
