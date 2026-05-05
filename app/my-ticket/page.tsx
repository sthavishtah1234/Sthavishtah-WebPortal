"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  TicketIcon,
  Loader2,
  Download,
  CheckCircle2,
} from "lucide-react"
import QRCode from "qrcode"

interface Booking {
  id: string
  booking_name: string
  booking_email: string
  booking_phone: string
  qr_code_data: string
  is_paid: boolean
  is_attended: boolean
  booking_date: string
  event_tickets: {
    event_name: string
    event_date: string
    event_time: string
    venue: string
    ticket_price: number
  }
}

function QRCodeDisplay({ data, size = 150 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
    }
  }, [data, size])

  return <canvas ref={canvasRef} />
}

export default function MyTicketPage() {
  const [phone, setPhone] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"phone" | "tickets">("phone")

  const fetchBookings = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/tickets/my-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (data.success) {
        setBookings(data.bookings)
        setStep("tickets")
      } else {
        setError(data.error || "No bookings found")
      }
    } catch {
      setError("Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = async (booking: Booking) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 500

    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header
    ctx.fillStyle = "#059669"
    ctx.fillRect(0, 0, canvas.width, 60)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Sthavishtah Yoga & Wellness", canvas.width / 2, 40)

    // Event Name
    ctx.fillStyle = "#1f2937"
    ctx.font = "bold 20px Arial"
    ctx.fillText(booking.event_tickets.event_name, canvas.width / 2, 100)

    // Details
    ctx.font = "14px Arial"
    ctx.fillStyle = "#4b5563"
    ctx.fillText(
      new Date(booking.event_tickets.event_date).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      canvas.width / 2,
      130
    )
    ctx.fillText(booking.event_tickets.event_time, canvas.width / 2, 150)
    ctx.fillText(booking.event_tickets.venue, canvas.width / 2, 170)

    // Name
    ctx.fillStyle = "#1f2937"
    ctx.font = "bold 16px Arial"
    ctx.fillText(booking.booking_name, canvas.width / 2, 210)

    // QR Code
    const qrCanvas = document.createElement("canvas")
    await QRCode.toCanvas(qrCanvas, booking.qr_code_data, { width: 150 })
    ctx.drawImage(qrCanvas, (canvas.width - 150) / 2, 240)

    // QR Code text
    ctx.fillStyle = "#6b7280"
    ctx.font = "10px Arial"
    ctx.fillText(booking.qr_code_data, canvas.width / 2, 410)

    // Footer
    ctx.fillStyle = "#059669"
    ctx.fillRect(0, 440, canvas.width, 60)
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px Arial"
    ctx.fillText("Show this QR code at the venue", canvas.width / 2, 470)

    // Download
    const link = document.createElement("a")
    link.download = `ticket-${booking.event_tickets.event_name.replace(/\s+/g, "-")}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const h = parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-playfair text-xl font-semibold text-emerald-800">
              Sthavishtah Yoga & Wellness
            </span>
          </Link>
          <Link href="/events">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-emerald-800 text-center mb-8">
          My Tickets
        </h1>

        {step === "phone" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <TicketIcon className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
                Access Your Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  maxLength={10}
                  onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                onClick={fetchBookings}
                disabled={loading || phone.length < 10}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "View Tickets"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "tickets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep("phone")
                  setPhone("")
                  setBookings([])
                  setError("")
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Badge variant="outline" className="text-emerald-600">
                {bookings.length} ticket(s)
              </Badge>
            </div>

            {bookings.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <TicketIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No tickets found</p>
                  <Link href="/events">
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-purple-500 p-4 text-white">
                    <h3 className="font-playfair text-xl font-semibold">
                      {booking.event_tickets.event_name}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm opacity-90">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.event_tickets.event_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(booking.event_tickets.event_time)}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{booking.booking_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{booking.booking_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{booking.booking_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{booking.event_tickets.venue}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          {booking.is_paid ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge variant="destructive">Unpaid</Badge>
                          )}
                          {booking.is_attended && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Attended
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-white p-2 rounded-lg shadow-sm border">
                          <QRCodeDisplay data={booking.qr_code_data} size={120} />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          {booking.qr_code_data}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTicket(booking)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
