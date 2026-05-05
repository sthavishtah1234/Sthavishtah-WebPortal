"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Bell, Send, Trash2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Notification {
  id: number
  title: string
  message: string
  subscription_id?: number
  target_user_id?: number
  is_global: boolean
  created_at: string
  subscription?: { name: string }
  target_user?: { name: string; email: string }
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [targetType, setTargetType] = useState<"global" | "subscriptions" | "user">("global")
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchNotifications()
    fetchSubscriptions()
    fetchUsers()
  }, [])

  async function fetchNotifications() {
    try {
      const supabase = getSupabaseBrowserClient()

      // Use explicit foreign key references with aliases
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          subscription_id,
          target_user_id,
          is_global,
          created_at,
          subscriptions (name),
          target_user:target_user_id (name, email)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscriptions() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name").order("name")

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  async function fetchUsers() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("users").select("id, name, email").order("name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !message.trim()) {
      setStatus({
        type: "error",
        message: "Title and message are required",
      })
      return
    }

    if (targetType === "subscriptions" && selectedSubscriptions.length === 0) {
      setStatus({
        type: "error",
        message: "Please select at least one subscription",
      })
      return
    }

    if (targetType === "user" && !selectedUser) {
      setStatus({
        type: "error",
        message: "Please select a user",
      })
      return
    }

    try {
      setSending(true)
      setStatus(null)
      const supabase = getSupabaseBrowserClient()

      if (targetType === "global") {
        // Create single global notification
        const { error } = await supabase.from("notifications").insert({
          title,
          message,
          is_global: true,
        })

        if (error) throw error
      } else if (targetType === "subscriptions") {
        // Create notification for each selected subscription
        const notificationData = selectedSubscriptions.map((subscriptionId) => ({
          title,
          message,
          subscription_id: Number.parseInt(subscriptionId),
          is_global: false,
        }))

        const { error } = await supabase.from("notifications").insert(notificationData)
        if (error) throw error
      } else if (targetType === "user") {
        // Create notification for specific user
        const { error } = await supabase.from("notifications").insert({
          title,
          message,
          target_user_id: Number.parseInt(selectedUser),
          is_global: false,
        })

        if (error) throw error
      }

      setStatus({
        type: "success",
        message: "Notification sent successfully!",
      })

      // Reset form
      setTitle("")
      setMessage("")
      setTargetType("global")
      setSelectedSubscriptions([])
      setSelectedUser("")

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error("Error sending notification:", error)
      setStatus({
        type: "error",
        message: `Failed to send notification: ${error.message}`,
      })
    } finally {
      setSending(false)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      setStatus({
        type: "success",
        message: "Notification deleted successfully!",
      })

      fetchNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
      setStatus({
        type: "error",
        message: "Failed to delete notification",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>Create and send notifications to users</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <RadioGroup value={targetType} onValueChange={setTargetType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="global" id="global" />
                      <Label htmlFor="global">All Users (Global)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="subscriptions" id="subscriptions" />
                      <Label htmlFor="subscriptions">Subscription Members</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user">Specific User</Label>
                    </div>
                  </RadioGroup>
                </div>

                {targetType === "subscriptions" && (
                  <div className="space-y-2">
                    <Label>Select Subscriptions</Label>
                    <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                      {subscriptions.map((subscription) => (
                        <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`subscription-${subscription.id}`}
                            checked={selectedSubscriptions.includes(subscription.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubscriptions((prev) => [...prev, subscription.id.toString()])
                              } else {
                                setSelectedSubscriptions((prev) =>
                                  prev.filter((id) => id !== subscription.id.toString()),
                                )
                              }
                            }}
                          />
                          <Label htmlFor={`subscription-${subscription.id}`}>{subscription.name}</Label>
                        </div>
                      ))}
                    </div>
                    {selectedSubscriptions.length > 0 && (
                      <p className="text-sm text-blue-600">{selectedSubscriptions.length} subscription(s) selected</p>
                    )}
                  </div>
                )}

                {targetType === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="user-select">Select User</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name || user.email || `User ${user.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {status && (
                  <Alert variant={status.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={sending} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Sending..." : "Send Notification"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>View and manage sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p>No notifications sent yet.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Bell className="h-4 w-4" />
                            <h3 className="font-medium">{notification.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="text-xs text-gray-500">
                            <p>
                              Target:{" "}
                              {notification.is_global
                                ? "All Users"
                                : notification.subscription_id
                                  ? `Subscription: ${notification.subscription?.name || "Unknown"}`
                                  : notification.target_user_id
                                    ? `User: ${notification.target_user?.name || notification.target_user?.email || "Unknown"}`
                                    : "Unknown"}
                            </p>
                            <p>Sent: {new Date(notification.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
