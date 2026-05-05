"use client"

import { useState, useEffect, useRef } from "react"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  Star,
  Users,
  Clock,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Crown,
  Heart,
  Zap,
  Flame,
  Calendar,
  PlayCircle,
  BookOpen,
  TrendingUp,
  Home,
  FileText,
  User,
  Award,
  Shield,
  Gift,
  ArrowRight,
  MousePointer,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  introduction_title: string
  introduction_content: string
  status: string
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
    features: string[]
    has_discount: boolean
    discount_percentage: number
  }
}

interface ComparisonFeature {
  id: string
  feature_name: string
  feature_description: string | null
  display_order: number
}

interface ComparisonValue {
  feature_id: string
  subscription_plan_id: string
  is_included: boolean
  custom_value: string | null
}

export default function SubscriptionCategoryPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<SubscriptionPage | null>(null)
  const [infoCards, setInfoCards] = useState<InfoCard[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [linkedPlans, setLinkedPlans] = useState<LinkedPlan[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [comparisonFeatures, setComparisonFeatures] = useState<ComparisonFeature[]>([])
  const [comparisonValues, setComparisonValues] = useState<ComparisonValue[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [referralDiscounts, setReferralDiscounts] = useState<{ [key: string]: number }>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const plansRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  const fromUpdates = searchParams.get("from") === "updates"
  const fromLogin = searchParams.get("from") === "login"
  const fromMain = searchParams.get("from") === "main"
  const fromHome = searchParams.get("from") === "home"
  const fromPlans = searchParams.get("from") === "plans"
  const fromUserPlans = searchParams.get("from") === "user-plans"

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    setUserId(storedUserId)
  }, [])

  useEffect(() => {
    if (userId && linkedPlans.length > 0) {
      fetchReferralDiscounts()
    }
  }, [userId, linkedPlans])

  const fetchReferralDiscounts = async () => {
    if (!userId) return

    const discounts: { [key: string]: number } = {}

    for (const plan of linkedPlans) {
      try {
        const response = await fetch("/api/user-referral-discount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            subscriptionId: plan.subscription_id,
          }),
        })

        if (!response.ok) {
          console.error(`API error for plan ${plan.subscription_id}:`, response.status)
          continue
        }

        const data = await response.json()

        if (data.hasDiscount) {
          discounts[plan.subscription_id] = data.discount
        }
      } catch (error) {
        console.error(`Error fetching referral discount for plan ${plan.subscription_id}:`, error)
      }
    }

    setReferralDiscounts(discounts)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchPageData()
  }, [params.slug])

  // Auto-cycle through content sections for preview
  useEffect(() => {
    if (contentSections.length > 0) {
      const interval = setInterval(() => {
        setActiveSection((prev) => (prev + 1) % contentSections.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [contentSections.length])

  const fetchPageData = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { data: pageData, error: pageError } = await supabase
        .from("subscription_pages")
        .select("*")
        .eq("slug", params.slug)
        .eq("status", "published")
        .single()

      if (pageError || !pageData) {
        notFound()
        return
      }
      setPage(pageData)

      const { data: cardsData } = await supabase
        .from("subscription_page_cards")
        .select("*")
        .eq("page_id", pageData.id)
        .order("display_order")

      setInfoCards(cardsData || [])

      const { data: sectionsData } = await supabase
        .from("subscription_page_sections")
        .select("*")
        .eq("page_id", pageData.id)
        .order("display_order")

      setContentSections(sectionsData || [])

      const { data: plansData } = await supabase
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
            duration_days,
            features,
            has_discount,
            discount_percentage
          )
        `)
        .eq("page_id", pageData.id)
        .order("display_order")

      setLinkedPlans(plansData || [])

      const { data: featuresData } = await supabase
        .from("plan_comparison_features")
        .select("*")
        .eq("subscription_page_id", pageData.id)
        .order("display_order")

      setComparisonFeatures(featuresData || [])

      if (featuresData && featuresData.length > 0) {
        const { data: valuesData } = await supabase
          .from("plan_comparison_values")
          .select("*")
          .in(
            "feature_id",
            featuresData.map((f) => f.id),
          )

        setComparisonValues(valuesData || [])
      }
    } catch (error) {
      console.error("Error fetching page data:", error)
      notFound()
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => (prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]))
  }

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="h-6 w-6" />
      case "clock":
        return <Clock className="h-6 w-6" />
      case "star":
        return <Star className="h-6 w-6" />
      case "check":
        return <CheckCircle className="h-6 w-6" />
      case "calendar":
        return <Calendar className="h-6 w-6" />
      case "play":
        return <PlayCircle className="h-6 w-6" />
      case "book":
        return <BookOpen className="h-6 w-6" />
      case "trending":
        return <TrendingUp className="h-6 w-6" />
      case "award":
        return <Award className="h-6 w-6" />
      case "shield":
        return <Shield className="h-6 w-6" />
      case "gift":
        return <Gift className="h-6 w-6" />
      default:
        return <div className="text-xl">{iconName}</div>
    }
  }

  const getBackLink = () => {
    if (fromUpdates) return "/updates"
    if (fromLogin) return "/user/plans"
    if (fromMain) return "/"
    if (fromHome) return "/"
    if (fromPlans) return "/plans"
    if (fromUserPlans) return "/user/plans"
    return "/plans"
  }

  const getBackText = () => {
    if (fromUpdates) return "Back to Updates"
    if (fromLogin) return "Back to My Plans"
    if (fromMain) return "Back to Home"
    if (fromHome) return "Back to Home"
    if (fromPlans) return "Back to Plans"
    if (fromUserPlans) return "Back to My Plans"
    return "Back to Plans"
  }

  const getBackIcon = () => {
    if (fromUpdates) return <FileText className="mr-2 h-4 w-4" />
    if (fromLogin) return <Users className="mr-2 h-4 w-4" />
    if (fromMain) return <Home className="mr-2 h-4 w-4" />
    if (fromHome) return <Home className="mr-2 h-4 w-4" />
    if (fromPlans) return <ArrowLeft className="mr-2 h-4 w-4" />
    if (fromUserPlans) return <Users className="mr-2 h-4 w-4" />
    return <ArrowLeft className="mr-2 h-4 w-4" />
  }

  const planIncludesFeature = (featureId: string, subscriptionId: string) => {
    const value = comparisonValues.find(
      (v) => v.feature_id === featureId && String(v.subscription_plan_id) === subscriptionId,
    )
    return value
  }

  const handleSubscribeClick = (planId: string) => {
    const isLoggedIn = !!userId

    if (isLoggedIn) {
      router.push(`/user/subscribe?plan=${planId}`)
    } else {
      setSelectedPlanId(planId)
      setShowAuthModal(true)
    }
  }

  const handleAuthChoice = (choice: "login" | "register") => {
    if (selectedPlanId) {
      sessionStorage.setItem("pendingSubscriptionPlan", selectedPlanId)

      const returnUrl = `/user/subscribe?plan=${selectedPlanId}`

      if (choice === "login") {
        router.push(`/user/login?redirect=${encodeURIComponent(returnUrl)}`)
      } else {
        router.push(`/user/register?redirect=${encodeURIComponent(returnUrl)}`)
      }
    }
  }

  const calculateFinalPrice = (plan: LinkedPlan["subscriptions"]) => {
    const baseDiscount = plan.has_discount ? (plan.price * plan.discount_percentage) / 100 : 0
    const referralDiscount = referralDiscounts[plan.id] ? (plan.price * referralDiscounts[plan.id]) / 100 : 0
    return plan.price - baseDiscount - referralDiscount
  }

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Logo className="h-8 w-auto" />
            <Skeleton className="h-10 w-32 bg-purple-800/50" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pt-32">
          <Skeleton className="h-8 w-32 mb-6 bg-purple-800/50" />
          <Skeleton className="h-[500px] w-full mb-8 rounded-3xl bg-purple-800/50" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl bg-purple-800/50" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo className="h-8 w-auto" />
          <Link href={getBackLink()}>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
            >
              {getBackIcon()}
              {getBackText()}
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative min-h-[600px] overflow-hidden">
          <Image
            src={
              page.hero_image_url || `/placeholder.svg?height=600&width=1200&query=${encodeURIComponent(page.title)}`
            }
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-purple-900/70 to-slate-900" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center pt-16">
            <div className="text-center text-white max-w-5xl px-4">
              {/* Premium Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 text-slate-900 px-6 py-2 rounded-full text-sm font-bold mb-8 shadow-2xl shadow-amber-500/30 animate-shimmer">
                <Crown className="mr-2 h-4 w-4" />
                Premium Experience
                <Sparkles className="ml-2 h-4 w-4" />
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
                  {page.title}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-purple-100/90 font-light mb-10 leading-relaxed max-w-3xl mx-auto">
                {page.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-slate-900 font-bold text-lg px-10 py-6 h-auto shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 group"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const introSection = document.getElementById("introduction")
                    introSection?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="border-2 border-purple-400/50 text-purple-200 hover:bg-purple-500/20 font-semibold text-lg px-8 py-6 h-auto backdrop-blur-sm bg-white/5"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </div>

              {/* Scroll indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <MousePointer className="h-6 w-6 text-purple-300/70" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Stats Cards */}
          {infoCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 -mt-20 relative z-20">
              {infoCards.map((card, index) => (
                <Card
                  key={card.id}
                  className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-800/90 to-purple-900/50 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />
                  
                  <CardContent className="relative pt-8 pb-8 px-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <div className="text-white">{getCardIcon(card.icon)}</div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-purple-100">{card.title}</h3>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Introduction Section */}
          <div id="introduction" className="mb-20 scroll-mt-24">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800/80 to-purple-900/40 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
              
              <CardHeader className="text-center pb-8 relative">
                <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full text-sm font-bold mb-6 mx-auto shadow-lg shadow-emerald-500/30">
                  <Heart className="mr-2 h-4 w-4" />
                  Why Choose This Program?
                </div>
                <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 mb-4">
                  {page.introduction_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-lg leading-relaxed text-purple-100/80 text-center max-w-3xl mx-auto">
                  {page.introduction_content}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Content Sections */}
            <div className="space-y-6">
              <div className="text-center lg:text-left mb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-lg shadow-emerald-500/30">
                  <BookOpen className="mr-2 h-4 w-4" />
                  What You&apos;ll Master
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Your Learning Journey</h2>
                <p className="text-purple-200/70">Explore the comprehensive curriculum designed for transformation</p>
              </div>

              {/* Progress indicator */}
              {contentSections.length > 0 && (
                <div className="flex gap-1 mb-6">
                  {contentSections.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        idx === activeSection
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : idx < activeSection
                          ? "bg-purple-500/50"
                          : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              )}

              {contentSections.map((section, index) => (
                <Collapsible key={section.id} open={openSections.includes(section.id)}>
                  <CollapsibleTrigger
                    onClick={() => toggleSection(section.id)}
                    className={`flex items-center justify-between w-full p-5 rounded-xl transition-all duration-300 group ${
                      openSections.includes(section.id)
                        ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 shadow-lg shadow-purple-500/10"
                        : "bg-slate-800/50 hover:bg-slate-800/80"
                    } backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                        openSections.includes(section.id)
                          ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 scale-110"
                          : "bg-slate-700 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500"
                      }`}>
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-lg text-left text-white">{section.title}</h3>
                    </div>
                    <div className={`transition-transform duration-300 ${openSections.includes(section.id) ? "rotate-180" : ""}`}>
                      <ChevronDown className="h-5 w-5 text-purple-400" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-5 py-4 mt-2 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10">
                    <p className="text-purple-100/80 leading-relaxed pl-16">{section.content}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Plans Section */}
            <div ref={plansRef} className="space-y-6 scroll-mt-24">
              <div className="text-center lg:text-left mb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-lg shadow-amber-500/30">
                  <Crown className="mr-2 h-4 w-4" />
                  Choose Your Plan
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Investment in Yourself</h2>
                <p className="text-purple-200/70">Select the perfect plan to begin your transformation</p>
              </div>

              {linkedPlans.map((linkedPlan, index) => (
                <Card
                  key={linkedPlan.id}
                  className={`relative overflow-hidden border-0 transition-all duration-500 cursor-pointer ${
                    hoveredPlan === linkedPlan.id || index === 0
                      ? "bg-gradient-to-br from-slate-800 via-purple-900/50 to-slate-800 shadow-2xl shadow-purple-500/20 scale-[1.02]"
                      : "bg-slate-800/60 hover:bg-slate-800/80"
                  } backdrop-blur-xl`}
                  onMouseEnter={() => setHoveredPlan(linkedPlan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {/* Popular badge */}
                  {index === 0 && (
                    <div className="absolute -top-px -right-px">
                      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 text-slate-900 px-4 py-1 text-xs font-bold rounded-bl-xl rounded-tr-xl flex items-center shadow-lg">
                        <Star className="mr-1 h-3 w-3" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 transition-all duration-500 ${
                    hoveredPlan === linkedPlan.id ? "from-purple-500/10 to-pink-500/10" : ""
                  }`} />

                  <CardHeader className="pb-3 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-white mb-2">
                          {linkedPlan.subscriptions.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-purple-200/70">
                          {linkedPlan.subscriptions.description}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col items-end">
                          {linkedPlan.subscriptions.has_discount || referralDiscounts[linkedPlan.subscription_id] ? (
                            <>
                              <div className="text-sm text-purple-400/60 line-through">
                                ₹{linkedPlan.subscriptions.price}
                              </div>
                              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                ₹{calculateFinalPrice(linkedPlan.subscriptions).toFixed(0)}
                              </div>
                              <div className="flex flex-wrap justify-end gap-1 mt-1">
                                {linkedPlan.subscriptions.has_discount && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                    {linkedPlan.subscriptions.discount_percentage}% OFF
                                  </Badge>
                                )}
                                {referralDiscounts[linkedPlan.subscription_id] && (
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                    +{referralDiscounts[linkedPlan.subscription_id]}% Referral
                                  </Badge>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                              ₹{linkedPlan.subscriptions.price}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-purple-300/60 font-medium mt-2 flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {linkedPlan.subscriptions.duration_days} days
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 relative">
                    {linkedPlan.subscriptions.features && linkedPlan.subscriptions.features.length > 0 && (
                      <div className="space-y-2 mb-5">
                        {linkedPlan.subscriptions.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-purple-100/80 text-sm">{feature}</span>
                          </div>
                        ))}
                        {linkedPlan.subscriptions.features.length > 4 && (
                          <div className="text-xs text-purple-400/60 ml-8">
                            +{linkedPlan.subscriptions.features.length - 4} more features included
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => handleSubscribeClick(linkedPlan.subscriptions.id)}
                      className={`w-full h-12 font-bold transition-all duration-300 group ${
                        index === 0
                          ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20"
                      }`}
                    >
                      <Zap className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      Choose This Plan
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                  <Shield className="h-4 w-4" />
                  Secure Payment
                </div>
                <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                  <Award className="h-4 w-4" />
                  Quality Guaranteed
                </div>
                <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                  <Heart className="h-4 w-4" />
                  24/7 Support
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          {comparisonFeatures.length > 0 && linkedPlans.length > 0 && (
            <div className="mt-24 mb-16">
              <div className="text-center mb-12">
                <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-lg shadow-indigo-500/30">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Compare Plans
                </div>
                <h2 className="text-4xl font-black text-white mb-3">Find Your Perfect Match</h2>
                <p className="text-purple-200/70 text-lg">Compare features across all plans to make the best choice</p>
              </div>

              <Card className="border-0 shadow-2xl bg-slate-800/60 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
                          <th className="text-left p-5 text-white font-bold text-sm sticky left-0 bg-gradient-to-r from-purple-600 to-purple-600 z-10 min-w-[200px]">
                            Features
                          </th>
                          {linkedPlans.map((plan, idx) => (
                            <th key={plan.id} className="text-center p-5 text-white font-bold text-sm min-w-[160px]">
                              <div className="flex flex-col items-center gap-2">
                                {idx === 0 && (
                                  <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs mb-1">
                                    Recommended
                                  </Badge>
                                )}
                                <span className="text-lg">{plan.subscriptions.name}</span>
                                {plan.subscriptions.has_discount || referralDiscounts[plan.subscription_id] ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs font-normal opacity-60 line-through">
                                      ₹{plan.subscriptions.price}
                                    </span>
                                    <span className="text-sm font-bold text-amber-300">
                                      ₹{calculateFinalPrice(plan.subscriptions).toFixed(0)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-normal text-amber-300">₹{plan.subscriptions.price}</span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((feature, index) => (
                          <tr
                            key={feature.id}
                            className={`border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors ${
                              index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"
                            }`}
                          >
                            <td className="p-4 font-medium text-white text-sm sticky left-0 bg-inherit z-10">
                              <div>
                                <div className="font-semibold">{feature.feature_name}</div>
                                {feature.feature_description && (
                                  <div className="text-xs text-purple-300/60 mt-1">{feature.feature_description}</div>
                                )}
                              </div>
                            </td>
                            {linkedPlans.map((plan) => {
                              const value = planIncludesFeature(feature.id, plan.subscriptions.id)
                              return (
                                <td key={plan.id} className="p-4 text-center">
                                  {value?.custom_value ? (
                                    <span className="text-sm font-semibold text-amber-400">{value.custom_value}</span>
                                  ) : value?.is_included ? (
                                    <div className="flex justify-center">
                                      <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="w-7 h-7 bg-slate-700/50 rounded-full flex items-center justify-center">
                                        <span className="text-slate-500 text-lg">-</span>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom CTA */}
              <div className="text-center mt-12">
                <p className="text-purple-200/70 mb-6 text-lg">Ready to begin your transformation journey?</p>
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-slate-900 font-bold text-lg px-10 py-6 h-auto shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 group"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Choose Your Plan Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">Welcome to Your Journey</DialogTitle>
            <DialogDescription className="text-center pt-2 text-purple-200/70">
              To subscribe to this plan, please choose an option below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <Button
              onClick={() => handleAuthChoice("register")}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
            >
              <Users className="mr-2 h-5 w-5" />
              Create Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-purple-500/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-900 px-4 text-purple-300/70">Already have an account?</span>
              </div>
            </div>

            <Button
              onClick={() => handleAuthChoice("login")}
              variant="outline"
              className="w-full h-14 text-lg font-bold border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
            >
              <User className="mr-2 h-5 w-5" />
              Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.4; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
