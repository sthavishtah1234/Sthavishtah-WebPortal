"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Review {
  id: number
  name: string
  avatar_url: string | null
  rating: number
  review_text: string
  is_featured: boolean
}

export default function ReviewCarousel() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true)

        const supabase = getSupabaseBrowserClient()

        const { data, error: supabaseError } = await supabase
          .from("reviews")
          .select("*")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })

        if (supabaseError) {
          console.error("Supabase reviews fetch error:", supabaseError)
          // Use fallback data instead of throwing
          setReviews(getMockReviews())
          return
        }

        if (data && data.length > 0) {
          setReviews(data)
          console.log(`✅ Loaded ${data.length} reviews from database`)
        } else {
          // No reviews in database, use mock data
          setReviews(getMockReviews())
          console.log("Using fallback review data (no reviews in database)")
        }
      } catch (err) {
        console.error("Error fetching reviews:", err)
        // Always use mock data as fallback
        setReviews(getMockReviews())
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? reviews.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === reviews.length - 1 ? 0 : prevIndex + 1))
  }

  // Jump to a specific page of reviews
  const goToPage = (pageIndex: number) => {
    const newIndex = pageIndex * getDisplayCount()
    if (newIndex < reviews.length) {
      setCurrentIndex(newIndex)
    }
  }

  // Determine how many reviews to show based on screen size
  const getDisplayCount = () => {
    if (typeof window === "undefined") return 1
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 1024) return 2
    return 3
  }

  const [displayCount, setDisplayCount] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      setDisplayCount(getDisplayCount())
    }

    // Set initial display count
    handleResize()

    // Add resize listener
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="h-12 w-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-amber-600">Unable to load reviews. Please try again later.</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No reviews available yet. Be the first to share your experience!</p>
      </div>
    )
  }

  // Calculate which reviews to show
  const visibleReviews = []
  for (let i = 0; i < Math.min(displayCount, reviews.length); i++) {
    const index = (currentIndex + i) % reviews.length
    visibleReviews.push(reviews[index])
  }

  // Calculate total pages for pagination
  const totalPages = Math.ceil(reviews.length / displayCount)
  const currentPage = Math.floor(currentIndex / displayCount)

  return (
    <div className="relative">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{reviews.length}</span> reviews from our community
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center justify-center">
        {visibleReviews.map((review, index) => (
          <ReviewCard key={`${review.id}-${index}`} review={review} isCenter={index === Math.floor(displayCount / 2)} />
        ))}
      </div>

      {reviews.length > displayCount && (
        <>
          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="rounded-full bg-white/80 hover:bg-white border-green-200 text-green-700"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Pagination indicators */}
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                // Show first 2, current, and last 2 pages if many pages
                let pageToShow = idx
                let shouldRenderDots = false

                if (totalPages > 5) {
                  if (currentPage < 2) {
                    // First pages
                    pageToShow = idx
                  } else if (currentPage >= totalPages - 2) {
                    // Last pages
                    pageToShow = totalPages - 5 + idx
                  } else {
                    // Middle with current page in center
                    if (idx === 0) pageToShow = 0
                    else if (idx === 1) {
                      shouldRenderDots = true
                    } else if (idx === 2) pageToShow = currentPage
                    else if (idx === 3) {
                      shouldRenderDots = true
                    } else if (idx === 4) pageToShow = totalPages - 1
                  }
                }

                if (shouldRenderDots) {
                  return (
                    <span key={`dots-${idx}`} className="w-2 text-center mx-1">
                      &hellip;
                    </span>
                  )
                }

                return (
                  <Button
                    key={`page-${pageToShow}`}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      currentPage === pageToShow ? "bg-green-600 hover:bg-green-700" : "text-green-700 border-green-200"
                    }`}
                    onClick={() => goToPage(pageToShow)}
                    aria-label={`Go to page ${pageToShow + 1}`}
                    aria-current={currentPage === pageToShow ? "page" : undefined}
                  >
                    {pageToShow + 1}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full bg-white/80 hover:bg-white border-green-200 text-green-700"
              aria-label="Next review"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              Showing {currentIndex + 1}-{Math.min(currentIndex + displayCount, reviews.length)} of {reviews.length}{" "}
              reviews
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function ReviewCard({ review, isCenter }: { review: Review; isCenter: boolean }) {
  return (
    <Card
      className={`nature-card h-full bg-white/90 backdrop-blur-sm transition-all duration-300 ${
        isCenter ? "md:scale-105 md:shadow-lg" : "md:opacity-90"
      }`}
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col h-full">
          <div className="mb-4 flex justify-between items-start">
            <div className="flex items-center">
              <div className="mr-3 relative">
                {review.avatar_url ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-green-100">
                    <Image
                      src={review.avatar_url || "/placeholder.svg"}
                      alt={review.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-lg">
                    {review.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-green-800">{review.name}</h4>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Quote className="h-8 w-8 text-green-200 flex-shrink-0" />
          </div>

          <p className="text-gray-700 flex-grow">{review.review_text}</p>

          {review.is_featured && (
            <div className="mt-4 pt-3 border-t border-green-100">
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Featured Review
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const getMockReviews = (): Review[] => [
  {
    id: 1,
    name: "Aditi Patel",
    avatar_url: null,
    rating: 5,
    review_text:
      "The morning yoga sessions have completely transformed my daily routine. I feel more energetic and focused throughout the day.",
    is_featured: true,
  },
  {
    id: 2,
    name: "Arjun Singh",
    avatar_url: null,
    rating: 5,
    review_text:
      "I've been practicing yoga for years, but these classes taught me new techniques that have improved my practice significantly.",
    is_featured: false,
  },
  {
    id: 3,
    name: "Kavya Joshi",
    avatar_url: null,
    rating: 4,
    review_text:
      "The instructors are excellent and the course content is well-structured. Highly recommended for beginners!",
    is_featured: false,
  },
]
