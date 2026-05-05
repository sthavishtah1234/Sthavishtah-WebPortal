"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Search, Download, ArrowUp, ArrowDown, SortAsc } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { getBatchLabel } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Update the User interface to include subscription_count
// Find the User interface and add this property:

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
  country: string | null
  subscription_status?: string | null
  subscription_count?: number
}

export default function ManageUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Add state for sorting
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Update the fetchUsers function to handle subscription status sorting
  // Find the fetchUsers function and update it to include this logic:

  async function fetchUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // For subscription status sorting, we need to handle it differently
      if (sortField === "subscription_status") {
        // First get all users without sorting
        const { data: usersData, error: usersError } = await supabase.from("users").select("*")

        if (usersError) throw usersError

        // Get all user_subscriptions
        const { data: userSubsData, error: userSubsError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("is_active", true)
          .gte("end_date", new Date().toISOString().split("T")[0])

        if (userSubsError) {
          console.error("Error fetching user subscriptions:", userSubsError)
          // Continue with users data only
          setUsers(usersData || [])
          return
        }

        // Create a map of user_id to subscription count
        const subscriptionCountMap = new Map()
        userSubsData?.forEach((sub) => {
          const count = subscriptionCountMap.get(sub.user_id) || 0
          subscriptionCountMap.set(sub.user_id, count + 1)
        })

        // Enhance users with subscription count
        const enhancedUsers = usersData?.map((user) => ({
          ...user,
          subscription_count: subscriptionCountMap.get(user.id) || 0,
          subscription_status: subscriptionCountMap.get(user.id)
            ? `Active (${subscriptionCountMap.get(user.id)})`
            : "No subscription",
        }))

        // Sort by subscription count
        enhancedUsers?.sort((a, b) => {
          if (sortDirection === "asc") {
            return a.subscription_count - b.subscription_count
          } else {
            return b.subscription_count - a.subscription_count
          }
        })

        setUsers(enhancedUsers || [])
      } else {
        // For other fields, use normal sorting
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        if (usersError) throw usersError

        // Get all user_subscriptions to enhance user data
        try {
          const { data: userSubsData, error: userSubsError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("is_active", true)
            .gte("end_date", new Date().toISOString().split("T")[0])

          if (userSubsError) {
            console.error("Error fetching user subscriptions:", userSubsError)
            setUsers(usersData || [])
            return
          }

          // Create a map of user_id to subscription count
          const subscriptionCountMap = new Map()
          userSubsData?.forEach((sub) => {
            const count = subscriptionCountMap.get(sub.user_id) || 0
            subscriptionCountMap.set(sub.user_id, count + 1)
          })

          // Enhance users with subscription count
          const enhancedUsers = usersData?.map((user) => ({
            ...user,
            subscription_count: subscriptionCountMap.get(user.id) || 0,
            subscription_status: subscriptionCountMap.get(user.id)
              ? `Active (${subscriptionCountMap.get(user.id)})`
              : "No subscription",
          }))

          setUsers(enhancedUsers || [])
        } catch (subscriptionError) {
          console.error("Error processing subscriptions:", subscriptionError)
          // Continue with users data only
          setUsers(usersData || [])
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update useEffect to depend on sortField and sortDirection
  useEffect(() => {
    fetchUsers()
  }, [sortField, sortDirection])

  // Add a function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Update the filteredUsers to include country in the search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.country && user.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.subscription_status && user.subscription_status.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Update the exportToCSV function to include country
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Phone Number",
      "WhatsApp Number",
      "Country",
      "Preferred Batch",
      "Subscription Status",
      "Created At",
    ]
    const csvRows = [headers]

    filteredUsers.forEach((user) => {
      const row = [
        user.user_id,
        user.name,
        user.email,
        user.phone_number,
        user.whatsapp_number || "",
        user.country || "",
        user.preferred_batch ? getBatchLabel(user.preferred_batch) : "",
        user.subscription_status || "No subscription",
        new Date(user.created_at).toLocaleString(),
      ]
      csvRows.push(row)
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "users.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Update the exportToExcel function similarly
  const exportToExcel = () => {
    // For simplicity, we'll just use CSV format with .xlsx extension
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Phone Number",
      "WhatsApp Number",
      "Country",
      "Preferred Batch",
      "Subscription Status",
      "Created At",
    ]
    const csvRows = [headers]

    filteredUsers.forEach((user) => {
      const row = [
        user.user_id,
        user.name,
        user.email,
        user.phone_number,
        user.whatsapp_number || "",
        user.country || "",
        user.preferred_batch ? getBatchLabel(user.preferred_batch) : "",
        user.subscription_status || "No subscription",
        new Date(user.created_at).toLocaleString(),
      ]
      csvRows.push(row)
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "users.xlsx")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>View and edit user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, phone, country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <SortAsc className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
                </div>
                <Select
                  value={sortField}
                  onValueChange={(value) => {
                    setSortField(value)
                    setSortDirection("asc")
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {sortField === "name" && "Name"}
                      {sortField === "email" && "Email"}
                      {sortField === "country" && "Country"}
                      {sortField === "created_at" && "Date"}
                      {sortField === "subscription_status" && "Subscription"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="subscription_status">Subscription</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="ml-2"
                >
                  {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">{searchQuery ? "No users match your search." : "No users found."}</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  {/* Update the table header to include Country and Subscription Status */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Preferred Batch</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* Update the table body to display country and subscription status */}
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user_id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{user.country || "Not set"}</TableCell>
                        <TableCell>{user.preferred_batch ? getBatchLabel(user.preferred_batch) : "Not set"}</TableCell>
                        <TableCell>{user.subscription_status || "No subscription"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
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
