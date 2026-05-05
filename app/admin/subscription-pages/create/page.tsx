"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Info } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function CreateSubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    subtitle: "",
    hero_image_url: "",
    introduction_title: "",
    introduction_content: "",
    status: "draft" as "draft" | "published",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Check if slug already exists
      const { data: existingPage } = await supabase
        .from("subscription_pages")
        .select("id")
        .eq("slug", formData.slug)
        .single()

      if (existingPage) {
        alert("A page with this slug already exists. Please choose a different slug.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("subscription_pages").insert([formData]).select().single()

      if (error) throw error

      router.push(`/admin/subscription-pages/edit/${data.id}`)
    } catch (error) {
      console.error("Error creating page:", error)
      alert("Error creating page. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }))
  }

  const handleSlugChange = (slug: string) => {
    // Auto-format slug as user types
    const formattedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    setFormData((prev) => ({ ...prev, slug: formattedSlug }))
  }

  // Slug examples for different categories
  const slugExamples = [
    { category: "Yoga Programs", slug: "yoga-programs", url: "/subscription-categories/yoga-programs" },
    { category: "Meditation Classes", slug: "meditation-classes", url: "/subscription-categories/meditation-classes" },
    { category: "Wellness Coaching", slug: "wellness-coaching", url: "/subscription-categories/wellness-coaching" },
    { category: "Pranayama Sessions", slug: "pranayama-sessions", url: "/subscription-categories/pranayama-sessions" },
    {
      category: "Ayurveda Consultation",
      slug: "ayurveda-consultation",
      url: "/subscription-categories/ayurveda-consultation",
    },
    { category: "Spiritual Guidance", slug: "spiritual-guidance", url: "/subscription-categories/spiritual-guidance" },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/subscription-pages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pages
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Subscription Page</h1>
            <p className="text-gray-600">Create a new subscription category detail page</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set up the basic details for your subscription page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Yoga Programs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., yoga-programs"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Final URL:{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      /subscription-categories/{formData.slug || "your-slug"}
                    </code>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g., Mindful practices for inner peace"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_image_url">Hero Image URL</Label>
                <Input
                  id="hero_image_url"
                  value={formData.hero_image_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                  placeholder="https://example.com/hero-image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published") => setFormData((prev) => ({ ...prev, status: value }))}
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
            </CardContent>
          </Card>

          {/* URL Slug Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                URL Slug Examples
              </CardTitle>
              <CardDescription>
                Good URL slugs are short, descriptive, and SEO-friendly. Here are some examples:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slugExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">{example.category}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Slug: <code className="bg-white px-1 rounded">{example.slug}</code>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">{example.url}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm text-blue-800 mb-2">Slug Best Practices:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Use lowercase letters only</li>
                  <li>• Replace spaces with hyphens (-)</li>
                  <li>• Remove special characters and numbers</li>
                  <li>• Keep it short and descriptive</li>
                  <li>• Make it SEO-friendly</li>
                  <li>• Ensure it's unique</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Introduction Section</CardTitle>
              <CardDescription>Content that appears below the hero section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="introduction_title">Introduction Title</Label>
                <Input
                  id="introduction_title"
                  value={formData.introduction_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, introduction_title: e.target.value }))}
                  placeholder="e.g., Transform Your Life with Yoga"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="introduction_content">Introduction Content</Label>
                <Textarea
                  id="introduction_content"
                  value={formData.introduction_content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, introduction_content: e.target.value }))}
                  placeholder="Describe what this program offers..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/admin/subscription-pages">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
