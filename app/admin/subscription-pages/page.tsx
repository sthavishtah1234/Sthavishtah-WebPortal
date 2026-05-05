"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Eye, Trash2, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  introduction_title: string
  introduction_content: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

export default function SubscriptionPagesAdmin() {
  const [pages, setPages] = useState<SubscriptionPage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<SubscriptionPage | null>(null)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error } = await supabase
        .from("subscription_pages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error("Error fetching pages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!pageToDelete) return

    try {
      // Delete related records first
      await supabase.from("subscription_page_cards").delete().eq("page_id", pageToDelete.id)
      await supabase.from("subscription_page_sections").delete().eq("page_id", pageToDelete.id)
      await supabase.from("subscription_page_plans").delete().eq("page_id", pageToDelete.id)

      // Delete the page
      const { error } = await supabase.from("subscription_pages").delete().eq("id", pageToDelete.id)

      if (error) throw error

      setPages(pages.filter((p) => p.id !== pageToDelete.id))
      setDeleteDialogOpen(false)
      setPageToDelete(null)
    } catch (error) {
      console.error("Error deleting page:", error)
    }
  }

  const toggleStatus = async (page: SubscriptionPage) => {
    const supabase = getSupabaseBrowserClient()
    setTogglingStatus(page.id)

    try {
      const newStatus = page.status === "published" ? "draft" : "published"
      const { error } = await supabase
        .from("subscription_pages")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id)

      if (error) throw error

      setPages(pages.map((p) => (p.id === page.id ? { ...p, status: newStatus } : p)))
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setTogglingStatus(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading subscription pages...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subscription Pages</h1>
            <p className="text-gray-600">Manage subscription category detail pages</p>
          </div>
          <Link href="/admin/subscription-pages/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Create New Page
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {pages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-500 text-lg mb-4">No subscription pages found</div>
                <Link href="/admin/subscription-pages/create">
                  <Button>Create Your First Page</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{page.title}</CardTitle>
                        <Badge
                          variant={page.status === "published" ? "default" : "secondary"}
                          className={page.status === "published" ? "bg-green-600" : ""}
                        >
                          {page.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">{page.subtitle}</CardDescription>
                      <div className="text-sm text-gray-500 mt-2">
                        Slug:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">/subscription-categories/{page.slug}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Status Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {page.status === "published" ? "Published" : "Draft"}
                        </span>
                        <div className="relative">
                          {togglingStatus === page.id && (
                            <Loader2 className="h-4 w-4 animate-spin absolute -left-6 top-1" />
                          )}
                          <Switch
                            checked={page.status === "published"}
                            onCheckedChange={() => toggleStatus(page)}
                            disabled={togglingStatus === page.id}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </div>

                      {/* External Link */}
                      {page.status === "published" && (
                        <Link href={`/user/subscription-categories/${page.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Created: {new Date(page.created_at).toLocaleDateString()}
                      {page.updated_at !== page.created_at && (
                        <span className="ml-4">Updated: {new Date(page.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/subscription-pages/edit/${page.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/subscription-pages/preview/${page.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPageToDelete(page)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Subscription Page"
        description={`Are you sure you want to delete "${pageToDelete?.title}"? This will also delete all associated cards, sections, and plan links. This action cannot be undone.`}
      />
    </AdminLayout>
  )
}
