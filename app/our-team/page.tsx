"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Users, Award, BookOpen, Heart } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface TeamMember {
  id: number
  name: string
  role: string
  image_url: string
  experience: string
  bio: string
  specialization: string
  display_order: number
}

export default function OurTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!error && data) {
        setTeamMembers(data)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="w-full py-4 px-4 bg-white/90 backdrop-blur-md shadow-md border-b border-green-100">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="border-green-200 hover:bg-green-50 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="relative h-10 w-10 mr-3 overflow-hidden rounded-full border-2 border-green-100">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-emerald-700">
              STHAVISHTAH
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
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

        <div className="container mx-auto px-4 text-center relative">
          <span className="inline-block px-4 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-4 shadow-md border border-white/20">
            <Users className="inline-block mr-1 h-4 w-4" />
            Meet Our Team
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">Our Dedicated Instructors</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
            A passionate team of experienced yoga practitioners committed to guiding you on your journey to wellness,
            balance, and self-discovery.
          </p>
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {teamMembers.map((member) => (
                <Card
                  key={member.id}
                  className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white"
                >
                  <div className="relative h-80 bg-gradient-to-br from-green-100 to-emerald-100">
                    <Image
                      src={member.image_url || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-1">{member.name}</h3>
                      <p className="text-emerald-200 font-semibold drop-shadow-md">{member.role}</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {member.experience}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mb-4">
                      <BookOpen className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-emerald-700">Specialization:</span> {member.specialization}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Heart className="h-5 w-5 text-pink-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{member.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaHQtNHptMC0zMFYwaC0ydjRoLTR2MmgtNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Join our community and experience the transformative power of yoga with our expert instructors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/user/register">
              <Button
                size="lg"
                className="bg-white text-green-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
              >
                Register Now
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-green-900 to-green-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">© {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
