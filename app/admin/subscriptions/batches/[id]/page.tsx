"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Users, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
}

interface SubscriptionBatch {
  id: number
  subscription_id: number
  batch_name: string
  start_date: string
  end_date: string
  max_seats: number | null
  seats_taken: number
  is_active: boolean
  is_default: boolean
  created_at: string
  user_count?: number
}

export default function ManageSubscriptionBatches({ params }: { params: { id: string } }) {
  const router = useRouter()
  const subscriptionId = Number.parseInt(params.id)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [batches, setBatches] = useState<SubscriptionBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New batch form state
  const [showNewBatchForm, setShowNewBatchForm] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [maxSeats, setMaxSeats] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)
  const [creatingTable, setCreatingTable] = useState(false)

  useEffect(() => {
    fetchSubscriptionAndBatches()
  }, [subscriptionId])

  async function fetchSubscriptionAndBatches() {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Fetch subscription details
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single()

      if (subscriptionError) {
        throw new Error(`Error fetching subscription: ${subscriptionError.message}`)
      }

      setSubscription(subscriptionData)

      // Fetch batches for this subscription
      const { data: batchesData, error: batchesError } = await supabase
        .from("subscription_batches")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("start_date", { ascending: false })

      if (batchesError) {
        // Check if the error is about the missing table
        if (batchesError.message.includes("relation") && batchesError.message.includes("does not exist")) {
          setTableMissing(true)
          setBatches([])
          return
        }
        throw new Error(`Error fetching batches: ${batchesError.message}`)
      }

      setTableMissing(false)

      // Get user counts for each batch
      const batchesWithCounts = await Promise.all(
        (batchesData || []).map(async (batch) => {
          const { count, error: countError } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id)

          if (countError) {
            console.error(`Error fetching user count for batch ${batch.id}:`, countError)
            return { ...batch, user_count: 0 }
          }

          return { ...batch, user_count: count || 0 }
        }),
      )

      setBatches(batchesWithCounts)
    } catch (err: any) {
      console.error("Error fetching subscription and batches:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateBatchForm = () => {
    const errors: Record<string, string> = {}

    if (!batchName.trim()) {
      errors.batchName = "Batch name is required"
    }

    if (!startDate) {
      errors.startDate = "Start date is required"
    }

    if (!endDate) {
      errors.endDate = "End date is required"
    } else if (startDate && endDate <= startDate) {
      errors.endDate = "End date must be after start date"
    }

    if (maxSeats && (isNaN(Number(maxSeats)) || Number(maxSeats) <= 0)) {
      errors.maxSeats = "Maximum seats must be a positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBatchForm()) return

    try {
      setSubmitting(true)
      setSuccess(null)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // If this is set as default, unset any existing defaults
      if (isDefault) {
        await supabase
          .from("subscription_batches")
          .update({ is_default: false })
          .eq("subscription_id", subscriptionId)
          .eq("is_default", true)
      }

      // Create the new batch
      const { data, error } = await supabase
        .from("subscription_batches")
        .insert([
          {
            subscription_id: subscriptionId,
            batch_name: batchName,
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString(),
            max_seats: maxSeats ? Number(maxSeats) : null,
            is_default: isDefault,
          },
        ])
        .select()

      if (error) throw error

      setSuccess("Batch created successfully!")
      setShowNewBatchForm(false)
      resetBatchForm()
      fetchSubscriptionAndBatches()
    } catch (err: any) {
      console.error("Error creating batch:", err)
      setError(`Failed to create batch: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const resetBatchForm = () => {
    setBatchName("")
    setStartDate(new Date())
    setEndDate(undefined)
    setMaxSeats("")
    setIsDefault(false)
    setFormErrors({})
  }

  const toggleBatchActive = async (batchId: number, currentStatus: boolean) => {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscription_batches")
        .update({ is_active: !currentStatus })
        .eq("id", batchId)

      if (error) throw error

      // Update local state
      setBatches((prev) =>
        prev.map((batch) => (batch.id === batchId ? { ...batch, is_active: !currentStatus } : batch)),
      )
    } catch (err: any) {
      console.error("Error toggling batch status:", err)
      setError(`Failed to update batch: ${err.message}`)
    }
  }

  const toggleBatchDefault = async (batchId: number, currentStatus: boolean) => {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // If setting to default, unset any existing defaults
      if (!currentStatus) {
        await supabase
          .from("subscription_batches")
          .update({ is_default: false })
          .eq("subscription_id", subscriptionId)
          .eq("is_default", true)
      }

      const { error } = await supabase
        .from("subscription_batches")
        .update({ is_default: !currentStatus })
        .eq("id", batchId)

      if (error) throw error

      // Update local state
      setBatches((prev) =>
        prev.map((batch) => {
          if (batch.id === batchId) {
            return { ...batch, is_default: !currentStatus }
          } else if (!currentStatus) {
            // If setting a new default, unset any existing defaults
            return { ...batch, is_default: false }
          }
          return batch
        }),
      )
    } catch (err: any) {
      console.error("Error toggling batch default status:", err)
      setError(`Failed to update batch: ${err.message}`)
    }
  }

  const deleteBatch = async (batchId: number) => {
    if (!confirm("Are you sure you want to delete this batch? This will NOT remove users from the subscription.")) {
      return
    }

    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Check if batch has users
      const { count, error: countError } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batchId)

      if (countError) throw countError

      if (count && count > 0) {
        if (
          !confirm(
            `This batch has ${count} users. Deleting it will remove the batch association but NOT the subscription. Continue?`,
          )
        ) {
          return
        }

        // Update user_subscriptions to remove batch_id
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({ batch_id: null })
          .eq("batch_id", batchId)

        if (updateError) throw updateError
      }

      // Delete the batch
      const { error } = await supabase.from("subscription_batches").delete().eq("id", batchId)

      if (error) throw error

      setSuccess("Batch deleted successfully!")
      // Update local state
      setBatches((prev) => prev.filter((batch) => batch.id !== batchId))
    } catch (err: any) {
      console.error("Error deleting batch:", err)
      setError(`Failed to delete batch: ${err.message}`)
    }
  }

  const viewBatchUsers = (batchId: number) => {
    router.push(`/admin/subscriptions/batches/users/${batchId}`)
  }

  const createBatchesTable = async () => {
    try {
      setCreatingTable(true)
      setError(null)

      const response = await fetch("/api/create-subscription-batches-table")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create subscription batches table")
      }

      setSuccess("Subscription batches table created successfully!")
      setTableMissing(false)
      fetchSubscriptionAndBatches()
    } catch (err: any) {
      console.error("Error creating subscription batches table:", err)
      setError(err.message)
    } finally {
      setCreatingTable(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/subscriptions")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">
              Manage Batches: {subscription?.name || `Subscription #${subscriptionId}`}
            </h1>
          </div>
          <Button onClick={() => setShowNewBatchForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Batch
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {tableMissing && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Table Missing</AlertTitle>
            <AlertDescription>
              The subscription batches table does not exist in your database yet.
              <Button onClick={createBatchesTable} disabled={creatingTable} className="ml-4">
                {creatingTable ? "Creating Table..." : "Create Table Now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showNewBatchForm && (
          <Card>
            <form onSubmit={handleCreateBatch}>
              <CardHeader>
                <CardTitle>Create New Batch</CardTitle>
                <CardDescription>Add a new batch for this subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-name">Batch Name</Label>
                  <Input
                    id="batch-name"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g., Summer 2023, Batch #4"
                  />
                  {formErrors.batchName && <p className="text-sm text-red-500">{formErrors.batchName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date)
                            setStartDateOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.startDate && <p className="text-sm text-red-500">{formErrors.startDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date)
                            setEndDateOpen(false)
                          }}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.endDate && <p className="text-sm text-red-500">{formErrors.endDate}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-seats">Maximum Seats (Optional)</Label>
                  <Input
                    id="max-seats"
                    type="number"
                    min="1"
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                  {formErrors.maxSeats && <p className="text-sm text-red-500">{formErrors.maxSeats}</p>}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label htmlFor="is-default" className="font-medium">
                      Default Batch
                    </Label>
                    <p className="text-sm text-gray-500">
                      New users will be automatically assigned to this batch when subscribing
                    </p>
                  </div>
                  <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setShowNewBatchForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Batch"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Subscription Batches</CardTitle>
            <CardDescription>
              Manage time-based batches for this subscription. Each batch has its own start and end dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No batches found for this subscription.</p>
                <Button className="mt-4" onClick={() => setShowNewBatchForm(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Batch
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const now = new Date()
                      const startDate = new Date(batch.start_date)
                      const endDate = new Date(batch.end_date)
                      const isUpcoming = startDate > now
                      const isActive = startDate <= now && endDate >= now
                      const isExpired = endDate < now

                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_name}</TableCell>
                          <TableCell>{format(new Date(batch.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(batch.end_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {batch.max_seats ? (
                              <span>
                                {batch.seats_taken} / {batch.max_seats}
                              </span>
                            ) : (
                              <span>{batch.seats_taken} / ∞</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="outline" className="bg-gray-100">
                                Expired
                              </Badge>
                            ) : isActive ? (
                              <Badge variant="default" className="bg-green-600">
                                Active
                              </Badge>
                            ) : isUpcoming ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                Upcoming
                              </Badge>
                            ) : (
                              <Badge variant={batch.is_active ? "default" : "outline"}>
                                {batch.is_active ? "Active" : "Inactive"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={batch.is_default}
                              onCheckedChange={() => toggleBatchDefault(batch.id, batch.is_default)}
                              disabled={isExpired}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewBatchUsers(batch.id)}
                                disabled={batch.user_count === 0}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                {batch.user_count || 0}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleBatchActive(batch.id, batch.is_active)}
                                disabled={isExpired}
                              >
                                {batch.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => deleteBatch(batch.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
