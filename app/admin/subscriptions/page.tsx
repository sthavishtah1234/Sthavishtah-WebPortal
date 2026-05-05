"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import {
  Pencil,
  Plus,
  Trash2,
  Users,
  Layers,
  Package,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  DollarSign,
  CalendarIcon,
  Gift,
  Wrench,
  Bug,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Edit,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import Link from "next/link"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  payment_link: string | null
  is_external_link: boolean
  created_at: string
  start_date?: string | null
  end_date?: string | null
  user_count?: number
  batch_count?: number
  is_active?: boolean
  is_default_for_new_users?: boolean
}

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

interface DebugInfo {
  id: string
  user_id: string
  subscription_name: string
  activation_date: string
  is_active: boolean
  current_days_used: number
  calculated_days_should_be: number
  duration_days: number
  days_difference: number
  is_expired: boolean
  should_be_active: boolean
}

export default function ManageSubscriptions() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [activeTab, setActiveTab] = useState("plans")

  // Free subscription state
  const [freeSubscription, setFreeSubscription] = useState<Subscription | null>(null)
  const [loadingFree, setLoadingFree] = useState(false)
  const [freeStartDate, setFreeStartDate] = useState<Date | undefined>(undefined)
  const [freeEndDate, setFreeEndDate] = useState<Date | undefined>(undefined)
  const [savingFree, setSavingFree] = useState(false)
  const [freeSuccess, setFreeSuccess] = useState<string | null>(null)
  const [freeError, setFreeError] = useState<string | null>(null)

  // Landing pages state
  const [landingPages, setLandingPages] = useState<SubscriptionPage[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<SubscriptionPage | null>(null)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  // Tools state
  const [debugData, setDebugData] = useState<any>(null)
  const [loadingDebug, setLoadingDebug] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalPlans: 0,
    activeUsers: 0,
    totalRevenue: 0,
    activePlans: 0,
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  useEffect(() => {
    if (activeTab === "free") {
      fetchFreeSubscription()
    } else if (activeTab === "pages") {
      fetchLandingPages()
    } else if (activeTab === "tools") {
      loadDebugData()
    }
  }, [activeTab])

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false })

      if (error) throw error

      const subscriptionsWithCounts = await Promise.all(
        (data || []).map(async (subscription) => {
          const { count: userCount } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)

          const { count: batchCount } = await supabase
            .from("subscription_batches")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)

          return {
            ...subscription,
            user_count: userCount || 0,
            batch_count: batchCount || 0,
          }
        }),
      )

      setSubscriptions(subscriptionsWithCounts)

      // Calculate stats
      const totalPlans = subscriptionsWithCounts.length
      const activeUsers = subscriptionsWithCounts.reduce((sum, s) => sum + (s.user_count || 0), 0)
      const totalRevenue = subscriptionsWithCounts.reduce((sum, s) => sum + s.price * (s.user_count || 0), 0)
      const activePlans = subscriptionsWithCounts.filter((s) => s.is_active).length

      setStats({ totalPlans, activeUsers, totalRevenue, activePlans })
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFreeSubscription() {
    try {
      setLoadingFree(true)
      setFreeError(null)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("price", 0)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        const response = await fetch("/api/create-free-subscription")
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to create free subscription")
        }

        const { data: newData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", result.id)
          .single()

        setFreeSubscription(newData)
        if (newData?.start_date) setFreeStartDate(new Date(newData.start_date))
        if (newData?.end_date) setFreeEndDate(new Date(newData.end_date))
      } else {
        // Get user count
        const { count } = await supabase
          .from("user_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("subscription_id", data.id)
          .eq("is_active", true)

        setFreeSubscription({ ...data, user_count: count || 0 })
        if (data.start_date) setFreeStartDate(new Date(data.start_date))
        if (data.end_date) setFreeEndDate(new Date(data.end_date))
      }
    } catch (error) {
      console.error("Error fetching free subscription:", error)
      setFreeError(error instanceof Error ? error.message : "Failed to load free subscription")
    } finally {
      setLoadingFree(false)
    }
  }

  async function saveFreeSubscription() {
    if (!freeSubscription || !freeStartDate || !freeEndDate) return

    try {
      setSavingFree(true)
      setFreeError(null)
      setFreeSuccess(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscriptions")
        .update({
          start_date: freeStartDate.toISOString(),
          end_date: freeEndDate.toISOString(),
          duration_days: Math.ceil((freeEndDate.getTime() - freeStartDate.getTime()) / (1000 * 60 * 60 * 24)),
        })
        .eq("id", freeSubscription.id)

      if (error) throw error

      setFreeSuccess("Free subscription updated successfully")
      fetchFreeSubscription()
    } catch (error) {
      console.error("Error updating free subscription:", error)
      setFreeError(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setSavingFree(false)
    }
  }

  async function fetchLandingPages() {
    try {
      setLoadingPages(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("subscription_pages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setLandingPages(data || [])
    } catch (error) {
      console.error("Error fetching pages:", error)
    } finally {
      setLoadingPages(false)
    }
  }

  async function togglePageStatus(page: SubscriptionPage) {
    const supabase = getSupabaseBrowserClient()
    setTogglingStatus(page.id)

    try {
      const newStatus = page.status === "published" ? "draft" : "published"
      const { error } = await supabase
        .from("subscription_pages")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", page.id)

      if (error) throw error

      setLandingPages(landingPages.map((p) => (p.id === page.id ? { ...p, status: newStatus } : p)))
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setTogglingStatus(null)
    }
  }

  async function handleDeletePage() {
    const supabase = getSupabaseBrowserClient()
    if (!pageToDelete) return

    try {
      await supabase.from("subscription_page_cards").delete().eq("page_id", pageToDelete.id)
      await supabase.from("subscription_page_sections").delete().eq("page_id", pageToDelete.id)
      await supabase.from("subscription_page_plans").delete().eq("page_id", pageToDelete.id)

      const { error } = await supabase.from("subscription_pages").delete().eq("id", pageToDelete.id)

      if (error) throw error

      setLandingPages(landingPages.filter((p) => p.id !== pageToDelete.id))
      setDeleteDialogOpen(false)
      setPageToDelete(null)
    } catch (error) {
      console.error("Error deleting page:", error)
    }
  }

  async function loadDebugData() {
    setLoadingDebug(true)
    setToolsError(null)

    try {
      const response = await fetch("/api/debug-subscription-days")
      const data = await response.json()

      if (data.success) {
        setDebugData(data)
      } else {
        setToolsError(data.error || "Failed to load debug data")
      }
    } catch (err) {
      setToolsError("Network error occurred")
    } finally {
      setLoadingDebug(false)
    }
  }

  async function fixAllSubscriptions() {
    setFixing(true)
    setToolsError(null)

    try {
      const response = await fetch("/api/debug-subscription-days", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        await loadDebugData()
        alert(`Successfully fixed ${data.updates?.length || 0} subscriptions!`)
      } else {
        setToolsError(data.error || "Failed to fix subscriptions")
      }
    } catch (err) {
      setToolsError("Network error occurred")
    } finally {
      setFixing(false)
    }
  }

  async function forceUpdateDays() {
    setFixing(true)
    setToolsError(null)

    try {
      const response = await fetch("/api/force-update-subscription-days", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert(`Updated ${data.updated || 0} subscriptions, expired ${data.expired || 0}`)
        await loadDebugData()
      } else {
        setToolsError(data.error || "Failed to update")
      }
    } catch (err) {
      setToolsError("Network error occurred")
    } finally {
      setFixing(false)
    }
  }

  async function toggleSubscriptionActivation(id: number, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this subscription plan?`))
      return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("subscriptions").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      fetchSubscriptions()
    } catch (error) {
      console.error("Error toggling subscription activation:", error)
      alert("Failed to update subscription status. Please try again.")
    }
  }

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) return

    try {
      setIsDeleting(true)
      const supabase = getSupabaseBrowserClient()

      const { count: courseCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      const { count: userCount } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      const { count: paymentCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if ((courseCount && courseCount > 0) || (userCount && userCount > 0) || (paymentCount && paymentCount > 0)) {
        const parts = []
        if (courseCount && courseCount > 0) parts.push(`${courseCount} courses`)
        if (userCount && userCount > 0) parts.push(`${userCount} users`)
        if (paymentCount && paymentCount > 0) parts.push(`${paymentCount} payments`)

        if (!confirm(`This subscription has ${parts.join(", ")}. Delete anyway?`)) {
          setIsDeleting(false)
          return
        }
      }

      if (paymentCount && paymentCount > 0) {
        await supabase.from("payments").update({ subscription_id: null }).eq("subscription_id", id)
      }

      if (userCount && userCount > 0) {
        await supabase.from("user_subscriptions").delete().eq("subscription_id", id)
      }

      if (courseCount && courseCount > 0) {
        await supabase.from("courses").update({ subscription_id: null }).eq("subscription_id", id)
      }

      await supabase.from("subscription_batches").delete().eq("subscription_id", id)

      const { error } = await supabase.from("subscriptions").delete().eq("id", id)

      if (error) throw error

      alert("Subscription deleted successfully.")
      fetchSubscriptions()
    } catch (error) {
      console.error("Error deleting subscription:", error)
      alert("Error deleting subscription")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && sub.is_active) ||
      (statusFilter === "inactive" && !sub.is_active)

    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage plans, users, landing pages, and tools</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => router.push("/admin/subscriptions/create")}>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{stats.totalPlans}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-green-100 p-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-amber-100 p-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-purple-100 p-3">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{stats.activePlans}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="plans" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">All Plans</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Free Plan</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Landing Pages</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* ALL PLANS TAB */}
          <TabsContent value="plans" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{subscription.name}</CardTitle>
                        <Badge variant="outline" className="border-white text-white">
                          {subscription.user_count} Users
                        </Badge>
                      </div>
                      <CardDescription className="text-white/90">
                        ₹{subscription.price.toFixed(2)} for {subscription.duration_days} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-semibold">
                          ₹{(subscription.price * (subscription.user_count || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Batches</span>
                        <Badge variant="outline">{subscription.batch_count || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={subscription.is_active || false}
                            onCheckedChange={() =>
                              toggleSubscriptionActivation(subscription.id, subscription.is_active || false)
                            }
                          />
                          <span className="text-sm">{subscription.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t bg-muted/50 p-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/subscriptions/view/${subscription.id}`)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Batches</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium">{subscription.name}</TableCell>
                          <TableCell>₹{subscription.price.toFixed(2)}</TableCell>
                          <TableCell>{subscription.duration_days} days</TableCell>
                          <TableCell>
                            <Badge variant="outline">{subscription.user_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{subscription.batch_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={subscription.is_active || false}
                              onCheckedChange={() =>
                                toggleSubscriptionActivation(subscription.id, subscription.is_active || false)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/subscriptions/view/${subscription.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/subscriptions/edit/${subscription.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FREE PLAN TAB */}
          <TabsContent value="free" className="space-y-4">
            {loadingFree ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : freeSubscription ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      {freeSubscription.name}
                    </CardTitle>
                    <CardDescription>Manage your free subscription plan settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {freeError && (
                      <Alert variant="destructive">
                        <AlertDescription>{freeError}</AlertDescription>
                      </Alert>
                    )}
                    {freeSuccess && (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">{freeSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {freeStartDate ? format(freeStartDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={freeStartDate} onSelect={setFreeStartDate} />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {freeEndDate ? format(freeEndDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={freeEndDate} onSelect={setFreeEndDate} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <Button onClick={saveFreeSubscription} disabled={savingFree} className="w-full">
                      {savingFree ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Free Plan Stats</CardTitle>
                    <CardDescription>Overview of your free subscription</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{freeSubscription.user_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{freeSubscription.duration_days}</p>
                        <p className="text-sm text-muted-foreground">Duration (days)</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/admin/subscriptions/users/${freeSubscription.id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" /> View Users
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/admin/subscriptions/batches/${freeSubscription.id}`)}
                      >
                        <Layers className="mr-2 h-4 w-4" /> Batches
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No free subscription found</p>
                  <Button className="mt-4" onClick={fetchFreeSubscription}>
                    Create Free Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* LANDING PAGES TAB */}
          <TabsContent value="pages" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Manage subscription category detail pages</p>
              <Link href="/admin/subscription-pages/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Page
                </Button>
              </Link>
            </div>

            {loadingPages ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : landingPages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No landing pages found</p>
                  <Link href="/admin/subscription-pages/create">
                    <Button className="mt-4">Create Your First Page</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {landingPages.map((page) => (
                  <Card key={page.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{page.title}</CardTitle>
                            <Badge variant={page.status === "published" ? "default" : "secondary"}>
                              {page.status}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">{page.subtitle}</CardDescription>
                          <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs">
                            /subscription-categories/{page.slug}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          {togglingStatus === page.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Switch
                            checked={page.status === "published"}
                            onCheckedChange={() => togglePageStatus(page)}
                            disabled={togglingStatus === page.id}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Created: {new Date(page.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Link href={`/admin/subscription-pages/edit/${page.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-1 h-4 w-4" /> Edit
                            </Button>
                          </Link>
                          <Link href={`/admin/subscription-pages/preview/${page.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-4 w-4" /> Preview
                            </Button>
                          </Link>
                          {page.status === "published" && (
                            <Link href={`/user/subscription-categories/${page.slug}`} target="_blank">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPageToDelete(page)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TOOLS TAB */}
          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Subscription Day Counter
                </CardTitle>
                <CardDescription>Check and fix subscription day counting issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {toolsError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{toolsError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={loadDebugData} disabled={loadingDebug || fixing} variant="outline">
                    <RefreshCw className={cn("mr-2 h-4 w-4", loadingDebug && "animate-spin")} />
                    Refresh Debug Data
                  </Button>
                  <Button onClick={fixAllSubscriptions} disabled={loadingDebug || fixing} variant="outline">
                    <CheckCircle className={cn("mr-2 h-4 w-4", fixing && "animate-spin")} />
                    Fix Day Counts
                  </Button>
                  <Button onClick={forceUpdateDays} disabled={loadingDebug || fixing}>
                    <Wrench className={cn("mr-2 h-4 w-4", fixing && "animate-spin")} />
                    Force Update All Days
                  </Button>
                </div>

                {loadingDebug ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : debugData ? (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{debugData.total_subscriptions}</p>
                      <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {debugData.debug_info?.filter((d: DebugInfo) => d.days_difference === 0).length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Correct Count</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {debugData.debug_info?.filter((d: DebugInfo) => d.days_difference !== 0).length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Incorrect Count</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {debugData.debug_info?.filter((d: DebugInfo) => d.is_active !== d.should_be_active).length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Wrong Status</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How Day Counting Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Formula:</strong> Days Used = (Today - Activation Date) + 1
                </p>
                <p>
                  <strong>Example:</strong> If activated on Jan 1st and today is Jan 4th: (Jan 4 - Jan 1) + 1 = 4 days
                  used
                </p>
                <p>
                  <strong>Status:</strong> Active if days used &lt; duration, Inactive if days used &ge; duration
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeletePage}
        title="Delete Subscription Page"
        description={`Are you sure you want to delete "${pageToDelete?.title}"? This will also delete all associated content.`}
      />
    </AdminLayout>
  )
}
