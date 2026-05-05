"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Trash2, Copy, Check, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface ReferralCode {
  id: number
  code: string
  discount_percentage: number
  subscription_id: number | null
  is_active: boolean
  usage_limit: number | null
  times_used: number
  valid_from: string
  expires_at: string | null
  notes: string | null
  applies_to_tickets?: boolean
  ticket_discount_percentage?: number | null
  subscription?: { name: string }
}

interface Subscription {
  id: number
  name: string
}

interface SubscriptionDiscount {
  subscriptionId: number
  discount: number
}

interface ReferralUser {
  id: number
  name: string
  email: string
  created_at: string
  subscriptions: Array<{
    is_active: boolean
    start_date: string
    end_date: string
    subscription: {
      name: string
      price: number
    }
  }>
}

export default function ReferralCodesAdmin() {
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [showDialog, setShowDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null) // Changed to track code string instead of single entry
  const [formData, setFormData] = useState({
    code: "",
    selectedSubscriptions: [] as number[],
    subscriptionDiscounts: {} as Record<number, number>,
    is_active: true,
    usage_limit: "",
    expires_at: "",
    notes: "",
    applies_to_tickets: false,
    ticket_discount: 10,
  })

  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkFormData, setBulkFormData] = useState({
    count: 5,
    selectedSubscriptions: [] as number[],
    subscriptionDiscounts: {} as Record<number, number>,
    is_active: true,
    usage_limit: "",
    expires_at: "",
    notes: "",
  })

  useEffect(() => {
    fetchCodes()
    fetchSubscriptions()
  }, [])

  const fetchCodes = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const subscriptionIds = data.filter((code) => code.subscription_id).map((code) => code.subscription_id)

        if (subscriptionIds.length > 0) {
          const { data: subs } = await supabase.from("subscriptions").select("id, name").in("id", subscriptionIds)

          const codesWithSubs = data.map((code) => ({
            ...code,
            subscription: code.subscription_id ? subs?.find((s) => s.id === code.subscription_id) : null,
          }))
          setCodes(codesWithSubs)
        } else {
          setCodes(data)
        }
      } else {
        setCodes(data || [])
      }
    } catch (error) {
      console.error("Error fetching codes:", error)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name").order("name")

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setFormData({ ...formData, code })
  }

  const handleSubscriptionToggle = (subscriptionId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        selectedSubscriptions: [...formData.selectedSubscriptions, subscriptionId],
        subscriptionDiscounts: {
          ...formData.subscriptionDiscounts,
          [subscriptionId]: 10, // Default discount
        },
      })
    } else {
      const newDiscounts = { ...formData.subscriptionDiscounts }
      delete newDiscounts[subscriptionId]
      setFormData({
        ...formData,
        selectedSubscriptions: formData.selectedSubscriptions.filter((id) => id !== subscriptionId),
        subscriptionDiscounts: newDiscounts,
      })
    }
  }

  const handleDiscountChange = (subscriptionId: number, discount: number) => {
    setFormData({
      ...formData,
      subscriptionDiscounts: {
        ...formData.subscriptionDiscounts,
        [subscriptionId]: discount,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.selectedSubscriptions.length === 0 && !formData.applies_to_tickets) {
      alert("Please select at least one subscription or enable tickets")
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (editingCode) {
        const { error: deleteError } = await supabase.from("referral_codes").delete().eq("code", editingCode)
        if (deleteError) throw deleteError
      }

      let payloads: any[] = []
      
      // If subscriptions selected, create entry for each
      if (formData.selectedSubscriptions.length > 0) {
        payloads = formData.selectedSubscriptions.map((subscriptionId) => ({
          code: formData.code.toUpperCase(),
          discount_percentage: formData.subscriptionDiscounts[subscriptionId],
          subscription_id: subscriptionId,
          is_active: formData.is_active,
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          expires_at: formData.expires_at || null,
          notes: formData.notes || null,
          applies_to_tickets: formData.applies_to_tickets,
          ticket_discount_percentage: formData.applies_to_tickets ? formData.ticket_discount : null,
        }))
      } else if (formData.applies_to_tickets) {
        // Tickets only - create one entry without subscription
        payloads = [{
          code: formData.code.toUpperCase(),
          discount_percentage: formData.ticket_discount, // Use ticket discount as main discount
          subscription_id: null,
          is_active: formData.is_active,
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          expires_at: formData.expires_at || null,
          notes: formData.notes || null,
          applies_to_tickets: true,
          ticket_discount_percentage: formData.ticket_discount,
        }]
      }

      const { error } = await supabase.from("referral_codes").insert(payloads)

      if (error) throw error

      setShowDialog(false)
      setEditingCode(null)
      setFormData({
        code: "",
        selectedSubscriptions: [],
        subscriptionDiscounts: {},
        is_active: true,
        usage_limit: "",
        expires_at: "",
        notes: "",
        applies_to_tickets: false,
        ticket_discount: 10,
      })
      fetchCodes()
    } catch (error: any) {
      console.error("Error saving code:", error)
      alert(error.message || "Failed to save referral code")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this referral code?")) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("referral_codes").delete().eq("id", id)

      if (error) throw error
      fetchCodes()
    } catch (error) {
      console.error("Error deleting code:", error)
      alert("Failed to delete referral code")
    }
  }

  const handleDeleteAllByCode = async (code: string) => {
    if (!confirm(`Delete ALL entries for code "${code}"?`)) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("referral_codes").delete().eq("code", code)

      if (error) throw error
      fetchCodes()
    } catch (error) {
      console.error("Error deleting codes:", error)
      alert("Failed to delete referral codes")
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("referral_codes").update({ is_active: !isActive }).eq("id", id)

      if (error) throw error
      fetchCodes()
    } catch (error) {
      console.error("Error toggling code:", error)
    }
  }

  const fetchCodeUsers = async (code: string) => {
    setLoadingUsers(true)
    setViewingCode(code)
    setShowRegistrationsDialog(true)

    try {
      const response = await fetch(`/api/referral-code-users?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setRegistrationUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching code users:", error)
      alert("Failed to fetch users for this code")
    } finally {
      setLoadingUsers(false)
    }
  }

  const groupedCodes = codes.reduce(
    (acc, code) => {
      if (!acc[code.code]) {
        acc[code.code] = []
      }
      acc[code.code].push(code)
      return acc
    },
    {} as Record<string, ReferralCode[]>,
  )

  const handleEdit = (code: string) => {
    const codeEntries = codes.filter((c) => c.code === code)
    if (codeEntries.length === 0) return

    const firstEntry = codeEntries[0]
    const selectedSubs = codeEntries.map((c) => c.subscription_id)
    const discounts: Record<number, number> = {}
    codeEntries.forEach((c) => {
      discounts[c.subscription_id] = c.discount_percentage
    })

    setEditingCode(code)
    setFormData({
      code: code,
      selectedSubscriptions: selectedSubs,
      subscriptionDiscounts: discounts,
      is_active: firstEntry.is_active,
      usage_limit: firstEntry.usage_limit?.toString() || "",
      expires_at: firstEntry.expires_at ? firstEntry.expires_at.split("T")[0] : "",
      notes: firstEntry.notes || "",
    })
    setShowDialog(true)
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (bulkFormData.selectedSubscriptions.length === 0) {
      alert("Please select at least one subscription")
      return
    }

    if (bulkFormData.count < 1 || bulkFormData.count > 100) {
      alert("Please enter a count between 1 and 100")
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const allPayloads = []

      // Generate multiple unique codes
      for (let i = 0; i < bulkFormData.count; i++) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let code = ""
        for (let j = 0; j < 8; j++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length))
        }

        // Create entries for each selected subscription
        bulkFormData.selectedSubscriptions.forEach((subscriptionId) => {
          allPayloads.push({
            code: code,
            discount_percentage: bulkFormData.subscriptionDiscounts[subscriptionId],
            subscription_id: subscriptionId,
            is_active: bulkFormData.is_active,
            usage_limit: bulkFormData.usage_limit ? Number(bulkFormData.usage_limit) : null,
            expires_at: bulkFormData.expires_at || null,
            notes: bulkFormData.notes || null,
          })
        })
      }

      const { error } = await supabase.from("referral_codes").insert(allPayloads)

      if (error) throw error

      alert(`Successfully created ${bulkFormData.count} referral codes!`)
      setShowBulkDialog(false)
      setBulkFormData({
        count: 5,
        selectedSubscriptions: [],
        subscriptionDiscounts: {},
        is_active: true,
        usage_limit: "",
        expires_at: "",
        notes: "",
      })
      fetchCodes()
    } catch (error: any) {
      console.error("Error creating bulk codes:", error)
      alert(error.message || "Failed to create bulk referral codes")
    } finally {
      setLoading(false)
    }
  }

  const [viewingCode, setViewingCode] = useState<string | null>(null)
  const [registrationUsers, setRegistrationUsers] = useState<ReferralUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Referral Codes</h1>
          <p className="text-muted-foreground">Create discount codes with different percentages per subscription</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">Bulk Create Codes</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Create Referral Codes</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of Codes to Generate</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkFormData.count}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, count: Number(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Codes will be auto-generated (max 100)</p>
                </div>

                <div className="space-y-3">
                  <Label>Select Subscriptions & Set Discounts</Label>
                  <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={bulkFormData.selectedSubscriptions.includes(sub.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkFormData({
                                ...bulkFormData,
                                selectedSubscriptions: [...bulkFormData.selectedSubscriptions, sub.id],
                                subscriptionDiscounts: { ...bulkFormData.subscriptionDiscounts, [sub.id]: 10 },
                              })
                            } else {
                              const newDiscounts = { ...bulkFormData.subscriptionDiscounts }
                              delete newDiscounts[sub.id]
                              setBulkFormData({
                                ...bulkFormData,
                                selectedSubscriptions: bulkFormData.selectedSubscriptions.filter((id) => id !== sub.id),
                                subscriptionDiscounts: newDiscounts,
                              })
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label className="font-medium">{sub.name}</Label>
                        </div>
                        {bulkFormData.selectedSubscriptions.includes(sub.id) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={bulkFormData.subscriptionDiscounts[sub.id] || 10}
                              onChange={(e) =>
                                setBulkFormData({
                                  ...bulkFormData,
                                  subscriptionDiscounts: {
                                    ...bulkFormData.subscriptionDiscounts,
                                    [sub.id]: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Usage Limit per Code (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bulkFormData.usage_limit}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="date"
                    value={bulkFormData.expires_at}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, expires_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={bulkFormData.notes}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, notes: e.target.value })}
                    placeholder="Internal notes"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={bulkFormData.is_active}
                    onCheckedChange={(checked) => setBulkFormData({ ...bulkFormData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : `Create ${bulkFormData.count} Codes`}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCode(null)
                  setFormData({
                    code: "",
                    selectedSubscriptions: [],
                    subscriptionDiscounts: {},
                    is_active: true,
                    usage_limit: "",
                    expires_at: "",
                    notes: "",
                    applies_to_tickets: false,
                    ticket_discount: 10,
                  })
                }}
              >
                Create Referral Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCode ? "Edit Referral Code" : "Create Referral Code"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                      required
                      disabled={!!editingCode} // Disable code editing when in edit mode
                    />
                    {!editingCode && (
                      <Button type="button" variant="outline" onClick={generateCode}>
                        Generate
                      </Button>
                    )}
                  </div>
                  {editingCode && <p className="text-xs text-muted-foreground">Code cannot be changed while editing</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Subscriptions & Set Discounts</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.selectedSubscriptions.length === subscriptions.length) {
                          // Deselect all
                          setFormData({ ...formData, selectedSubscriptions: [], subscriptionDiscounts: {} })
                        } else {
                          // Select all with default 10% discount
                          const allIds = subscriptions.map(s => s.id)
                          const discounts: Record<number, number> = {}
                          allIds.forEach(id => { discounts[id] = formData.subscriptionDiscounts[id] || 10 })
                          setFormData({ ...formData, selectedSubscriptions: allIds, subscriptionDiscounts: discounts })
                        }
                      }}
                    >
                      {formData.selectedSubscriptions.length === subscriptions.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {subscriptions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No subscriptions found</p>
                    )}
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={formData.selectedSubscriptions.includes(sub.id)}
                          onCheckedChange={(checked) => handleSubscriptionToggle(sub.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label className="font-medium">{sub.name}</Label>
                        </div>
                        {formData.selectedSubscriptions.includes(sub.id) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.subscriptionDiscounts[sub.id] || 10}
                              onChange={(e) => handleDiscountChange(sub.id, Number(e.target.value))}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.selectedSubscriptions.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.selectedSubscriptions.length} subscription(s) selected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Usage Limit (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes about this code"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                {/* Tickets Section */}
                <div className="space-y-3">
                  <Label>Event Tickets</Label>
                  <div className="border rounded-lg p-4 space-y-3 bg-emerald-50/50">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                      <Checkbox
                        checked={formData.applies_to_tickets}
                        onCheckedChange={(checked) => setFormData({ ...formData, applies_to_tickets: checked as boolean })}
                      />
                      <div className="flex-1">
                        <Label className="font-medium">All Event Tickets</Label>
                        <p className="text-xs text-muted-foreground">Apply this code to all event ticket bookings</p>
                      </div>
                      {formData.applies_to_tickets && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.ticket_discount}
                            onChange={(e) => setFormData({ ...formData, ticket_discount: Number(e.target.value) })}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : editingCode ? "Update Code" : "Create Code"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(groupedCodes).map(([code, codeEntries]) => (
          <Card key={code}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <span className="font-mono text-2xl">{code}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)} className="h-8 w-8 p-0">
                      {copiedCode === code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
<span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                      {codeEntries.length} subscription(s)
                                    </span>
                                    {codeEntries[0]?.applies_to_tickets && (
                                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                        Tickets
                                      </span>
                                    )}
                  </CardTitle>
                  <CardDescription>Total uses: {codeEntries.reduce((sum, c) => sum + c.times_used, 0)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(code)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fetchCodeUsers(code)}>
                    <Users className="h-4 w-4 mr-1" />
                    View Registrations
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAllByCode(code)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {codeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.subscription?.name || `Subscription ${entry.subscription_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.discount_percentage}% discount • Used {entry.times_used} times
                        {entry.usage_limit && ` / ${entry.usage_limit}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${entry.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {entry.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(entry.id, entry.is_active)}>
                        {entry.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {codeEntries[0]?.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes: {codeEntries[0].notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {codes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No referral codes created yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showRegistrationsDialog} onOpenChange={setShowRegistrationsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registrations for Code: <span className="font-mono">{viewingCode}</span>
            </DialogTitle>
          </DialogHeader>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : registrationUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No users have registered with this code yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-lg">{registrationUsers.length} Total Registrations</span>
                </div>
              </div>

              <div className="space-y-3">
                {registrationUsers.map((user) => (
                  <Card key={user.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{user.name}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                          {user.subscriptions.length} subscription(s)
                        </span>
                      </div>
                    </CardHeader>
                    {user.subscriptions.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {user.subscriptions.map((sub, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium">{sub.subscription?.name || "Unknown Plan"}</p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{sub.subscription?.price || 0} • {new Date(sub.start_date).toLocaleDateString()} -{" "}
                                  {new Date(sub.end_date).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  sub.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {sub.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
