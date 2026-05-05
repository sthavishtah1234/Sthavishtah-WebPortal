import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      event_id,
      attendees,
      influencer_code,
      referral_code,
      discount_applied,
      original_price,
    } = body

    console.log("[v0] verify-payment called with:", {
      razorpay_order_id,
      razorpay_payment_id,
      event_id,
      attendeeCount: attendees?.length,
      influencer_code,
      referral_code,
      discount_applied,
      original_price,
    })

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[v0] Missing payment details")
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    if (!event_id || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      console.error("[v0] Missing event or attendee details")
      return NextResponse.json({ success: false, error: "Missing event or attendee details" }, { status: 400 })
    }

    // Get Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      console.error("[v0] Razorpay keys not configured")
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    // Method 1: Try signature verification first
    const body_data = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected_signature = crypto.createHmac("sha256", key_secret).update(body_data).digest("hex")

    let paymentVerified = expected_signature === razorpay_signature
    console.log("[v0] Signature verification:", paymentVerified ? "PASSED" : "FAILED")

    // Method 2: If signature fails, verify via Razorpay API directly
    if (!paymentVerified) {
      try {
        console.log("[v0] Trying Razorpay API verification...")
        const authHeader = Buffer.from(`${key_id}:${key_secret}`).toString("base64")
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
        })

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          console.log("[v0] Razorpay payment status:", paymentData.status, "order:", paymentData.order_id)
          if (
            (paymentData.status === "captured" || paymentData.status === "authorized") &&
            paymentData.order_id === razorpay_order_id
          ) {
            paymentVerified = true
            console.log("[v0] API verification: PASSED")
          }
        } else {
          console.error("[v0] Razorpay API response not ok:", paymentResponse.status)
        }
      } catch (apiError) {
        console.error("[v0] Razorpay API verification error:", apiError)
      }
    }

    if (!paymentVerified) {
      console.error("[v0] Payment verification FAILED for order:", razorpay_order_id)
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed. If money was deducted, it will be refunded automatically.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Payment verified! Creating bookings...")

    // Payment verified - now create bookings in database
    const supabase = getSupabaseServerClient()
    const createdBookings = []
    const errors: { attendee: string; error: string }[] = []

    for (const attendee of attendees) {
      // Generate unique QR code data
      const qrCodeData = `TICKET-${uuidv4()}`

      // Core booking data - only columns guaranteed to exist
      const bookingData: Record<string, any> = {
        ticket_id: event_id,
        booking_name: attendee.name,
        booking_email: attendee.email,
        booking_phone: attendee.phone,
        is_paid: true,
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature,
        qr_code_data: qrCodeData,
      }

      // Try adding tracking columns
      const trackingData: Record<string, any> = { ...bookingData }
      if (influencer_code) trackingData.influencer_code = influencer_code
      if (referral_code) trackingData.referral_code_used = referral_code
      if (discount_applied) trackingData.discount_applied = discount_applied
      if (original_price) trackingData.original_price = original_price

      let booking = null

      // Attempt 1: Insert with tracking columns + join
      const { data: d1, error: e1 } = await supabase
        .from("ticket_bookings")
        .insert(trackingData)
        .select("*")
        .single()

      if (!e1 && d1) {
        booking = d1
      } else {
        console.log("[v0] Attempt 1 failed:", e1?.message)

        // Attempt 2: Insert with core columns only
        const { data: d2, error: e2 } = await supabase
          .from("ticket_bookings")
          .insert(bookingData)
          .select("*")
          .single()

        if (!e2 && d2) {
          booking = d2
        } else {
          console.error("[v0] Attempt 2 also failed:", e2?.message, e2?.details, e2?.hint)
          errors.push({ attendee: attendee.name, error: e2?.message || "Unknown insert error" })
          continue
        }
      }

      console.log("[v0] Booking created:", booking.id)
      createdBookings.push(booking)
    }

    if (createdBookings.length === 0) {
      console.error("[v0] Failed to create any bookings. Errors:", JSON.stringify(errors))
      return NextResponse.json(
        {
          success: false,
          error: `Booking failed: ${errors[0]?.error || "Unknown error"}. Payment was received - please contact support with payment ID: ${razorpay_payment_id}`,
          payment_id: razorpay_payment_id,
          details: errors,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully created", createdBookings.length, "bookings for payment:", razorpay_payment_id)

    return NextResponse.json({
      success: true,
      bookings: createdBookings,
      booking: createdBookings[0],
      message: `Payment verified and ${createdBookings.length} ticket(s) booked successfully`,
    })
  } catch (error) {
    console.error("[v0] Unhandled error in verify-payment:", error)
    return NextResponse.json(
      {
        success: false,
        error: `An unexpected error occurred. Please contact support. ${error instanceof Error ? error.message : ""}`,
      },
      { status: 500 },
    )
  }
}
