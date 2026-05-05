"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ArrowLeft, Check, Search, UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface SubscriptionBatch {
  id: number
  subscription_id: number
  batch_name: string
  start_date: string
  end_date: string
  max_seats: number | null
  seats_taken: number
  is_active: boolean
  subscription?: {
    name: string
    price: number
  }
}

interface User {
  id: string
  email: string
  name: string
  phone?: string
  created_at: string
  selected?: boolean
}

export default function AddUsersToBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const batchId = Number.parseInt(params.id)

  const [batch, setBatch] = useState<SubscriptionBatch | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBatchAndEligibleUsers()
  }, [batchId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.phone?.includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  async function fetchBatchAndEligibleUsers() {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Fetch batch details with subscription info
      const { data: batchData, error: batchError } = await supabase
        .from("subscription_batches")
        .select(
          `
          *,
          subscription:subscription_id (
            name,
            price
          )
        `,
        )
        .eq("id", batchId)
        .single()

      if (batchError) {
        throw new Error(`Error fetching batch: ${batchError.message}`)
      }

      setBatch(batchData)

      // Get users who have the subscription but not in this batch
      const { data: userData, error: userError } = await supabase
        .from("user_subscriptions")
        .select(
          `
          user:user_id (
            id,
            email,
            name,
            phone,
            created_at
          )
        `,
        )
        .eq("subscription_id", batchData.subscription_id)
        .is("batch_id", null)
        .order("created_at", { ascending: false })

      if (userError) {
        throw new Error(`Error fetching users: ${userError.message}`)
      }

      // Transform the data and remove duplicates
      const uniqueUsers = userData.reduce((acc: User[], item) => {
        if (item.user && !acc.some((u) => u.id === item.user.id)) {
          acc.push(item.user)
        }
        return acc
      }, [])

      setUsers(uniqueUsers)
      setFilteredUsers(uniqueUsers)
    } catch (err: any) {
      console.error("Error fetching batch and users:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const toggleAllUsers = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const addUsersToBatch = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one user to add to the batch")
      return
    }

    // Check if adding these users would exceed the max seats
    if (batch?.max_seats && batch.seats_taken + selectedUsers.length > batch.max_seats) {
      if (
        !confirm(
          `Adding ${selectedUsers.length} users would exceed the maximum seats (${batch.seats_taken}/${batch.max_seats}). Continue anyway?`,
        )
      ) {
        return
      }
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      const supabase = getSupabaseBrowserClient()

      // Get all user_subscription records for the selected users and this subscription
      const { data: subscriptions, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select("id, user_id")
        .eq("subscription_id", batch?.subscription_id)
        .in("user_id", selectedUsers)

      if (fetchError) throw fetchError

      if (!subscriptions || subscriptions.length === 0) {
        throw new Error("No subscription records found for the selected users")
      }

      // Update all the subscription records to add the batch_id
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ batch_id: batchId })
        .in(
          "id",
          subscriptions.map((sub) => sub.id),
        )

      if (updateError) throw updateError

      // Update the batch seats_taken count
      const { error: batchUpdateError } = await supabase
        .from("subscription_batches")
        .update({ seats_taken: (batch?.seats_taken || 0) + selectedUsers.length })
        .eq("id", batchId)

      if (batchUpdateError) throw batchUpdateError

      setSuccess(`Successfully added ${selectedUsers.length} users to the batch!`)
      setSelectedUsers([])

      // Refresh the data after a short delay
      setTimeout(() => {
        fetchBatchAndEligibleUsers()
      }, 1500)
    } catch (err: any) {
      console.error("Error adding users to batch:", err)
      setError(`Failed to add users: ${err.message}`)
    } finally {
      setSubmitting(false)
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/admin/subscriptions/batches/users/${batchId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Add Users to Batch: {batch?.batch_name || `Batch #${batchId}`}</h1>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
            <CardDescription>
              {batch?.subscription?.name} - {batch?.batch_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Subscription</h3>
                <p>{batch?.subscription?.name || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p>₹{batch?.subscription?.price || 0}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Seats</h3>
                <p>
                  {batch?.seats_taken || 0} / {batch?.max_seats || "∞"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Users to Batch</CardTitle>
            <CardDescription>Select users who have this subscription but are not assigned to any batch</CardDescription>
            <div className="mt-4 flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users by name, email or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button
                onClick={() => addUsersToBatch()}
                disabled={selectedUsers.length === 0 || submitting}
                className="whitespace-nowrap"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add {selectedUsers.length} User{selectedUsers.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {users.length === 0
                    ? "No eligible users found. All users with this subscription are already assigned to a batch."
                    : "No users match your search criteria."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                          onCheckedChange={toggleAllUsers}
                          aria-label="Select all users"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                            aria-label={`Select ${user.name || user.email}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserSelection(user.id)}
                            className={selectedUsers.includes(user.id) ? "text-green-600" : ""}
                          >
                            {selectedUsers.includes(user.id) ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Selected
                              </>
                            ) : (
                              "Select"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {selectedUsers.length} of {filteredUsers.length} users selected
              </p>
            </div>
            <Button onClick={() => addUsersToBatch()} disabled={selectedUsers.length === 0 || submitting}>
              {submitting ? "Adding..." : "Add Selected Users"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
