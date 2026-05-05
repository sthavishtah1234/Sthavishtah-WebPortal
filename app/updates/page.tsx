import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Info, Package, Calendar, ArrowRight } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

async function getSubscriptionCategories() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("subscription_pages")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching subscription categories:", error)
    return []
  }

  return data || []
}

async function getUpdates() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("updates").select("*").order("created_at", { ascending: false }).limit(5)

  if (error) {
    console.error("Error fetching updates:", error)
    return []
  }

  return data || []
}

export default async function Updates() {
  const subscriptionCategories = await getSubscriptionCategories()
  const updates = await getUpdates()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white py-3 px-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center">
          <div className="relative h-10 w-10 mr-3">
            <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">STHAVISHTAH</span>
            <span className="text-xs tracking-widest text-muted-foreground">YOGA AND WELLNESS</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 text-purple-700 border-purple-200 font-medium"
            >
              <Link href="/user/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-medium">
              <Link href="/user/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Updates & Programs</h1>
        </div>

        {/* Latest Updates Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Info className="mr-2 h-5 w-5 text-purple-600" />
            Latest Updates
          </h2>

          <div className="space-y-4">
            {updates.length > 0 ? (
              updates.map((update) => (
                <Card key={update.id} className="overflow-hidden hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{update.title}</CardTitle>
                      <Badge
                        className={`
                          ${update.type === "schedule" ? "bg-blue-100 text-blue-800" : ""}
                          ${update.type === "system" ? "bg-amber-100 text-amber-800" : ""}
                          ${update.type === "course" ? "bg-green-100 text-green-800" : ""}
                          ${update.type === "announcement" ? "bg-purple-100 text-purple-800" : ""}
                        `}
                      >
                        {update.type}
                      </Badge>
                    </div>
                    <CardDescription>{new Date(update.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{update.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-100 rounded-lg">
                <p>No updates available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </section>

        {/* Subscription Categories Section ONLY */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Package className="mr-2 h-5 w-5 text-purple-600" />
            Wellness Programs
          </h2>

          {subscriptionCategories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscriptionCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${category.hero_image_url || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(category.title)}`})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{category.title}</h3>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <p className="text-gray-600 mb-4 line-clamp-2">{category.subtitle}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(category.created_at).toLocaleDateString()}
                      </div>
                      <Link href={`/user/subscription-categories/${category.slug}?from=updates`}>
                        <Button variant="outline" size="sm" className="group-hover:bg-purple-50">
                          View Details{" "}
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
              <p>No program categories available at the moment. Please check back later.</p>
            </div>
          )}
        </section>

        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Bell className="mr-2 h-5 w-5 text-purple-600" />
                Ready to Join?
              </CardTitle>
              <CardDescription>
                Register or login to subscribe and access all our yoga and wellness content
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/user/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/user/register">Register Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
