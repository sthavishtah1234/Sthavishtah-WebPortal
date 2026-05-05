"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Trash2,
  UserPlus,
  X,
  Download,
  Upload,
  Calendar,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  Bell,
  FileText,
  Send,
  CheckSquare,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format, addDays } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface User {
  id: number
  name: string
  email: string
  created_at: string
  subscription_start?: string
  subscription_end?: string
  status?: string
  selected?: boolean
}

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
}

interface Document {
  id: number
  title: string
  url: string
  description: string | null
  category: string
  is_visible: boolean
  subscription_id: number | null
}

export default function SubscriptionUsersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const subscriptionId = Number.parseInt(params.id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog states
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [singleUserNotificationDialogOpen, setSingleUserNotificationDialogOpen] = useState(false)
  const [singleUserDocumentDialogOpen, setSingleUserDocumentDialogOpen] = useState(false)
  const [createDocumentDialogOpen, setCreateDocumentDialogOpen] = useState(false)

  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectAllAvailable, setSelectAllAvailable] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [extensionDays, setExtensionDays] = useState(30)
  const [customExtensionDate, setCustomExtensionDate] = useState<Date | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("active")
  const [sortColumn, setSortColumn] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Notification and document states
  const [notificationMessage, setNotificationMessage] = useState("")
  const [sendingNotification, setSendingNotification] = useState(false)
  const [sendingDocument, setSendingDocument] = useState(false)
  const [currentUserForAction, setCurrentUserForAction] = useState<User | null>(null)

  // New document form
  const [newDocumentTitle, setNewDocumentTitle] = useState("")
  const [newDocumentUrl, setNewDocumentUrl] = useState("")
  const [newDocumentDescription, setNewDocumentDescription] = useState("")
  const [newDocumentCategory, setNewDocumentCategory] = useState("general")
  const [creatingDocument, setCreatingDocument] = useState(false)

  const categories = [
    { value: "general", label: "General" },
    { value: "course_material", label: "Course Material" },
    { value: "reference", label: "Reference" },
    { value: "tutorial", label: "Tutorial" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    fetchSubscriptionDetails()
    fetchSubscriptionUsers()
  }, [subscriptionId])

  useEffect(() => {
    filterAndSortUsers()
  }, [users, searchQuery, statusFilter, activeTab, sortColumn, sortDirection])

  useEffect(() => {
    // Update selectAll state when all visible users are selected
    if (filteredUsers.length > 0) {
      const allSelected = filteredUsers.every((user) => selectedUsers.includes(user.id))
      setSelectAll(allSelected && selectedUsers.length > 0)
    } else {
      setSelectAll(false)
    }
  }, [selectedUsers, filteredUsers])

  async function fetchSubscriptionDetails() {
    try {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("*").eq("id", subscriptionId).single()

      if (error) throw error

      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription details:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      })
    }
  }

  async function fetchSubscriptionUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Get all users with this subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          status,
          is_active
        `)
        .eq("subscription_id", subscriptionId)

      if (subscriptionError) throw subscriptionError

      if (!subscriptionData || subscriptionData.length === 0) {
        setUsers([])
        setLoading(false)
        return
      }

      // Get user details for each subscription
      const userIds = subscriptionData.map((sub) => sub.user_id)

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, email, created_at")
        .in("id", userIds)

      if (userError) throw userError

      // Combine user data with subscription data
      const combinedData =
        userData?.map((user) => {
          const subscription = subscriptionData.find((sub) => sub.user_id === user.id)
          return {
            ...user,
            subscription_start: subscription?.start_date,
            subscription_end: subscription?.end_date,
            status: subscription?.is_active ? "active" : "inactive",
          }
        }) || []

      setUsers(combinedData)
      setSelectedUsers([]) // Reset selected users when refreshing
    } catch (error) {
      console.error("Error fetching subscription users:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortUsers() {
    let filtered = [...users]

    // Filter by tab (active/inactive)
    if (activeTab === "active") {
      filtered = filtered.filter((user) => user.status === "active")
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((user) => user.status === "inactive")
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
      )
    }

    // Apply status filter if not using tabs
    if (activeTab === "all" && statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "")
          break
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "")
          break
        case "start_date":
          const dateA = a.subscription_start ? new Date(a.subscription_start).getTime() : 0
          const dateB = b.subscription_start ? new Date(b.subscription_start).getTime() : 0
          comparison = dateA - dateB
          break
        case "end_date":
          const endA = a.subscription_end ? new Date(a.subscription_end).getTime() : 0
          const endB = b.subscription_end ? new Date(b.subscription_end).getTime() : 0
          comparison = endA - endB
          break
        default:
          comparison = (a.name || "").localeCompare(b.name || "")
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredUsers(filtered)
  }

  async function fetchAvailableUsers() {
    try {
      setLoadingAvailableUsers(true)
      const supabase = getSupabaseBrowserClient()

      console.log("Fetching available users...")

      // Get all users who already have this subscription
      const { data: existingUserIds, error: existingError } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)

      if (existingError) {
        console.error("Error fetching existing users:", existingError)
        throw existingError
      }

      const existingIds = existingUserIds?.map((item) => item.user_id) || []
      console.log(`Found ${existingIds.length} existing users`)

      // Get all users
      let query = supabase.from("users").select("id, name, email, created_at")

      // If we have existing users, exclude them
      if (existingIds.length > 0) {
        query = query.not("id", "in", `(${existingIds.join(",")})`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching all users:", error)
        throw error
      }

      console.log(`Found ${data?.length || 0} available users`)
      setAvailableUsers(data || [])
      setSelectedUserIds([]) // Reset selected users
      setSelectAllAvailable(false)
    } catch (error) {
      console.error("Error fetching available users:", error)
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive",
      })
    } finally {
      setLoadingAvailableUsers(false)
    }
  }

  async function fetchAvailableDocuments() {
    try {
      setLoadingDocuments(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch documents that are either for all users or specific to this subscription
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, url, description, category, is_visible, subscription_id")
        .or(`subscription_id.is.null,subscription_id.eq.${subscriptionId}`)
        .eq("is_active", true)
        .order("title", { ascending: true })

      if (error) throw error

      setAvailableDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoadingDocuments(false)
    }
  }

  async function addUsersToSubscription() {
    if (selectedUserIds.length === 0 || !subscription) {
      toast({
        title: "Error",
        description: "Please select at least one user to add",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()

      // Calculate end date based on subscription duration
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + subscription.duration_days)

      // Prepare subscription data for all selected users
      const subscriptionData = selectedUserIds.map((userId) => ({
        user_id: userId,
        subscription_id: subscriptionId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        is_active: true,
      }))

      // Add users to subscription in bulk
      const { error } = await supabase.from("user_subscriptions").insert(subscriptionData)

      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedUserIds.length} users added to subscription successfully`,
      })

      // Refresh the user list
      fetchSubscriptionUsers()
      setAddUserDialogOpen(false)
      setSelectedUserIds([])
      setUserSearchQuery("")
    } catch (error) {
      console.error("Error adding users to subscription:", error)
      toast({
        title: "Error",
        description: "Failed to add users to subscription",
        variant: "destructive",
      })
    }
  }

  async function removeUserFromSubscription(userId: number) {
    if (!confirm("Are you sure you want to remove this user from the subscription?")) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Update user subscription to inactive
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ is_active: false, status: "inactive" })
        .eq("user_id", userId)
        .eq("subscription_id", subscriptionId)

      if (error) throw error

      toast({
        title: "Success",
        description: "User removed from subscription successfully",
      })

      // Refresh the user list
      fetchSubscriptionUsers()
    } catch (error) {
      console.error("Error removing user from subscription:", error)
      toast({
        title: "Error",
        description: "Failed to remove user from subscription",
        variant: "destructive",
      })
    }
  }

  async function bulkRemoveUsers() {
    if (selectedUsers.length === 0) return

    if (!confirm(`Are you sure you want to remove ${selectedUsers.length} users from this subscription?`)) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Update all selected user subscriptions to inactive
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ is_active: false, status: "inactive" })
        .in("user_id", selectedUsers)
        .eq("subscription_id", subscriptionId)

      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedUsers.length} users removed from subscription successfully`,
      })

      // Refresh the user list
      fetchSubscriptionUsers()
    } catch (error) {
      console.error("Error removing users from subscription:", error)
      toast({
        title: "Error",
        description: "Failed to remove users from subscription",
        variant: "destructive",
      })
    }
  }

  async function extendSubscriptions() {
    if (selectedUsers.length === 0) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Get current subscription data for selected users
      const { data: subscriptionData, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select("id, user_id, end_date")
        .in("user_id", selectedUsers)
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)

      if (fetchError) throw fetchError

      if (!subscriptionData || subscriptionData.length === 0) {
        toast({
          title: "Error",
          description: "No active subscriptions found for selected users",
          variant: "destructive",
        })
        return
      }

      // Update each subscription with new end date
      for (const sub of subscriptionData) {
        let newEndDate: Date

        if (customExtensionDate) {
          newEndDate = customExtensionDate
        } else {
          // Use current end date as base if it exists and is in the future
          const currentEndDate = sub.end_date ? new Date(sub.end_date) : new Date()
          const now = new Date()
          const baseDate = currentEndDate > now ? currentEndDate : now

          newEndDate = addDays(baseDate, extensionDays)
        }

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({ end_date: newEndDate.toISOString() })
          .eq("id", sub.id)

        if (updateError) throw updateError
      }

      toast({
        title: "Success",
        description: `Extended subscription for ${selectedUsers.length} users`,
      })

      // Refresh the user list
      fetchSubscriptionUsers()
      setExtendDialogOpen(false)
      setCustomExtensionDate(undefined)
      setExtensionDays(30)
    } catch (error) {
      console.error("Error extending subscriptions:", error)
      toast({
        title: "Error",
        description: "Failed to extend subscriptions",
        variant: "destructive",
      })
    }
  }

  async function sendNotificationToUsers() {
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive",
      })
      return
    }

    if (!notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a notification message",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingNotification(true)
      const supabase = getSupabaseBrowserClient()

      // Insert notification into the notifications table
      const { error } = await supabase.from("notifications").insert([{ message: notificationMessage }])

      if (error) throw error

      toast({
        title: "Success",
        description: `Notification sent to all users`,
      })

      setNotificationDialogOpen(false)
      setNotificationMessage("")
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setSendingNotification(false)
    }
  }

  async function sendNotificationToUser(user: User) {
    if (!notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a notification message",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingNotification(true)
      const supabase = getSupabaseBrowserClient()

      // Insert notification into the notifications table
      // Since notifications are global, we just add it to the notifications table
      const { error } = await supabase.from("notifications").insert([{ message: notificationMessage }])

      if (error) throw error

      toast({
        title: "Success",
        description: `Notification sent successfully`,
      })

      setSingleUserNotificationDialogOpen(false)
      setNotificationMessage("")
      setCurrentUserForAction(null)
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setSendingNotification(false)
    }
  }

  async function createAndAssignDocument() {
    if (!newDocumentTitle.trim() || !newDocumentUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and URL for the document",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingDocument(true)
      const supabase = getSupabaseBrowserClient()

      // Create a new document in the documents table
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: newDocumentTitle,
          url: newDocumentUrl,
          description: newDocumentDescription,
          category: newDocumentCategory,
          is_active: true,
          is_visible: true,
          subscription_id: subscriptionId, // Associate with this subscription
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Document created and assigned to subscription",
      })

      setCreateDocumentDialogOpen(false)
      resetNewDocumentForm()
    } catch (error) {
      console.error("Error creating document:", error)
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      })
    } finally {
      setCreatingDocument(false)
    }
  }

  function resetNewDocumentForm() {
    setNewDocumentTitle("")
    setNewDocumentUrl("")
    setNewDocumentDescription("")
    setNewDocumentCategory("general")
  }

  function getFilteredAvailableUsers() {
    if (!userSearchQuery) return availableUsers

    const query = userSearchQuery.toLowerCase()
    return availableUsers.filter(
      (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
    )
  }

  function toggleSelectUser(userId: number) {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  function toggleSelectAvailableUser(userId: number) {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
    setSelectAll(!selectAll)
  }

  function toggleSelectAllAvailable() {
    const filteredAvailableUsers = getFilteredAvailableUsers()
    if (selectAllAvailable) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredAvailableUsers.map((user) => user.id))
    }
    setSelectAllAvailable(!selectAllAvailable)
  }

  function exportUsersToCsv() {
    // Create CSV content
    const headers = ["Name", "Email", "Start Date", "End Date", "Status"]
    const rows = filteredUsers.map((user) => [
      user.name,
      user.email,
      user.subscription_start ? format(new Date(user.subscription_start), "yyyy-MM-dd") : "",
      user.subscription_end ? format(new Date(user.subscription_end), "yyyy-MM-dd") : "",
      user.status,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${subscription?.name}-users-${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      console.log("No file selected")
      return
    }

    console.log(`File selected: ${file.name}, size: ${file.size} bytes`)

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      console.log(`File content loaded, length: ${content.length} characters`)
      setCsvContent(content)
      processCsvContent(content)
    }

    reader.onerror = (e) => {
      console.error("Error reading file:", e)
      toast({
        title: "Error",
        description: "Failed to read the CSV file",
        variant: "destructive",
      })
    }

    reader.readAsText(file)
  }

  async function processCsvContent(content: string) {
    if (!content || content.trim() === "") {
      console.log("CSV content is empty")
      toast({
        title: "Error",
        description: "The CSV file is empty",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Processing CSV content...")

      // Parse CSV
      const lines = content.split("\n")
      console.log(`CSV has ${lines.length} lines`)

      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file is empty or invalid",
          variant: "destructive",
        })
        return
      }

      const headers = lines[0].split(",")
      console.log(`CSV headers: ${headers.join(", ")}`)

      const emailIndex = headers.findIndex((h) => h.toLowerCase().includes("email"))

      if (emailIndex === -1) {
        toast({
          title: "Error",
          description: "CSV file must contain an email column",
          variant: "destructive",
        })
        return
      }

      // Extract emails
      const emails = lines
        .slice(1)
        .map((line) => line.split(",")[emailIndex]?.trim())
        .filter(Boolean)

      console.log(`Found ${emails.length} emails in CSV`)

      if (emails.length === 0) {
        toast({
          title: "Error",
          description: "No valid emails found in CSV file",
          variant: "destructive",
        })
        return
      }

      // Find users by email
      const supabase = getSupabaseBrowserClient()
      console.log(`Looking up ${emails.length} emails in the database`)

      const { data: users, error } = await supabase.from("users").select("id, email").in("email", emails)

      if (error) {
        console.error("Supabase error looking up users:", error)
        throw error
      }

      console.log(`Found ${users?.length || 0} matching users in the database`)

      if (!users || users.length === 0) {
        toast({
          title: "Warning",
          description: "No matching users found in the system",
        })
        return
      }

      // Check which users already have this subscription
      const userIds = users.map((u) => u.id)
      const { data: existingSubscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .in("user_id", userIds)
        .eq("subscription_id", subscriptionId)
        .eq("is_active", true)

      if (subError) {
        console.error("Error checking existing subscriptions:", subError)
        throw subError
      }

      const existingUserIds = existingSubscriptions?.map((s) => s.user_id) || []
      const newUserIds = userIds.filter((id) => !existingUserIds.includes(id))

      console.log(`${existingUserIds.length} users already have this subscription`)
      console.log(`${newUserIds.length} users will be added to the subscription`)

      if (newUserIds.length === 0) {
        toast({
          title: "Warning",
          description: "All users in the CSV already have this subscription",
        })
        return
      }

      // Add new users to subscription
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + (subscription?.duration_days || 30))

      const subscriptionData = newUserIds.map((userId) => ({
        user_id: userId,
        subscription_id: subscriptionId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        is_active: true,
      }))

      console.log(`Adding ${subscriptionData.length} users to subscription ${subscriptionId}`)

      const { error: insertError } = await supabase.from("user_subscriptions").insert(subscriptionData)

      if (insertError) {
        console.error("Error inserting subscriptions:", insertError)
        throw insertError
      }

      toast({
        title: "Success",
        description: `Added ${newUserIds.length} users to subscription`,
      })

      // Refresh the user list
      fetchSubscriptionUsers()
      setBulkAddDialogOpen(false)
      setCsvContent("")

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      })
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  function getSortIcon(column: string) {
    if (sortColumn !== column) return null

    return sortDirection === "asc" ? (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1 transform rotate-180" />
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subscription Users</h1>
            {subscription && (
              <p className="text-gray-500">
                {subscription.name} - ₹{subscription.price.toFixed(2)} for {subscription.duration_days} days
              </p>
            )}
          </div>
          <Button onClick={() => router.back()}>Back to Subscriptions</Button>
        </div>

        {/* Stats Cards */}
        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{users.filter((user) => user.status === "active").length}</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{users.filter((user) => user.status === "inactive").length}</div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  ₹{(subscription.price * users.filter((user) => user.status === "active").length).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage users in this subscription</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setAddUserDialogOpen(true)
                    fetchAvailableUsers()
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>

                <Button variant="outline" onClick={() => setBulkAddDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Bulk Add
                </Button>

                <Button variant="outline" onClick={exportUsersToCsv}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>

                <Button variant="ghost" size="icon" onClick={fetchSubscriptionUsers}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedUsers.length} selected</span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotificationDialogOpen(true)
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" /> Notify
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocumentDialogOpen(true)
                      fetchAvailableDocuments()
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Send Document
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setExtendDialogOpen(true)}>
                    <Calendar className="mr-2 h-4 w-4" /> Extend
                  </Button>

                  <Button variant="destructive" size="sm" onClick={bulkRemoveUsers}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                {users.length === 0 ? "No users found in this subscription." : "No users match your search criteria."}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} aria-label="Select all users" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                        Name {getSortIcon("name")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                        Email {getSortIcon("email")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("start_date")}>
                        Start Date {getSortIcon("start_date")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("end_date")}>
                        End Date {getSortIcon("end_date")}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Select ${user.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.subscription_start ? format(new Date(user.subscription_start), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {user.subscription_end ? format(new Date(user.subscription_end), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentUserForAction(user)
                                  setSingleUserNotificationDialogOpen(true)
                                }}
                              >
                                Send notification
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentUserForAction(user)
                                  setSingleUserDocumentDialogOpen(true)
                                  fetchAvailableDocuments()
                                }}
                              >
                                Send document
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUsers([user.id])
                                  setExtendDialogOpen(true)
                                }}
                              >
                                Extend subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => removeUserFromSubscription(user.id)}>
                                Remove from subscription
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Users to Subscription</DialogTitle>
            <DialogDescription>Select users to add to the {subscription?.name} subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {userSearchQuery && (
                <Button variant="ghost" size="icon" onClick={() => setUserSearchQuery("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loadingAvailableUsers ? (
              <div className="text-center py-8">Loading available users...</div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-8">
                No available users found. All users are already in this subscription.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAllAvailable}
                          onCheckedChange={toggleSelectAllAvailable}
                          aria-label="Select all available users"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAvailableUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={() => toggleSelectAvailableUser(user.id)}
                            aria-label={`Select ${user.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedUserIds.length > 0 && (
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm font-medium">{selectedUserIds.length} users selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds([])}>
                  Clear
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addUsersToSubscription} disabled={selectedUserIds.length === 0}>
              <CheckSquare className="mr-2 h-4 w-4" /> Add {selectedUserIds.length} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Users</DialogTitle>
            <DialogDescription>Upload a CSV file with user emails to add them to this subscription.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="csv-file" className="text-sm font-medium">
                Upload CSV File
              </label>
              <Input id="csv-file" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} />
              <p className="text-xs text-muted-foreground">
                CSV file must contain an email column. Only users with matching emails in the system will be added.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => processCsvContent(csvContent)} disabled={!csvContent}>
              Add Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscriptions</DialogTitle>
            <DialogDescription>
              Extend the subscription end date for {selectedUsers.length} selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Extension Method</label>
              <Tabs defaultValue="days" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="days">Add Days</TabsTrigger>
                  <TabsTrigger value="date">Set Date</TabsTrigger>
                </TabsList>
                <TabsContent value="days" className="pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Days to Add</label>
                    <Input
                      type="number"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(Number.parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="date" className="pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">New End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          {customExtensionDate ? format(customExtensionDate, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={customExtensionDate}
                          onSelect={setCustomExtensionDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={extendSubscriptions}>Extend Subscriptions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to all users in this subscription.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="notification-message" className="text-sm font-medium">
                Notification Message
              </label>
              <Textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your notification message here..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This notification will be visible to all users in their notification panel.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendNotificationToUsers} disabled={sendingNotification}>
              {sendingNotification ? (
                "Sending..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Options</DialogTitle>
            <DialogDescription>
              Choose an existing document or create a new one for this subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
                <TabsTrigger value="new">Create New</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="pt-4">
                <div className="grid gap-2">
                  <label htmlFor="document-select" className="text-sm font-medium">
                    Select Document
                  </label>
                  {loadingDocuments ? (
                    <div className="text-center py-4">Loading documents...</div>
                  ) : availableDocuments.length === 0 ? (
                    <div className="text-center py-4">No documents available</div>
                  ) : (
                    <Select onValueChange={(value) => setSelectedDocumentId(Number(value))}>
                      <SelectTrigger id="document-select">
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDocuments.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            {doc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="new" className="pt-4">
                <Button
                  onClick={() => {
                    setDocumentDialogOpen(false)
                    setCreateDocumentDialogOpen(true)
                  }}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" /> Create New Document
                </Button>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!selectedDocumentId}>
              <FileText className="mr-2 h-4 w-4" /> Assign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={createDocumentDialogOpen} onOpenChange={setCreateDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Create a new document for this subscription.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="doc-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="doc-title"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                placeholder="Document Title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="doc-url" className="text-sm font-medium">
                Document URL
              </label>
              <Input
                id="doc-url"
                value={newDocumentUrl}
                onChange={(e) => setNewDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="doc-category" className="text-sm font-medium">
                Category
              </label>
              <Select value={newDocumentCategory} onValueChange={setNewDocumentCategory}>
                <SelectTrigger id="doc-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="doc-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="doc-description"
                value={newDocumentDescription}
                onChange={(e) => setNewDocumentDescription(e.target.value)}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createAndAssignDocument} disabled={creatingDocument}>
              {creatingDocument ? "Creating..." : "Create Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single User Notification Dialog */}
      <Dialog open={singleUserNotificationDialogOpen} onOpenChange={setSingleUserNotificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification to User</DialogTitle>
            <DialogDescription>Send a notification to {currentUserForAction?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="single-notification-message" className="text-sm font-medium">
                Notification Message
              </label>
              <Textarea
                id="single-notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your notification message here..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This notification will be visible to all users in their notification panel.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleUserNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => currentUserForAction && sendNotificationToUser(currentUserForAction)}
              disabled={sendingNotification || !currentUserForAction}
            >
              {sendingNotification ? (
                "Sending..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single User Document Dialog */}
      <Dialog open={singleUserDocumentDialogOpen} onOpenChange={setSingleUserDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Options for User</DialogTitle>
            <DialogDescription>Choose a document to assign to {currentUserForAction?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
                <TabsTrigger value="new">Create New</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="pt-4">
                <div className="grid gap-2">
                  <label htmlFor="single-document-select" className="text-sm font-medium">
                    Select Document
                  </label>
                  {loadingDocuments ? (
                    <div className="text-center py-4">Loading documents...</div>
                  ) : availableDocuments.length === 0 ? (
                    <div className="text-center py-4">No documents available</div>
                  ) : (
                    <Select onValueChange={(value) => setSelectedDocumentId(Number(value))}>
                      <SelectTrigger id="single-document-select">
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDocuments.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            {doc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="new" className="pt-4">
                <Button
                  onClick={() => {
                    setSingleUserDocumentDialogOpen(false)
                    setCreateDocumentDialogOpen(true)
                  }}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" /> Create New Document
                </Button>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleUserDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!selectedDocumentId || !currentUserForAction}>
              <FileText className="mr-2 h-4 w-4" /> Assign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
