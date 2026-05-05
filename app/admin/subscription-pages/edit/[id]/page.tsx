"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Save, Plus, Trash2, ExternalLink, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  introduction_title: string
  introduction_content: string
  status: "draft" | "published"
}

interface InfoCard {
  id: string
  card_type: string
  title: string
  value: string
  icon: string
  display_order: number
}

interface ContentSection {
  id: string
  title: string
  content: string
  display_order: number
}

interface LinkedPlan {
  id: string
  subscription_id: string
  display_order: number
  subscriptions: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
  }
}

interface Subscription {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
}

interface ComparisonFeature {
  id: string
  feature_name: string
  feature_description: string | null
  display_order: number
}

interface ComparisonValue {
  id: string
  feature_id: string
  subscription_plan_id: string
  is_included: boolean
  custom_value: string | null
}

export default function EditSubscriptionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState<SubscriptionPage | null>(null)
  const [infoCards, setInfoCards] = useState<InfoCard[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [linkedPlans, setLinkedPlans] = useState<LinkedPlan[]>([])
  const [availableSubscriptions, setAvailableSubscriptions] = useState<Subscription[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [comparisonFeatures, setComparisonFeatures] = useState<ComparisonFeature[]>([])
  const [comparisonValues, setComparisonValues] = useState<ComparisonValue[]>([])

  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false)

  const [newCard, setNewCard] = useState({ title: "", value: "", icon: "star", card_type: "info" })
  const [newSection, setNewSection] = useState({ title: "", content: "" })
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [newFeature, setNewFeature] = useState({ feature_name: "", feature_description: "" })

  useEffect(() => {
    fetchPageData()
    fetchAvailableSubscriptions()
  }, [params.id])

  const fetchPageData = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { data: pageData, error: pageError } = await supabase
        .from("subscription_pages")
        .select("*")
        .eq("id", params.id)
        .single()

      if (pageError) throw pageError
      setPage(pageData)

      const { data: cardsData, error: cardsError } = await supabase
        .from("subscription_page_cards")
        .select("*")
        .eq("page_id", params.id)
        .order("display_order")

      if (cardsError) throw cardsError
      setInfoCards(cardsData || [])

      const { data: sectionsData, error: sectionsError } = await supabase
        .from("subscription_page_sections")
        .select("*")
        .eq("page_id", params.id)
        .order("display_order")

      if (sectionsError) throw sectionsError
      setContentSections(sectionsData || [])

      const { data: plansData, error: plansError } = await supabase
        .from("subscription_page_plans")
        .select(`
          id,
          subscription_id,
          display_order,
          subscriptions (
            id,
            name,
            description,
            price,
            duration_days
          )
        `)
        .eq("page_id", params.id)
        .order("display_order")

      if (plansError) throw plansError
      setLinkedPlans(plansData || [])

      const { data: featuresData, error: featuresError } = await supabase
        .from("plan_comparison_features")
        .select("*")
        .eq("subscription_page_id", params.id)
        .order("display_order")

      if (featuresError) console.error("Error fetching features:", featuresError)
      setComparisonFeatures(featuresData || [])

      if (featuresData && featuresData.length > 0) {
        const { data: valuesData, error: valuesError } = await supabase
          .from("plan_comparison_values")
          .select("*")
          .in(
            "feature_id",
            featuresData.map((f) => f.id),
          )

        if (valuesError) console.error("Error fetching values:", valuesError)
        setComparisonValues(valuesData || [])
      }
    } catch (error) {
      console.error("Error fetching page data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSubscriptions = async () => {
    setLoadingSubscriptions(true)
    setSubscriptionError(null)
    const supabase = getSupabaseBrowserClient()

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, name, description, price, duration_days")
        .order("name")

      if (error) throw error

      console.log("Available subscriptions:", data)

      if (!data || data.length === 0) {
        setSubscriptionError("No subscriptions found in the database. Please create subscriptions first.")
      }

      setAvailableSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setSubscriptionError("Failed to load subscriptions. Please try again.")
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  const handleSavePage = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!page) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("subscription_pages")
        .update({
          slug: page.slug,
          title: page.title,
          subtitle: page.subtitle,
          hero_image_url: page.hero_image_url,
          introduction_title: page.introduction_title,
          introduction_content: page.introduction_content,
          status: page.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      alert("Page saved successfully!")
    } catch (error) {
      console.error("Error saving page:", error)
      alert("Error saving page. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddCard = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("subscription_page_cards").insert({
        page_id: params.id,
        title: newCard.title,
        value: newCard.value,
        icon: newCard.icon,
        card_type: newCard.card_type,
        display_order: infoCards.length + 1,
      })

      if (error) throw error

      setNewCard({ title: "", value: "", icon: "star", card_type: "info" })
      setCardDialogOpen(false)
      fetchPageData()
    } catch (error) {
      console.error("Error adding card:", error)
      alert("Error adding card. Please try again.")
    }
  }

  const handleAddSection = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("subscription_page_sections").insert({
        page_id: params.id,
        title: newSection.title,
        content: newSection.content,
        display_order: contentSections.length + 1,
      })

      if (error) throw error

      setNewSection({ title: "", content: "" })
      setSectionDialogOpen(false)
      fetchPageData()
    } catch (error) {
      console.error("Error adding section:", error)
      alert("Error adding section. Please try again.")
    }
  }

  const handleLinkPlan = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!selectedPlanId) return

    try {
      const { error } = await supabase.from("subscription_page_plans").insert({
        page_id: params.id,
        subscription_id: selectedPlanId,
        display_order: linkedPlans.length + 1,
      })

      if (error) throw error

      setSelectedPlanId("")
      setPlanDialogOpen(false)
      fetchPageData()
    } catch (error) {
      console.error("Error linking plan:", error)
      alert("Error linking plan. Please try again.")
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("subscription_page_cards").delete().eq("id", cardId)

      if (error) throw error
      fetchPageData()
    } catch (error) {
      console.error("Error deleting card:", error)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("subscription_page_sections").delete().eq("id", sectionId)

      if (error) throw error
      fetchPageData()
    } catch (error) {
      console.error("Error deleting section:", error)
    }
  }

  const handleUnlinkPlan = async (linkId: string) => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("subscription_page_plans").delete().eq("id", linkId)

      if (error) throw error
      fetchPageData()
    } catch (error) {
      console.error("Error unlinking plan:", error)
    }
  }

  const handleAddFeature = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error } = await supabase
        .from("plan_comparison_features")
        .insert({
          subscription_page_id: params.id,
          feature_name: newFeature.feature_name,
          feature_description: newFeature.feature_description || null,
          display_order: comparisonFeatures.length + 1,
        })
        .select()
        .single()

      if (error) throw error

      if (linkedPlans.length > 0) {
        const defaultValues = linkedPlans.map((plan) => ({
          feature_id: data.id,
          subscription_plan_id: plan.subscription_id,
          is_included: false,
          custom_value: null,
        }))

        await supabase.from("plan_comparison_values").insert(defaultValues)
      }

      setNewFeature({ feature_name: "", feature_description: "" })
      setFeatureDialogOpen(false)
      fetchPageData()
    } catch (error) {
      console.error("Error adding feature:", error)
      alert("Error adding feature. Please try again.")
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm("Are you sure you want to delete this comparison feature?")) return

    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.from("plan_comparison_features").delete().eq("id", featureId)

      if (error) throw error
      fetchPageData()
    } catch (error) {
      console.error("Error deleting feature:", error)
    }
  }

  const handleToggleFeatureValue = async (featureId: string, subscriptionPlanId: string, currentValue: boolean) => {
    const supabase = getSupabaseBrowserClient()
    try {
      const existingValue = comparisonValues.find(
        (v) => v.feature_id === featureId && v.subscription_plan_id === subscriptionPlanId,
      )

      if (existingValue) {
        const { error } = await supabase
          .from("plan_comparison_values")
          .update({ is_included: !currentValue })
          .eq("id", existingValue.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("plan_comparison_values").insert({
          feature_id: featureId,
          subscription_plan_id: subscriptionPlanId,
          is_included: true,
          custom_value: null,
        })

        if (error) throw error
      }

      fetchPageData()
    } catch (error) {
      console.error("Error toggling feature value:", error)
    }
  }

  const getFeatureValue = (featureId: string, subscriptionPlanId: string) => {
    return comparisonValues.find((v) => v.feature_id === featureId && v.subscription_plan_id === subscriptionPlanId)
  }

  const alreadyLinkedIds = linkedPlans.map((plan) => plan.subscription_id)
  const unlinkedSubscriptions = availableSubscriptions.filter((sub) => !alreadyLinkedIds.includes(sub.id))

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading page data...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!page) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
          <Link href="/admin/subscription-pages">
            <Button>Back to Pages</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/subscription-pages">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pages
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit: {page.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={page.status === "published" ? "default" : "secondary"}>{page.status}</Badge>
                <span className="text-sm text-gray-500">/subscription-categories/{page.slug}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {page.status === "published" && (
              <Link href={`/user/subscription-categories/${page.slug}`} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live Page
                </Button>
              </Link>
            )}
            <Button onClick={handleSavePage} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="cards">Info Cards ({infoCards.length})</TabsTrigger>
            <TabsTrigger value="sections">Content Sections ({contentSections.length})</TabsTrigger>
            <TabsTrigger value="plans">Linked Plans ({linkedPlans.length})</TabsTrigger>
            <TabsTrigger value="comparison">Plan Comparison ({comparisonFeatures.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input
                      id="title"
                      value={page.title || ""}
                      onChange={(e) => setPage({ ...page, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={page.slug || ""}
                      onChange={(e) => setPage({ ...page, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={page.subtitle || ""}
                    onChange={(e) => setPage({ ...page, subtitle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">Hero Image URL</Label>
                  <Input
                    id="hero_image_url"
                    value={page.hero_image_url || ""}
                    onChange={(e) => setPage({ ...page, hero_image_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={page.status}
                    onValueChange={(value: "draft" | "published") => setPage({ ...page, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="introduction_title">Introduction Title</Label>
                  <Input
                    id="introduction_title"
                    value={page.introduction_title || ""}
                    onChange={(e) => setPage({ ...page, introduction_title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="introduction_content">Introduction Content</Label>
                  <Textarea
                    id="introduction_content"
                    value={page.introduction_content || ""}
                    onChange={(e) => setPage({ ...page, introduction_content: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Info Cards</CardTitle>
                    <CardDescription>Small information cards displayed below the hero section</CardDescription>
                  </div>
                  <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Card
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Info Card</DialogTitle>
                        <DialogDescription>Create a new information card for this page</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-title">Title</Label>
                          <Input
                            id="card-title"
                            value={newCard.title}
                            onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                            placeholder="e.g., Students Enrolled"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-value">Value</Label>
                          <Input
                            id="card-value"
                            value={newCard.value}
                            onChange={(e) => setNewCard({ ...newCard, value: e.target.value })}
                            placeholder="e.g., 1000+"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-icon">Icon</Label>
                          <Select
                            value={newCard.icon}
                            onValueChange={(value) => setNewCard({ ...newCard, icon: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="users">Users</SelectItem>
                              <SelectItem value="star">Star</SelectItem>
                              <SelectItem value="clock">Clock</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCardDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddCard} disabled={!newCard.title || !newCard.value}>
                          Add Card
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {infoCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No info cards yet. Add your first card to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {infoCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{card.icon}</div>
                          <div>
                            <div className="font-medium">{card.title}</div>
                            <div className="text-sm text-gray-600">{card.value}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteCard(card.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Content Sections</CardTitle>
                    <CardDescription>Expandable content sections with detailed information</CardDescription>
                  </div>
                  <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Content Section</DialogTitle>
                        <DialogDescription>Create a new expandable content section</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="section-title">Title</Label>
                          <Input
                            id="section-title"
                            value={newSection.title}
                            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                            placeholder="e.g., What You'll Learn"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section-content">Content</Label>
                          <Textarea
                            id="section-content"
                            value={newSection.content}
                            onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                            placeholder="Detailed content for this section..."
                            rows={6}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddSection} disabled={!newSection.title || !newSection.content}>
                          Add Section
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {contentSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No content sections yet. Add your first section to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contentSections.map((section) => (
                      <div key={section.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{section.title}</h4>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">{section.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Linked Subscription Plans</CardTitle>
                    <CardDescription>Subscription plans that will be displayed on this page</CardDescription>
                  </div>
                  <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Link Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Subscription Plan</DialogTitle>
                        <DialogDescription>Choose a subscription plan to display on this page</DialogDescription>
                      </DialogHeader>

                      {subscriptionError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{subscriptionError}</AlertDescription>
                        </Alert>
                      )}

                      {loadingSubscriptions ? (
                        <div className="py-4 text-center">Loading subscriptions...</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="plan-select">Select Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a subscription plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {unlinkedSubscriptions.length === 0 ? (
                                  <SelectItem value="no-plans" disabled>
                                    No available plans to link
                                  </SelectItem>
                                ) : (
                                  unlinkedSubscriptions.map((subscription) => (
                                    <SelectItem key={subscription.id} value={subscription.id}>
                                      {subscription.name} - ₹{subscription.price}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {unlinkedSubscriptions.length === 0 && availableSubscriptions.length > 0 && (
                            <div className="text-amber-600 text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              All available subscriptions are already linked to this page.
                            </div>
                          )}

                          {availableSubscriptions.length === 0 && !subscriptionError && (
                            <div className="text-amber-600 text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              No subscriptions found. Please create subscriptions first.
                            </div>
                          )}

                          <div className="text-sm text-gray-500">
                            <Link
                              href="/admin/subscriptions/create"
                              target="_blank"
                              className="text-blue-600 hover:underline"
                            >
                              Create new subscription
                            </Link>
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleLinkPlan} disabled={!selectedPlanId || selectedPlanId === "no-plans"}>
                          Link Plan
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {linkedPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No plans linked yet. Link your first plan to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {linkedPlans.map((linkedPlan) => (
                      <div key={linkedPlan.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{linkedPlan.subscriptions.name}</div>
                          <div className="text-sm text-gray-600">{linkedPlan.subscriptions.description}</div>
                          <div className="text-sm text-green-600 font-medium">
                            ₹{linkedPlan.subscriptions.price} • {linkedPlan.subscriptions.duration_days} days
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleUnlinkPlan(linkedPlan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Plan Comparison Features</CardTitle>
                    <CardDescription>Manage features that will be compared across subscription plans</CardDescription>
                  </div>
                  <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Feature
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Comparison Feature</DialogTitle>
                        <DialogDescription>Create a new feature to compare across plans</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="feature-name">Feature Name</Label>
                          <Input
                            id="feature-name"
                            value={newFeature.feature_name}
                            onChange={(e) => setNewFeature({ ...newFeature, feature_name: e.target.value })}
                            placeholder="e.g., AI Analysis, HD Videos"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feature-description">Description (Optional)</Label>
                          <Textarea
                            id="feature-description"
                            value={newFeature.feature_description}
                            onChange={(e) => setNewFeature({ ...newFeature, feature_description: e.target.value })}
                            placeholder="Brief description of this feature"
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddFeature} disabled={!newFeature.feature_name}>
                          Add Feature
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {linkedPlans.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please link subscription plans first before adding comparison features.
                    </AlertDescription>
                  </Alert>
                ) : comparisonFeatures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No comparison features yet. Add your first feature to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {comparisonFeatures.map((feature) => (
                      <Card key={feature.id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{feature.feature_name}</CardTitle>
                              {feature.feature_description && (
                                <CardDescription className="text-sm mt-1">
                                  {feature.feature_description}
                                </CardDescription>
                              )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteFeature(feature.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Select which plans include this feature:
                            </div>
                            {linkedPlans.map((plan) => {
                              const value = getFeatureValue(feature.id, plan.subscription_id)
                              return (
                                <div
                                  key={plan.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{plan.subscriptions.name}</div>
                                    <div className="text-xs text-gray-500">
                                      ₹{plan.subscriptions.price} • {plan.subscriptions.duration_days} days
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {value?.is_included ? "Included" : "Not Included"}
                                    </span>
                                    <Switch
                                      checked={value?.is_included || false}
                                      onCheckedChange={() =>
                                        handleToggleFeatureValue(
                                          feature.id,
                                          plan.subscription_id,
                                          value?.is_included || false,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
