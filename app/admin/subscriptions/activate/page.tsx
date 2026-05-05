"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle, Clock, AlertCircle, Search, RefreshCw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface UserSubscription {
  id: string
  user_id: string
  subscription_id: string
  start_date: string
  end_date: string
  is_active: boolean
  activation_date: string | null
  admin_activated: boolean
  activation_notes: string | null
  user: {
    id: string
    name: string
    email: string
  }
  subscription: {
    id: string
    name: string
    duration_days: number
  }
}

export default function ActivateSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [activationNotes, setActivationNotes] = useState("")
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [filter, setFilter] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      setStatusMessage(null)
      const supabase = getSupabaseBrowserClient()

      // Now fetch subscriptions with user details
      let query = supabase.from("user_subscriptions").select(`
          *,
          user:users (id, name, email),
          subscription:subscriptions (id, name, duration_days)
        `)

      // Apply filter
      if (filter === "pending") {
        query = query.eq("is_active", false)
      } else if (filter === "active") {
        query = query.eq("is_active", true)
      }

      const { data, error } = await query.order("start_date", { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setStatusMessage({
        type: "error",
        message: "Failed to load subscriptions. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  async function activateSubscription(id: string, activationDate: Date, notes: string) {
    try {
      setActivating(true)
      const supabase = getSupabaseBrowserClient()

      // Get the subscription to calculate new end date
      const { data: subscription, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription:subscriptions (duration_days)
        `)
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      // Calculate new end date based on activation date and duration
      const durationDays = subscription?.subscription?.duration_days || 30
      const newEndDate = new Date(activationDate)
      newEndDate.setDate(newEndDate.getDate() + durationDays)

      // Update the subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          is_active: true,
          activation_date: activationDate.toISOString(),
          admin_activated: true,
          activation_notes: notes || null,
          end_date: newEndDate.toISOString(), // Update end date based on activation date
        })
        .eq("id", id)

      if (error) throw error

      setStatusMessage({
        type: "success",
        message: "Subscription activated successfully",
      })

      // Refresh the list
      fetchSubscriptions()
    } catch (error) {
      console.error("Error activating subscription:", error)
      setStatusMessage({
        type: "error",
        message: "Failed to activate subscription. Please try again.",
      })
    } finally {
      setActivating(false)
    }
  }

  async function deactivateSubscription(id: string) {
    if (!confirm("Are you sure you want to deactivate this subscription?")) return

    try {
      setActivating(true)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          is_active: false,
          admin_activated: true,
          activation_notes: "Manually deactivated by admin",
        })
        .eq("id", id)

      if (error) throw error

      setStatusMessage({
        type: "success",
        message: "Subscription deactivated successfully",
      })

      // Refresh the list
      fetchSubscriptions()
    } catch (error) {
      console.error("Error deactivating subscription:", error)
      setStatusMessage({
        type: "error",
        message: "Failed to deactivate subscription. Please try again.",
      })
    } finally {
      setActivating(false)
    }
  }

  async function bulkActivateSubscriptions() {
    if (!selectedDate) {
      setStatusMessage({
        type: "error",
        message: "Please select an activation date",
      })
      return
    }

    if (selectedSubscriptions.length === 0) {
      setStatusMessage({
        type: "error",
        message: "Please select at least one subscription",
      })
      return
    }

    try {
      setActivating(true)
      const supabase = getSupabaseBrowserClient()

      // Get all selected subscriptions to calculate new end dates
      const { data: selectedSubs, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          subscription:subscriptions (duration_days)
        `)
        .in("id", selectedSubscriptions)

      if (fetchError) throw fetchError

      // Process each subscription
      for (const sub of selectedSubs || []) {
        const durationDays = sub?.subscription?.duration_days || 30
        const newEndDate = new Date(selectedDate)
        newEndDate.setDate(newEndDate.getDate() + durationDays)

        // Update the subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            is_active: true,
            activation_date: selectedDate.toISOString(),
            admin_activated: true,
            activation_notes: activationNotes || "Bulk activated by admin",
            end_date: newEndDate.toISOString(), // Update end date based on activation date
          })
          .eq("id", sub.id)

        if (error) throw error
      }

      setStatusMessage({
        type: "success",
        message: `${selectedSubscriptions.length} subscriptions activated successfully`,
      })

      // Reset selection and refresh
      setSelectedSubscriptions([])
      fetchSubscriptions()
    } catch (error) {
      console.error("Error bulk activating subscriptions:", error)
      setStatusMessage({
        type: "error",
        message: "Failed to activate subscriptions. Please try again.",
      })
    } finally {
      setActivating(false)
    }
  }

  const toggleSelectSubscription = (id: string) => {
    if (selectedSubscriptions.includes(id)) {
      setSelectedSubscriptions(selectedSubscriptions.filter((subId) => subId !== id))
    } else {
      setSelectedSubscriptions([...selectedSubscriptions, id])
    }
  }

  const selectAllVisible = () => {
    const visibleIds = filteredSubscriptions.map((sub) => sub.id)
    setSelectedSubscriptions(visibleIds)
  }

  const clearSelection = () => {
    setSelectedSubscriptions([])
  }

  // Filter subscriptions based on search query
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      sub.user?.name?.toLowerCase().includes(query) ||
      sub.user?.email?.toLowerCase().includes(query) ||
      sub.subscription?.name?.toLowerCase().includes(query)
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Subscription Activations</h1>
          <Button onClick={() => fetchSubscriptions()} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">About Subscription Activation</AlertTitle>
          <AlertDescription className="text-blue-700">
            When you activate a subscription, the subscription period will start from the activation date, not the
            registration date. The end date will be recalculated based on the activation date and the subscription
            duration.
          </AlertDescription>
        </Alert>

        {statusMessage && (
          <Alert
            className={statusMessage.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className={statusMessage.type === "success" ? "text-green-800" : "text-red-800"}>
              {statusMessage.type === "success" ? "Success" : "Error"}
            </AlertTitle>
            <AlertDescription className={statusMessage.type === "success" ? "text-green-700" : "text-red-700"}>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bulk Activation</CardTitle>
            <CardDescription>Activate multiple subscriptions at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="activation-date">Activation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="activation-notes">Activation Notes (Optional)</Label>
                <Textarea
                  id="activation-notes"
                  value={activationNotes}
                  onChange={(e) => setActivationNotes(e.target.value)}
                  placeholder="e.g., May 2023 Batch Activation"
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedSubscriptions.length} subscriptions selected
              </span>
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                Select All Visible
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
            <Button
              onClick={bulkActivateSubscriptions}
              disabled={selectedSubscriptions.length === 0 || !selectedDate || activating}
              className="relative"
            >
              {activating && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/80 rounded-md">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
              Activate Selected Subscriptions
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Tabs defaultValue="pending" value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2">Loading subscriptions...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p>No subscriptions found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center justify-center">
                        <span className="sr-only">Select</span>
                      </div>
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Activation Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedSubscriptions.includes(subscription.id)}
                            onCheckedChange={() => toggleSelectSubscription(subscription.id)}
                            disabled={subscription.is_active}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{subscription.user?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user?.email || "No email"}</div>
                      </TableCell>
                      <TableCell>{subscription.subscription?.name || "Unknown"}</TableCell>
                      <TableCell>{format(new Date(subscription.start_date), "PPP")}</TableCell>
                      <TableCell>
                        {subscription.activation_date
                          ? format(new Date(subscription.activation_date), "PPP")
                          : "Not activated"}
                      </TableCell>
                      <TableCell>{format(new Date(subscription.end_date), "PPP")}</TableCell>
                      <TableCell>
                        {subscription.is_active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {subscription.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateSubscription(subscription.id)}
                            disabled={activating}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" disabled={activating}>
                                Activate
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-4">
                                <h4 className="font-medium">Activate Subscription</h4>
                                <div className="space-y-2">
                                  <Label htmlFor="single-activation-date">Activation Date</Label>
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-notes">Notes (Optional)</Label>
                                  <Textarea
                                    id="single-notes"
                                    value={activationNotes}
                                    onChange={(e) => setActivationNotes(e.target.value)}
                                    placeholder="Activation notes"
                                    className="resize-none"
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() =>
                                    selectedDate && activateSubscription(subscription.id, selectedDate, activationNotes)
                                  }
                                  disabled={!selectedDate || activating}
                                >
                                  {activating ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                  ) : null}
                                  Confirm Activation
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
