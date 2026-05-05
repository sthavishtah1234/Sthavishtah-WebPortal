"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Utensils,
  Dumbbell,
  Brain,
  Users,
  Instagram,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Package,
  ExternalLink,
  Star,
  Zap,
  MessageCircle,
  Heart,
  Award,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
import ReviewCarousel from "@/components/review-carousel"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ScrollReveal } from "@/hooks/use-scroll-animation"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  status: string
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [subscriptionPages, setSubscriptionPages] = useState<SubscriptionPage[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [showTeamSection, setShowTeamSection] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null)

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch subscription pages and team data, wrapped in try-catch
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchSubscriptionPages()
        await fetchTeamData()
      } catch (error) {
        console.error("Failed to initialize data:", error)
        // Continue rendering even if data fetch fails
      }
    }
    initializeData()
  }, [])

  const fetchSubscriptionPages = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("subscription_pages")
        .select("id, slug, title, subtitle, hero_image_url, status")
        .eq("status", "published")
        .order("created_at")

      if (!error && data) {
        setSubscriptionPages(data)
      }
    } catch (error) {
      console.error("Error fetching subscription pages:", error)
      // Silently fail - page will render without subscription pages
    }
  }

  const fetchTeamData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!membersError && members) {
        setTeamMembers(members)
      }

      // Fetch visibility setting
      const { data: setting, error: settingError } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "show_our_team_section")
        .single()

      if (!settingError && setting) {
        setShowTeamSection(setting.setting_value)
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
      // Silently fail - page will render without team section
    }
  }

  const handleExploreClick = (slug: string) => {
    window.location.href = `/user/subscription-categories/${slug}`
  }

  const handleEnroll = () => {
    // This function will be called when the "Attend 7 Days FREE" button is clicked.
    // You can add logic here to redirect the user or open a modal.
    console.log("Enroll button clicked")
    // Example: Redirect to registration page
    window.location.href = "/user/register"
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-emerald-50/20">
      <header
        className={`w-full py-4 px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center group">
            <div className="relative h-14 w-14 rounded-full overflow-hidden ring-2 ring-white/60 shadow-lg bg-white/90 backdrop-blur-sm group-hover:ring-white transition-all">
              <Image src="/images/logo.png" alt="Sthavishtah" fill className="object-cover" priority />
            </div>
            <div className="flex flex-col ml-3 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
              <span className="font-playfair text-lg font-semibold tracking-tight text-emerald-700">STHAVISHTAH</span>
              <span className="text-[9px] tracking-[0.2em] text-gray-600 uppercase">Yoga & Wellness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Link href="/updates" className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-lora bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md border border-white/50">
              Updates
            </Link>
            <Link href="/swarasya" className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-lora bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md border border-white/50">
              Swarasya
            </Link>
            <Link href="/events" className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-lora bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md border border-white/50">
              Tickets
            </Link>
            <Link href="/user/login" className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-lora bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md border border-white/50">
              Sign In
            </Link>
            <Link href="/student/login" className="px-4 py-2 text-sm text-emerald-700 hover:text-emerald-900 transition-colors font-lora bg-emerald-50/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md border border-emerald-200/50">
              Student Login
            </Link>
            <Link
              href="/user/register"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm rounded-full hover:from-emerald-700 hover:to-teal-600 transition-all hover:shadow-lg font-lora shadow-md"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-emerald-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg border-t border-gray-200">
            <nav className="flex flex-col p-6 gap-4">
              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Updates
              </Link>
              <Link
                href="/swarasya"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Swarasya
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Tickets
              </Link>
              <Link
                href="/user/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Sign In
              </Link>
              <Link
                href="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-emerald-700 hover:text-emerald-900 py-2 font-lora"
              >
                Student Login
              </Link>
              <Link
                href="/user/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-center rounded-full hover:from-emerald-700 hover:to-teal-600 transition-all font-lora"
              >
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/serene-forest-meditation.jpg"
            alt="Yoga Practice"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-emerald-800/50 to-stone-900/60"></div>
        </div>

        {/* Animated floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-gentle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl animate-breathe" />

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="mb-8 animate-scale-in">
            <div className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm mb-6 animate-pulse-glow">
              <Image src="/images/logo.png" alt="Logo" width={100} height={100} className="rounded-full animate-breathe" />
            </div>
          </div>

          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight select-none pointer-events-none">
            <span className="inline-block animate-slide-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>Return to Stillness.</span>
            <br />
            <span className="inline-block font-semibold animate-slide-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Practice with Structure.</span>
          </h1>

          <p className="font-lora text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed select-none animate-fade-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            A structured yoga practice rooted in breath and awareness — designed to calm the mind, restore movement, and
            build lasting inner stability.
          </p>
        </div>

        {/* Scroll indicator with enhanced animation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2 hover:border-white/80 transition-colors">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Begin with Guidance Section - White Background */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-float-gentle" style={{ animationDelay: '3s' }} />
        
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <ScrollReveal animation="fade-down" delay={0}>
            <div className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mb-6 border border-emerald-200 hover-lift cursor-default">
              <Sparkles className="inline-block mr-1 h-3 w-3 md:h-4 md:w-4 animate-pulse" />
              Your Journey Starts Here
            </div>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={100}>
            <h2 className="font-playfair text-3xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Begin with Guidance
            </h2>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="font-lora text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience the transformative power of structured yoga practice. Start your 7-day free trial and discover a path to lasting wellness with expert guidance.
            </p>
          </ScrollReveal>
          
          <ScrollReveal animation="zoom-in" delay={300}>
            <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-10 py-6 text-lg md:text-xl font-lora shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl hover:scale-105 animate-gradient magnetic-hover group"
            onClick={handleEnroll}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-semibold group-hover:tracking-wide transition-all">Attend 7 Days FREE</span>
              <span className="text-xs sm:text-sm font-normal opacity-90">
                Live sessions with no cost and open to beginners
              </span>
            </div>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Combined Section - What You Will Gain + The Path We Follow */}
      <section className="min-h-screen py-8 md:py-12 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/riverside-yoga.jpg"
            alt="Peaceful Riverside Yoga"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 via-emerald-800/70 to-emerald-900/80"></div>
        </div>

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-10 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl animate-breathe" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* What You Will Gain - Image Only */}
          <ScrollReveal animation="zoom-in" delay={0}>
            <div className="text-center mb-8">
              <div className="max-w-4xl mx-auto">
                <Image
                  src="/images/chatgpt-20image-20feb-203-2c-202026-2c-2006-47-09-20pm.png"
                  alt="What You Will Gain - Yoga Benefits including Karma Yoga, Astanga Yoga, Jnana Yoga, and Bhakti Yoga"
                  width={1000}
                  height={600}
                  className="w-full h-auto rounded-xl shadow-2xl border-2 border-white/20 hover:scale-[1.02] transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Divider */}
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex items-center justify-center my-8">
              <div className="h-px w-24 bg-white/30"></div>
              <Sparkles className="h-6 w-6 text-white/60 mx-4 animate-pulse" />
              <div className="h-px w-24 bg-white/30"></div>
            </div>
          </ScrollReveal>

          {/* The Path We Follow */}
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="text-center mb-6">
              <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-amber-300 mb-2 drop-shadow-lg">
                The Path We Practiced and Passed On
              </h2>
              <p className="font-lora text-amber-100/90 max-w-2xl mx-auto drop-shadow-md text-sm md:text-base">
                Holistic wellness practices inspired by nature's wisdom.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-6xl mx-auto">
            {/* Main Path Cards - 6 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-6">
              {[
                { icon: BookOpen, title: "Bhagavad Gita Study" },
                { icon: Users, title: "Yoga for Health" },
                { icon: Dumbbell, title: "Muscle Training" },
                { icon: Utensils, title: "Natural Diet Plans" },
                { icon: Brain, title: "Mental Wellness" },
                { icon: Calendar, title: "Flexible Batches" },
              ].map((item, index) => (
                <ScrollReveal key={index} animation="zoom-in" delay={index * 80}>
                  <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl hover-lift tilt-card">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-all duration-300 mb-3 group-hover:scale-110 group-hover:rotate-6">
                          <item.icon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">{item.title}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* What Makes Us Different - 4 horizontal cards */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="mt-8 pt-8 border-t border-white/20">
                <h3 className="text-center font-playfair text-xl md:text-2xl font-semibold text-amber-300 mb-6">
                  What Makes Us Different
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Heart, title: "Authentic Practices", desc: "Traditional techniques from masters" },
                    { icon: Award, title: "Expert Guidance", desc: "Certified experienced instructors" },
                    { icon: Clock, title: "Flexible Schedule", desc: "Morning and evening batches" },
                    { icon: Sparkles, title: "Holistic Approach", desc: "Mind, body, and spirit wellness" },
                  ].map((item, index) => (
                    <div key={index} className="group bg-gradient-to-br from-emerald-600/90 to-teal-700/90 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-amber-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-400/20 group-hover:bg-amber-400/30 transition-colors">
                          <item.icon className="h-5 w-5 text-amber-300" />
                        </div>
                        <div>
                          <h4 className="font-playfair text-sm font-semibold text-white">{item.title}</h4>
                          <p className="text-xs text-white/70 font-lora">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Explore Our Subscription Programs Section */}
      <section className="py-10 md:py-16 relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6bT0iLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        
        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-48 h-48 bg-teal-400/15 rounded-full blur-3xl animate-float-gentle" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-breathe" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="text-center mb-6 md:mb-10">
              <div className="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-3 shadow-sm border border-white/30">
                <Package className="inline-block mr-1 h-3 w-3 md:h-4 md:w-4" />
                Wellness Programs
              </div>
              <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3 text-white">
                Discover Our Transformative Programs
              </h2>
              <p className="text-center text-white/90 max-w-2xl mx-auto text-sm md:text-base font-lora">
                Explore our carefully crafted subscription programs designed to nurture your mind, body, and spirit on
                your wellness journey.
              </p>
            </div>
          </ScrollReveal>

          {subscriptionPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 max-w-5xl mx-auto">
              {subscriptionPages.map((page, index) => (
                <ScrollReveal key={page.id} animation="fade-up" delay={index * 150}>
                <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-500 group bg-white rounded-2xl overflow-hidden hover-lift">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={page.hero_image_url || "/images/logo.png"}
                      alt={page.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60 transition-all duration-300"></div>
                    {/* Hover shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 0.8s ease' }} />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">{page.title}</h3>
                    <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">{page.subtitle}</p>
                    <Button
                      onClick={() => handleExploreClick(page.slug)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 max-w-5xl mx-auto">
              {/* Fallback cards with proper styling */}
              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt="Yoga Basics"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Sthavishtah Traditional Yoga Journey</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">A Complete Yoga & Wellness Experience from the Comfort of Your Home</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/traditional-yoga-mudras.jpg"
                    alt="Mindful Meditation"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Mindful Meditation</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">Deepen your practice with guided meditation sessions for mental clarity and inner peace.</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/riverside-yoga.jpg"
                    alt="Complete Wellness"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Complete Wellness</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">A comprehensive program combining yoga, meditation, and nutrition for total well-being.</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CTA Button */}
          <div className="text-center mt-6">
            <Link href="/plans">
              <Button
                size="lg"
                className="bg-white hover:bg-white/95 text-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 px-8 font-semibold"
              >
                Explore All Programs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {showTeamSection && teamMembers.length > 0 && (
        <section className="py-14 md:py-20 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/yoga-studio-peaceful-atmosphere.jpg"
              alt="Team Background"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-green-800/85 to-teal-800/90"></div>
          </div>

          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6bT0iLz48L2c+PC9nPjwvc3ZnPg==')] -z-10"></div>

          {/* Animated floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-float-slow" />
            <div className="absolute bottom-20 left-20 w-56 h-56 bg-teal-400/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium mb-4 shadow-md border border-white/20">
                  <Users className="inline-block mr-1 h-4 w-4" />
                  Our Team
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-white drop-shadow-lg">
                  Meet Our Dedicated Instructors
                </h2>
                <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md mb-6">
                  Experienced practitioners committed to guiding your wellness journey with wisdom and compassion.
                </p>
              </div>
            </ScrollReveal>

            {/* Desktop view - show first 6 members */}
            <div className="hidden lg:block relative">
              <div className="grid lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
                {teamMembers.slice(0, 6).map((member, index) => (
                  <ScrollReveal key={member.id} animation="zoom-in" delay={index * 100}>
                    <div className="relative z-10">
                      <div className="transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20 hover:-translate-y-2">
                      <div className="relative mb-4">
                        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-white/30 shadow-xl hover:border-white/50 transition-all duration-200">
                          <Image
                            src={member.image_url || "/placeholder.svg"}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-semibold text-base drop-shadow-md">{member.name}</h3>
                        <p className="text-white/80 text-sm mt-1 drop-shadow-sm">{member.role}</p>
                      </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Mobile and Tablet view - show first 4 members */}
            <div className="lg:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 pb-4 md:gap-8" style={{ width: "calc(400% + 1.5rem)" }}>
                  {teamMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex-shrink-0 w-full text-center relative">
                      <div className="transition-all duration-200 hover:scale-105">
                        <div className="relative mb-4">
                          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full overflow-hidden border-4 border-white/30 shadow-xl hover:border-white/50 transition-all duration-200">
                            <Image
                              src={member.image_url || "/placeholder.svg"}
                              alt={member.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-white font-semibold text-sm md:text-base drop-shadow-md">
                            {member.name}
                          </h3>
                          <p className="text-white/80 text-sm md:text-sm mt-1 drop-shadow-sm">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white/60" : "bg-white/30"}`}></div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/our-team">
                <Button
                  size="lg"
                  className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                >
                  Explore Our Team
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="relative py-8 md:py-10 overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900">
        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-5 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float-slow" />
          <div className="absolute bottom-5 right-10 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl animate-float-gentle" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollReveal animation="fade-down" delay={0}>
            <div className="inline-block mb-2 md:mb-3 px-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium border border-white/30 text-xs">
              <Star className="inline-block h-3 w-3 mr-1 animate-pulse" />
              What Our Students Say
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 text-white">
              Transformative Experiences
            </h2>
          </ScrollReveal>

          <ScrollReveal animation="zoom-in" delay={200}>
            <div className="max-w-5xl mx-auto">
              <ReviewCarousel />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gradient-to-b from-emerald-50 via-white to-teal-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-200/30 rounded-full blur-2xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="font-playfair text-2xl sm:text-3xl font-semibold text-emerald-800 mb-2 sm:mb-3">
                Flexible Batches
              </h2>
              <p className="font-lora text-sm text-emerald-700/70 max-w-xl mx-auto px-4">
                Choose from our flexible schedule designed to harmonize with your natural rhythms.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Morning Batch */}
            <ScrollReveal animation="fade-right" delay={100}>
              <div className="border-emerald-200/40 hover:shadow-lg transition-all duration-300 hover-lift group">
                <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400 group-hover:h-2 transition-all duration-300"></div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  <h3 className="font-playfair text-lg sm:text-xl font-semibold text-emerald-800">Morning Batches</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {[{ time: "5:30 AM - 6:30 AM" }, { time: "6:40 AM - 7:40 AM" }, { time: "7:50 AM - 8:50 AM" }].map(
                    (slot, i) => (
                      <div key={i} className="flex items-center p-2 bg-amber-50/50 rounded-lg">
                        <span className="font-lora font-semibold text-emerald-800 text-sm">{slot.time}</span>
                      </div>
                    ),
                  )}
                </div>
                <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 text-xs">
                    Energizing Flow
                  </Badge>
                </CardContent>
              </div>
            </ScrollReveal>

            {/* Evening Batch */}
            <ScrollReveal animation="fade-left" delay={200}>
              <div className="border-emerald-200/40 hover:shadow-lg transition-all duration-300 hover-lift group">
                <div className="h-1 bg-gradient-to-r from-teal-400 to-emerald-500 group-hover:h-2 transition-all duration-300"></div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-2 rounded-full bg-teal-100">
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                  </div>
                  <h3 className="font-playfair text-lg sm:text-xl font-semibold text-emerald-800">Evening Batches</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {[{ time: "5:30 PM - 6:30 PM" }, { time: "6:40 PM - 7:40 PM" }, { time: "7:50 PM - 8:50 PM" }].map(
                    (slot, i) => (
                      <div key={i} className="flex items-center p-2 bg-teal-50/50 rounded-lg">
                        <span className="font-lora font-semibold text-emerald-800 text-sm">{slot.time}</span>
                      </div>
                    ),
                  )}
                </div>
                <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 text-xs">
                    Calming Practice
                  </Badge>
                </CardContent>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Wave Divider with Quote */}
      <section className="relative py-16 bg-gradient-to-b from-white via-emerald-50 to-emerald-100 overflow-hidden">
        {/* Decorative floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-24 h-24 bg-amber-300/20 rounded-full blur-2xl animate-float-gentle" />
          <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-teal-300/20 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block mb-6">
                <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <blockquote className="font-playfair text-2xl md:text-3xl lg:text-4xl text-emerald-800 leading-relaxed mb-6 italic">
                "Yoga is the journey of the self, through the self, to the self."
              </blockquote>
              <p className="font-lora text-emerald-600 text-lg">— Bhagavad Gita</p>
            </div>
          </ScrollReveal>
        </div>
        
        {/* Bottom wave SVG */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-emerald-950"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-emerald-950"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-emerald-950"></path>
          </svg>
        </div>
      </section>

      {/* Avatar Stack + CTA Section with Community Link */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl animate-breathe" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full mb-6 border border-emerald-500/30">
                Join Our Growing Family
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Be Part of a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Transformative</span> Community
              </h2>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <p className="font-lora text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                Join hundreds of practitioners who have discovered inner peace, physical wellness, and spiritual growth through our authentic yoga practices.
              </p>
            </ScrollReveal>

            {/* Avatar Stack */}
            <ScrollReveal animation="zoom-in" delay={300}>
              <div className="flex flex-col items-center gap-6 mb-10">
                <div className="flex -space-x-4">
                  {[
                    "bg-gradient-to-br from-emerald-400 to-emerald-600",
                    "bg-gradient-to-br from-teal-400 to-teal-600",
                    "bg-gradient-to-br from-amber-400 to-amber-600",
                    "bg-gradient-to-br from-emerald-500 to-teal-500",
                    "bg-gradient-to-br from-teal-500 to-emerald-600",
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${gradient} border-4 border-stone-900 flex items-center justify-center text-white font-bold text-lg shadow-xl hover:scale-110 hover:z-10 transition-transform duration-300`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-500 border-4 border-stone-900 flex items-center justify-center text-white font-bold text-sm shadow-xl">
                    500+
                  </div>
                </div>
                <p className="text-white/60 text-sm font-lora">
                  <span className="text-emerald-400 font-semibold">500+ students</span> have already started their wellness journey
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="zoom-in" delay={400}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleEnroll}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-10 py-7 text-lg font-semibold rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 group"
                >
                  Start Your Journey Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <a
                  href="https://whatsapp.com/channel/0029Vb6wVWi0lwgtLZg26b04"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                >
                  <MessageCircle className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="font-lora">Join WhatsApp</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white py-12 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-32 h-32 rounded-full bg-white/20 animate-float-gentle"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand Column */}
            <ScrollReveal animation="fade-right" delay={0}>
              <div>
                <div className="flex items-center gap-3 mb-4 group">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Image src="/images/logo.png" alt="Sthavishtah" fill className="object-cover" />
                  </div>
                  <span className="font-playfair text-xl font-semibold">STHAVISHTAH YOGA</span>
                </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Nurturing mind, body, and spirit through authentic yoga practices and natural wellness approaches.
              </p>
              <p className="text-white/60 text-xs">© 2026 STHAVISHTAH YOGA. All rights reserved.</p>
              </div>
            </ScrollReveal>

            {/* Contact Column */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div>
                <h3 className="font-playfair text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-white/80">Email:</span>
                  <span className="text-white">sthavishtah2024@gmail.com</span>
                </p>
                <p className="flex items-start gap-2">
                  <Instagram className="w-4 h-4 mt-0.5 text-white/80" />
                  <span className="text-white">@sthavishtah</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-white/80">Address:</span>
                  <span className="text-white">Bengaluru, India</span>
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Quick Links Column */}
            <ScrollReveal animation="fade-left" delay={200}>
              <div>
                <h3 className="font-playfair text-lg font-semibold mb-4">Quick Links</h3>
              <nav className="space-y-2 text-sm">
                  <Link href="/user/login" className="flex items-center gap-2 hover:text-white/80 transition-colors group">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Login
                  </Link>
                  <Link href="/user/register" className="flex items-center gap-2 hover:text-white/80 transition-colors group">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Register
                  </Link>
                  <Link href="/instructors" className="flex items-center gap-2 hover:text-white/80 transition-colors group">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Instructors
                  </Link>
                  <Link href="/admin" className="flex items-center gap-2 hover:text-white/80 transition-colors group">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Admin
                  </Link>
                </nav>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BatchTime({ number, time, isNew = false }) {
  return (
    <div className="flex items-center p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-green-50/80 to-emerald-50/80 hover:from-green-100/80 hover:to-emerald-100/80 transition-all duration-300 shadow-sm group border-green-100 hover:border-green-200 hover:shadow-md hover:-translate-y-0.5">
      <span className="mr-3 sm:mr-4 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-sm group-hover:from-green-700 group-hover:to-emerald-700 transition-colors">
        BATCH {number}
      </span>
      <span className="font-medium text-green-800 text-sm sm:text-base">{time}</span>
      {isNew && (
        <span className="ml-auto bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse shadow-sm">
          New
        </span>
      )}
    </div>
  )
}

function OfferingCard({ icon, title, description }) {
  return (
    <div className="flex-shrink-0 w-72 snap-center border-emerald-200/40 hover:shadow-xl transition-all duration-500 group bg-white/90 backdrop-blur-sm hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-3">
          <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-all duration-300 flex-shrink-0 group-hover:scale-110">
            {icon}
          </div>
          <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight group-hover:text-emerald-900 transition-colors">{title}</h3>
        </div>
        <p className="text-sm text-emerald-700/70 font-lora leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function WellnessCard({ icon, title, content }) {
  return (
    <div className="nature-card h-full group overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-2">
      <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
      <div className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300 shadow-md group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-700 group-hover:from-green-800 group-hover:to-emerald-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base">{content}</p>
        </div>
      </div>
    </div>
  )
}
