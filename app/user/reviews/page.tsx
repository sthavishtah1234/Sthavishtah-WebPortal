"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Star } from "lucide-react"

interface Review {
  id: number
  user_id: number
  name: string
  rating: number
  review_text: string
  created_at: string
  is_published: boolean
}

export default function UserReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReview, setNewReview] = useState("")
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUserReviews()
  }, [])

  async function fetchUserReviews() {
    try {
      setLoading(true)
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitReview() {
    try {
      setSubmitting(true)
      setError("")
      setSuccess(false)

      if (!newReview.trim()) {
        setError("Please enter your review")
        return
      }

      const userId = localStorage.getItem("userId")
      const userName = localStorage.getItem("userName") || "User"
      if (!userId) {
        setError("You must be logged in to submit a review")
        return
      }

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("reviews").insert({
        user_id: userId,
        name: userName,
        rating,
        review_text: newReview,
        is_published: false, // Admin will approve
      })

      if (error) throw error

      setSuccess(true)
      setNewReview("")
      setRating(5)
      fetchUserReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      setError("Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Reviews</h1>
            <p className="text-gray-500">Share your experience with our yoga classes</p>
          </div>
        </div>

        {/* Submit new review */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-xl text-green-800">Write a Review</CardTitle>
            <CardDescription>Tell us about your experience with our yoga classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      <Star
                        className={`h-6 w-6 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="review" className="block text-sm font-medium mb-2">
                  Your Review
                </label>
                <Textarea
                  id="review"
                  placeholder="Share your thoughts about our yoga classes..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Thank you for your review!</p>}
            <Button onClick={handleSubmitReview} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardFooter>
        </Card>

        {/* Previous reviews */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-800">Your Previous Reviews</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          ) : reviews.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-500 mb-2">You haven't submitted any reviews yet.</p>
                <p className="text-sm text-gray-400">Share your experience with our yoga classes above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review.id} className="border-green-100 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-green-800">{review.name}</CardTitle>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <CardDescription>{formatDate(review.created_at)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{review.review_text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
