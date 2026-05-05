"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Star,
  ArrowRight,
  Search,
  Sparkles,
  Heart,
  Zap,
  CheckCircle,
  Leaf,
  Shield,
  BookOpen,
  Target,
  Crown,
  Flame,
  ArrowLeft,
  UserPlus,
  LogIn,
  Home,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url?: string
  introduction_title: string
  introduction_content: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

interface Subscription {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  created_at: string
}

export default function PlansPage() {
  const [subscriptionPages, setSubscriptionPages] = useState<SubscriptionPage[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const fromHome = searchParams.get("from") === "home"

  useEffect(() => {
    fetchData()
    // Immediate scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch subscription pages first
      const { data: pages, error: pagesError } = await supabase
        .from("subscription_pages")
        .select(`
          *,
          subscription_page_cards (
            id,
            title,
            value,
            icon
          )
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (pagesError) {
        console.error("Error fetching subscription pages:", pagesError)
      }

      // Fetch actual subscriptions as fallback
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (subsError) {
        console.error("Error fetching subscriptions:", subsError)
        setError(subsError.message)
        return
      }

      setSubscriptionPages(pages || [])
      setSubscriptions(subs || [])
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredPages = subscriptionPages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.subtitle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Show subscription pages if available, otherwise show direct subscriptions
  const hasPages = filteredPages.length > 0
  const hasSubscriptions = filteredSubscriptions.length > 0

  // Determine back link and text based on where user came from
  const getBackLink = () => {
    if (fromHome) return "/"
    return "/"
  }

  const getBackText = () => {
    if (fromHome) return "Back to Home"
    return "Back to Home"
  }

  const getBackIcon = () => {
    if (fromHome) return <Home className="mr-2 h-4 w-4" />
    return <ArrowLeft className="mr-2 h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Sticky Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
              <div className="ml-3">
                <div className="text-xl font-bold text-emerald-700">Sthavishtah</div>
                <div className="text-xs text-gray-500">Yoga & Wellness</div>
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Skeleton className="h-16 w-[600px] mx-auto mb-6" />
              <Skeleton className="h-8 w-[800px] mx-auto mb-4" />
              <Skeleton className="h-6 w-[400px] mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-2xl">
                  <Skeleton className="h-64 w-full" />
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        {/* Sticky Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
              <div className="ml-3">
                <div className="text-xl font-bold text-emerald-700">Sthavishtah</div>
                <div className="text-xs text-gray-500">Yoga & Wellness</div>
              </div>
            </div>
            <Link href={getBackLink()}>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                {getBackIcon()}
                {getBackText()}
              </Button>
            </Link>
          </div>
        </div>

        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-3xl p-12 shadow-2xl">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-red-800 mb-4">Oops! Something went wrong</h1>
              <p className="text-red-600 mb-8 text-lg">{error}</p>
              <Button onClick={fetchData} size="lg" className="bg-red-500 hover:bg-red-600">
                <Zap className="mr-2 h-5 w-5" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          <Link href={getBackLink()}>
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
            >
              {getBackIcon()}
              {getBackText()}
            </Button>
          </Link>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-300/10 to-emerald-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-8 shadow-lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Begin Your Wellness Journey
              <Leaf className="ml-2 h-4 w-4" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 mb-8 leading-tight">
              Choose Your
              <br />
              Path
            </h1>

            <p className="text-2xl md:text-3xl text-gray-700 max-w-4xl mx-auto mb-12 font-light leading-relaxed">
              Discover our <span className="font-bold text-emerald-600">authentic programs</span> designed to nurture
              your
              <span className="font-bold text-teal-600"> mind, body, and spirit</span>. Start your{" "}
              <span className="font-bold text-cyan-600">personal transformation</span> today.
            </p>

            {/* Value Props */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-emerald-600 mb-1">Authentic</div>
                <div className="text-gray-600 font-medium text-sm">Traditional Methods</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-8 w-8 text-teal-600" />
                </div>
                <div className="text-lg font-bold text-teal-600 mb-1">Personalized</div>
                <div className="text-gray-600 font-medium text-sm">Your Unique Journey</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-8 w-8 text-cyan-600" />
                </div>
                <div className="text-lg font-bold text-cyan-600 mb-1">Safe</div>
                <div className="text-gray-600 font-medium text-sm">Gentle Approach</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-600 mb-1">Holistic</div>
                <div className="text-gray-600 font-medium text-sm">Complete Wellness</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
              <Input
                type="text"
                placeholder="Find your perfect program..."
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value || "")}
                className="pl-12 py-4 text-lg border-2 border-emerald-200 rounded-2xl focus:border-emerald-500 shadow-lg bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Programs Grid */}
          {hasPages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredPages.map((page, index) => (
                <Card
                  key={page.id}
                  className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group bg-white/80 backdrop-blur-sm hover:scale-105 relative"
                >
                  {/* Featured Badge */}
                  {index === 0 && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        <Star className="mr-1 h-4 w-4" />
                        FEATURED
                      </Badge>
                    </div>
                  )}

                  {/* Hero Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={
                        page.hero_image_url || "/placeholder.svg?height=300&width=500&query=yoga wellness meditation"
                      }
                      alt={page.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4">
                      <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-emerald-600">
                        <Leaf className="mr-1 h-4 w-4" />
                        Natural
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-black mb-2">{page.title}</h3>
                      <p className="text-lg opacity-90 font-medium">{page.subtitle}</p>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-lg font-bold">Discover More</p>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">{page.introduction_title}</CardTitle>
                    <CardDescription className="line-clamp-3 text-gray-600 text-base leading-relaxed">
                      {page.introduction_content}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="mb-6">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                        Guided practice sessions
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                        Flexible scheduling
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                        Progress tracking
                      </div>
                    </div>

                    <Link href={`/user/subscription-categories/${page.slug}?from=home`}>
                      <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <span className="mr-2">Start Your Journey</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hasSubscriptions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredSubscriptions.map((subscription, index) => (
                <Card
                  key={subscription.id}
                  className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group bg-white/80 backdrop-blur-sm hover:scale-105 relative"
                >
                  {/* Popular Badge */}
                  {index === 0 && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        <Crown className="mr-1 h-4 w-4" />
                        POPULAR
                      </Badge>
                    </div>
                  )}

                  {/* Hero Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={`/placeholder.svg?height=300&width=500&query=${encodeURIComponent(subscription.name)}`}
                      alt={subscription.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4">
                      <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-purple-600">
                        <Flame className="mr-1 h-4 w-4" />
                        Hot
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-black mb-2">{subscription.name}</h3>
                      <p className="text-lg opacity-90 font-medium">₹{subscription.price}</p>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Crown className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-lg font-bold">Subscribe Now</p>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl font-bold text-gray-900">{subscription.name}</CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-600">₹{subscription.price}</div>
                        <div className="text-sm text-gray-500">{subscription.duration_days} days</div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {subscription.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Features */}
                    {subscription.features && subscription.features.length > 0 && (
                      <div className="mb-6">
                        {subscription.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600 mb-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}

                    <Link href={`/user/subscribe?plan=${subscription.id}`}>
                      <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <span className="mr-2">Subscribe Now</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 max-w-lg mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchTerm ? "No programs found" : "New programs launching soon!"}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {searchTerm
                    ? `No programs match "${searchTerm}". Try a different search term.`
                    : "We're carefully crafting wellness programs that will transform your life!"}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    size="lg"
                    variant="outline"
                    className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Ready to Transform Your Life Section */}
          <div className="mt-24">
            <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-0 shadow-2xl overflow-hidden relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full"></div>
                <div className="absolute top-1/4 right-1/3 w-16 h-16 bg-white rounded-full"></div>
              </div>

              <CardContent className="relative z-10 p-12 text-center text-white">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 text-sm font-semibold mb-8">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Transform Your Life
                </div>

                <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Transform Your Life?</h2>

                {/* Mind-blowing Thought */}
                <div className="max-w-4xl mx-auto mb-8">
                  <blockquote className="text-xl md:text-2xl font-light italic leading-relaxed mb-4">
                    "The body benefits from movement, and the mind benefits from stillness. In the harmony of both, we
                    discover our true potential and unlock the infinite possibilities within."
                  </blockquote>
                  <p className="text-lg opacity-90">
                    Every breath is a new beginning. Every pose is a step towards your highest self.
                    <span className="font-bold"> Your transformation starts with a single intention.</span>
                  </p>
                </div>

                {/* Always show buttons for this page since it's for non-logged-in users */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/user/register">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-emerald-600 bg-white hover:bg-gray-50 text-lg font-bold px-8 py-4 h-auto shadow-lg"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Start Your Journey
                    </Button>
                  </Link>
                  <Link href="/user/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-emerald-600 text-lg font-bold px-8 py-4 h-auto"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Continue Your Practice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 mb-8 text-lg">Authentic wellness practices rooted in tradition</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="flex items-center">
                <Leaf className="h-5 w-5 text-emerald-500 mr-1" />
                <span className="font-semibold">Natural Methods</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-1" />
                <span className="font-semibold">Holistic Approach</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-1" />
                <span className="font-semibold">Safe Practice</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
