"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Download,
  TicketIcon,
  CheckCircle2,
} from "lucide-react"
import AdminLayout from "@/components/admin-layout"

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  venue: string
  description: string
  ticket_price: number
  total_seats: number
  available_seats: number
  is_active: boolean
  created_at: string
}

interface Booking {
  id: string
  ticket_id: string
  booking_name: string
  booking_email: string
  booking_phone: string
  qr_code_data: string
  is_paid: boolean
  is_attended: boolean
  attended_at: string | null
  booking_date: string
  event_tickets: Event
}

interface Stats {
  totalBookings: number
  paidBookings: number
  attendedBookings: number
  totalRevenue: number
}

// Helper function to get password from localStorage (set by AdminLayout)
const getAdminPassword = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminPassword") || ""
  }
  return ""
}

export default function AdminTicketsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Form state for creating/editing events
  const [formData, setFormData] = useState({
    event_name: "",
    event_date: "",
    event_time: "",
    venue: "",
    description: "",
    ticket_price: 0,
    total_seats: 100,
  })

  useEffect(() => {
    fetchEvents()
    fetchBookings()
  }, [])

  const fetchEvents = async () => {
    try {
      const adminPassword = getAdminPassword()
      const res = await fetch("/api/tickets/admin", {
        headers: { "x-admin-password": adminPassword },
      })
      const data = await res.json()
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  const fetchBookings = async (eventId?: string) => {
    try {
      setLoading(true)
      const adminPassword = getAdminPassword()
      const url = eventId
        ? `/api/tickets/admin/bookings?event_id=${eventId}`
        : "/api/tickets/admin/bookings"
      const res = await fetch(url, {
        headers: { "x-admin-password": adminPassword },
      })
      const data = await res.json()
      if (data.success) {
        setBookings(data.bookings)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    try {
      const adminPassword = getAdminPassword()
      const res = await fetch("/api/tickets/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateDialog(false)
        resetForm()
        fetchEvents()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return
    try {
      const adminPassword = getAdminPassword()
      const res = await fetch("/api/tickets/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ id: editingEvent.id, ...formData }),
      })
      const data = await res.json()
      if (data.success) {
        setEditingEvent(null)
        resetForm()
        fetchEvents()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Failed to update event:", error)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      const adminPassword = getAdminPassword()
      const res = await fetch(`/api/tickets/admin?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      })
      const data = await res.json()
      if (data.success) {
        fetchEvents()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const toggleEventActive = async (event: Event) => {
    try {
      const adminPassword = getAdminPassword()
      const res = await fetch("/api/tickets/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ id: event.id, is_active: !event.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Failed to toggle event:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      event_name: "",
      event_date: "",
      event_time: "",
      venue: "",
      description: "",
      ticket_price: 0,
      total_seats: 100,
    })
  }

  const openEditDialog = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      event_name: event.event_name,
      event_date: event.event_date,
      event_time: event.event_time,
      venue: event.venue,
      description: event.description || "",
      ticket_price: event.ticket_price,
      total_seats: event.total_seats,
    })
  }

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Event", "Date", "Paid", "Attended"]
    const rows = bookings.map((b) => [
      b.booking_name,
      b.booking_email,
      b.booking_phone,
      b.event_tickets?.event_name || "",
      b.booking_date,
      b.is_paid ? "Yes" : "No",
      b.is_attended ? "Yes" : "No",
    ])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Tickets Management</h1>
          <Link href="/admin/tickets/scanner">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <TicketIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.paidBookings}</p>
                <p className="text-sm text-gray-500">Paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{stats.attendedBookings}</p>
                <p className="text-sm text-gray-500">Attended</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <IndianRupee className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Events</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm()
                      setShowCreateDialog(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Event Name</Label>
                      <Input
                        value={formData.event_name}
                        onChange={(e) =>
                          setFormData({ ...formData, event_name: e.target.value })
                        }
                        placeholder="Yoga Workshop"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={formData.event_date}
                          onChange={(e) =>
                            setFormData({ ...formData, event_date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={formData.event_time}
                          onChange={(e) =>
                            setFormData({ ...formData, event_time: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Venue</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="Studio Address"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Event details..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ticket Price (INR)</Label>
                        <Input
                          type="number"
                          value={formData.ticket_price}
                          onChange={(e) =>
                            setFormData({ ...formData, ticket_price: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label>Total Seats</Label>
                        <Input
                          type="number"
                          value={formData.total_seats}
                          onChange={(e) =>
                            setFormData({ ...formData, total_seats: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full bg-emerald-600">
                      Create Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className={!event.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.event_name}</h3>
                          <Badge variant={event.is_active ? "default" : "secondary"}>
                            {event.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.event_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.venue}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.available_seats}/{event.total_seats} seats
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {event.ticket_price || "Free"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEventActive(event)}
                        >
                          {event.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(event)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Event</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Event Name</Label>
                                <Input
                                  value={formData.event_name}
                                  onChange={(e) =>
                                    setFormData({ ...formData, event_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Date</Label>
                                  <Input
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) =>
                                      setFormData({ ...formData, event_date: e.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Time</Label>
                                  <Input
                                    type="time"
                                    value={formData.event_time}
                                    onChange={(e) =>
                                      setFormData({ ...formData, event_time: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Venue</Label>
                                <Input
                                  value={formData.venue}
                                  onChange={(e) =>
                                    setFormData({ ...formData, venue: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Ticket Price (INR)</Label>
                                  <Input
                                    type="number"
                                    value={formData.ticket_price}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        ticket_price: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Total Seats</Label>
                                  <Input
                                    type="number"
                                    value={formData.total_seats}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        total_seats: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <Button onClick={handleUpdateEvent} className="w-full bg-emerald-600">
                                Update Event
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No events created yet. Click "Create Event" to add one.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">All Bookings</h2>
                <select
                  className="border rounded px-3 py-1 text-sm"
                  value={selectedEvent || ""}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value || null)
                    fetchBookings(e.target.value || undefined)
                  }}
                >
                  <option value="">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Contact</th>
                    <th className="text-left p-3 text-sm font-medium">Event</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium">{booking.booking_name}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{booking.booking_email}</p>
                        <p className="text-sm text-gray-500">{booking.booking_phone}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{booking.event_tickets?.event_name}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {booking.is_paid ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge variant="destructive">Unpaid</Badge>
                          )}
                          {booking.is_attended && (
                            <Badge className="bg-purple-100 text-purple-800">Attended</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
