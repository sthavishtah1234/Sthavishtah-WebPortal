"use client"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"

interface Notification {
  id: number
  message: string
  created_at: string
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>Stay updated with the latest announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="space-y-4 divide-y">
                {notifications.map((notification) => (
                  <li key={notification.id} className="pt-4 first:pt-0">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground">{formatDate(notification.created_at)}</p>
                      <p className="mt-1">{notification.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
