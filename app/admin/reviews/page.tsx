"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, AlertCircle, CheckCircle, Trash2, Edit, Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Review {
  id: number
  user_id: number | null
  name: string
  avatar_url: string | null
  rating: number
  review_text: string
  is_published: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New review form state
  const [newReviewName, setNewReviewName] = useState("")
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewText, setNewReviewText] = useState("")
  const [newReviewFeatured, setNewReviewFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit review state
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editName, setEditName] = useState("")
  const [editRating, setEditRating] = useState(5)
  const [editText, setEditText] = useState("")
  const [editFeatured, setEditFeatured] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Filter state
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "pending">("all")

  useEffect(() => {
    fetchReviews()
  }, [filterStatus])

  async function fetchReviews() {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClient()

      let query = supabase.from("reviews").select("*").order("created_at", { ascending: false })

      if (filterStatus === "published") {
        query = query.eq("is_published", true)
      } else if (filterStatus === "pending") {
        query = query.eq("is_published", false)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setError("Failed to load reviews. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault()

    // Reset states
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!newReviewName.trim()) {
        setError("Please enter a name")
        setIsSubmitting(false)
        return
      }

      if (!newReviewText.trim()) {
        setError("Please enter a review")
        setIsSubmitting(false)
        return
      }

      const supabase = getSupabaseBrowserClient()

      // Submit the review
      const { error: submitError } = await supabase.from("reviews").insert({
        name: newReviewName,
        rating: newReviewRating,
        review_text: newReviewText,
        is_published: true, // Admin-created reviews are published by default
        is_featured: newReviewFeatured,
      })

      if (submitError) throw submitError

      // Clear form and show success message
      setNewReviewName("")
      setNewReviewRating(5)
      setNewReviewText("")
      setNewReviewFeatured(false)
      setSuccess("Review created successfully!")

      // Refresh the reviews list
      fetchReviews()
    } catch (error) {
      console.error("Error creating review:", error)
      setError("Failed to create review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePublishStatus(review: Review) {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("reviews")
        .update({ is_published: !review.is_published })
        .eq("id", review.id)

      if (error) throw error

      // Update local state
      setReviews(reviews.map((r) => (r.id === review.id ? { ...r, is_published: !r.is_published } : r)))

      setSuccess(`Review ${review.is_published ? "unpublished" : "published"} successfully!`)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error toggling publish status:", error)
      setError("Failed to update review status. Please try again.")

      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }

  async function toggleFeaturedStatus(review: Review) {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("reviews").update({ is_featured: !review.is_featured }).eq("id", review.id)

      if (error) throw error

      // Update local state
      setReviews(reviews.map((r) => (r.id === review.id ? { ...r, is_featured: !r.is_featured } : r)))

      setSuccess(`Review ${review.is_featured ? "unfeatured" : "featured"} successfully!`)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error toggling featured status:", error)
      setError("Failed to update review status. Please try again.")

      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }

  async function deleteReview(id: number) {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("reviews").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setReviews(reviews.filter((r) => r.id !== id))

      setSuccess("Review deleted successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error deleting review:", error)
      setError("Failed to delete review. Please try again.")

      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }

  function startEditingReview(review: Review) {
    setEditingReview(review)
    setEditName(review.name)
    setEditRating(review.rating)
    setEditText(review.review_text)
    setEditFeatured(review.is_featured)
  }

  async function handleUpdateReview(e: React.FormEvent) {
    e.preventDefault()

    if (!editingReview) return

    setIsEditing(true)
    setError(null)

    try {
      // Validate inputs
      if (!editName.trim()) {
        setError("Please enter a name")
        setIsEditing(false)
        return
      }

      if (!editText.trim()) {
        setError("Please enter a review")
        setIsEditing(false)
        return
      }

      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("reviews")
        .update({
          name: editName,
          rating: editRating,
          review_text: editText,
          is_featured: editFeatured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingReview.id)

      if (error) throw error

      // Update local state
      setReviews(
        reviews.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                name: editName,
                rating: editRating,
                review_text: editText,
                is_featured: editFeatured,
                updated_at: new Date().toISOString(),
              }
            : r,
        ),
      )

      setSuccess("Review updated successfully!")
      setEditingReview(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error updating review:", error)
      setError("Failed to update review. Please try again.")
    } finally {
      setIsEditing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manage Reviews</h1>

        <Tabs defaultValue="all-reviews">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="create-review">Create Review</TabsTrigger>
          </TabsList>

          <TabsContent value="all-reviews" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Reviews</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "published" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("published")}
                    >
                      Published
                    </Button>
                    <Button
                      variant={filterStatus === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("pending")}
                    >
                      Pending
                    </Button>
                  </div>
                </div>
                <CardDescription>Manage user reviews and testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No reviews found.</div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">{review.name}</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
                          </div>
                          <p className="text-gray-700 my-2">{review.review_text}</p>
                          <div className="flex flex-wrap gap-2 mt-4">
                            <div
                              className={`px-2 py-1 text-xs rounded-full ${
                                review.is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {review.is_published ? "Published" : "Pending"}
                            </div>

                            {review.is_featured && (
                              <div className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                Featured
                              </div>
                            )}

                            {review.user_id && (
                              <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                User Submitted
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => togglePublishStatus(review)}>
                              {review.is_published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Publish
                                </>
                              )}
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => toggleFeaturedStatus(review)}>
                              {review.is_featured ? "Unfeature" : "Feature"}
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => startEditingReview(review)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>

                            <Button variant="destructive" size="sm" onClick={() => deleteReview(review.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-review" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Review</CardTitle>
                <CardDescription>Add a testimonial to showcase on the website</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateReview}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      placeholder="Enter reviewer's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= newReviewRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Review Text</Label>
                    <Textarea
                      id="review"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Enter the review content..."
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={newReviewFeatured}
                      onCheckedChange={(checked) => setNewReviewFeatured(checked === true)}
                    />
                    <Label htmlFor="featured">Feature this review on the homepage</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Review"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Review Dialog */}
        {editingReview && (
          <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Review</DialogTitle>
                <DialogDescription>Make changes to the review details</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUpdateReview}>
                <div className="space-y-4 py-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-rating">Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= editRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-review">Review Text</Label>
                    <Textarea
                      id="edit-review"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-featured"
                      checked={editFeatured}
                      onCheckedChange={(checked) => setEditFeatured(checked === true)}
                    />
                    <Label htmlFor="edit-featured">Feature this review</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingReview(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditing}>
                    {isEditing ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  )
}
