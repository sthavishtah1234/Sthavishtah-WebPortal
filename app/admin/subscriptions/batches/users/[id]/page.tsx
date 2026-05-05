"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { ArrowLeft, Plus, Trash2, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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
  user_subscription?: {
    id: string
    start_date: string
    end_date: string
    is_active: boolean
  }
}

export default function BatchUsersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const batchId = Number.parseInt(params.id)

  const [batch, setBatch] = useState<SubscriptionBatch | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  useEffect(() => {
    fetchBatchAndUsers()
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

  async function fetchBatchAndUsers() {
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

      // Fetch users in this batch
      const { data: userData, error: userError } = await supabase
        .from("user_subscriptions")
        .select(
          `
          id,
          start_date,
          end_date,
          is_active,
          user:user_id (
            id,
            email,
            name,
            phone,
            created_at
          )
        `,
        )
        .eq("batch_id", batchId)
        .order("start_date", { ascending: false })

      if (userError) {
        throw new Error(`Error fetching users: ${userError.message}`)
      }

      // Transform the data to match our User interface
      const transformedUsers = userData.map((item) => ({
        ...item.user,
        user_subscription: {
          id: item.id,
          start_date: item.start_date,
          end_date: item.end_date,
          is_active: item.is_active,
        },
      }))

      setUsers(transformedUsers)
      setFilteredUsers(transformedUsers)
    } catch (err: any) {
      console.error("Error fetching batch and users:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const removeUserFromBatch = async (userId: string, subscriptionId: string) => {
    if (!confirm("Are you sure you want to remove this user from the batch?")) {
      return
    }

    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("user_subscriptions").update({ batch_id: null }).eq("id", subscriptionId)

      if (error) throw error

      setSuccess("User removed from batch successfully!")
      // Update local state
      setUsers((prev) => prev.filter((user) => user.id !== userId))
    } catch (err: any) {
      console.error("Error removing user from batch:", err)
      setError(`Failed to remove user: ${err.message}`)
    }
  }

  const addUsersToBatch = () => {
    router.push(`/admin/subscriptions/batches/add-users/${batchId}`)
  }

  const sendEmailToBatch = () => {
    router.push(`/admin/email?batch=${batchId}`)
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
              onClick={() => router.push(`/admin/subscriptions/batches/${batch?.subscription_id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Batch Users: {batch?.batch_name || `Batch #${batchId}`}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => sendEmailToBatch()}>
              <Mail className="mr-2 h-4 w-4" /> Email Batch
            </Button>
            <Button onClick={() => addUsersToBatch()}>
              <Plus className="mr-2 h-4 w-4" /> Add Users
            </Button>
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
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p>{batch?.start_date ? format(new Date(batch.start_date), "PPP") : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p>{batch?.end_date ? format(new Date(batch.end_date), "PPP") : "N/A"}</p>
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
            <CardTitle>Users in Batch</CardTitle>
            <CardDescription>
              {users.length} user{users.length !== 1 ? "s" : ""} enrolled in this batch
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder="Search users by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {users.length === 0 ? "No users found in this batch." : "No users match your search criteria."}
                </p>
                {users.length === 0 && (
                  <Button className="mt-4" onClick={() => addUsersToBatch()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Users to Batch
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>
                          {user.user_subscription?.start_date
                            ? format(new Date(user.user_subscription.start_date), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {user.user_subscription?.end_date
                            ? format(new Date(user.user_subscription.end_date), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.user_subscription?.is_active ? "default" : "outline"}
                            className={user.user_subscription?.is_active ? "bg-green-600" : ""}
                          >
                            {user.user_subscription?.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeUserFromBatch(user.id, user.user_subscription?.id || "")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
