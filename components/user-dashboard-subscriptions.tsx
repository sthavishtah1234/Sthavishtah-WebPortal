"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, ExternalLink } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface SubscriptionCategory {
  id: string
  title: string
  subtitle: string
  slug: string
  hero_image_url: string
  status: string
  created_at: string
}

export default function UserDashboardSubscriptions() {
  const [categories, setCategories] = useState<SubscriptionCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionCategories()
  }, [])

  const fetchSubscriptionCategories = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("subscription_pages")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching subscription categories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wellness Programs</h2>
        <Link href="/user/plans">
          <Button variant="outline" size="sm">
            View All <ExternalLink className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div
                className="h-40 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${
                    category.hero_image_url ||
                    `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(category.title)}`
                  })`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-bold">{category.title}</h3>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{category.subtitle}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(category.created_at).toLocaleDateString()}
                  </div>
                  <Link href={`/user/subscription-categories/${category.slug}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8 group-hover:bg-purple-50">
                      View <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No program categories available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
