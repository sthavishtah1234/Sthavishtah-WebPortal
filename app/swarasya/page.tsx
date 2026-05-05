"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Music, 
  Users, 
  Heart, 
  Play,
  Instagram, 
  Youtube,
  Mic2,
  Disc3,
  Sparkles
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface BandMember {
  id: number
  name: string
  role: string
  instrument: string
  image_url: string
  bio: string
  display_order: number
  is_active: boolean
}

interface Album {
  id: number
  title: string
  year: string
  tracks: number
  image_url: string
  spotify_link: string
  youtube_link: string
  display_order: number
  is_active: boolean
}

export default function SwarasyaPage() {
  const [scrolled, setScrolled] = useState(false)
  const [bandMembers, setBandMembers] = useState<BandMember[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch band members
        const { data: membersData } = await supabase
          .from("swarasya_members")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
        
        if (membersData) {
          setBandMembers(membersData)
        }

        // Fetch albums
        const { data: albumsData } = await supabase
          .from("swarasya_albums")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
        
        if (albumsData) {
          setAlbums(albumsData)
        }
      } catch (error) {
        console.error("Error fetching Swarasya data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
      {/* Header */}
      <header className={`w-full py-4 px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-stone-900/95 backdrop-blur-xl shadow-lg border-b border-amber-900/30" : "bg-transparent"
      }`}>
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center group">
            <Button variant="ghost" className="text-amber-100 hover:text-white hover:bg-amber-900/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="#" 
              className="p-2 text-amber-200/70 hover:text-amber-100 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link 
              href="#" 
              className="p-2 text-amber-200/70 hover:text-amber-100 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/riverside-yoga.jpg"
            alt="Swarasya Band"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl pt-20">
          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full mb-6 border border-amber-500/30">
              <Music className="inline-block mr-2 h-4 w-4 text-amber-400" />
              <span className="text-amber-200 text-sm font-medium tracking-wide">Spiritual Music Ensemble</span>
            </div>
          </div>

          <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 tracking-wider">
            S W A R A S Y A
          </h1>

          <p className="font-lora text-lg md:text-xl text-amber-100/80 max-w-2xl mx-auto leading-relaxed mb-10">
            Where ancient melodies meet modern souls. Music that transcends, heals, and elevates the spirit on its journey toward inner peace.
          </p>

          
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-amber-400/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-amber-400/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-4 border border-amber-500/30">
                <Sparkles className="inline-block mr-1 h-3 w-3" />
                Our Story
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-white mb-6">
                Music as a Path to <span className="text-amber-400">Inner Harmony</span>
              </h2>
              <p className="text-stone-300 leading-relaxed mb-6 font-lora">
                Swarasya was born from a shared passion for spiritual music and its power to transform lives. Our name, derived from Sanskrit, means "the essence of melody" - and that is exactly what we aim to deliver with every note we play.
              </p>
              <p className="text-stone-300 leading-relaxed mb-6 font-lora">
                Rooted in the ancient traditions of Indian classical music, we blend devotional bhajans, meditative ragas, and soul-stirring compositions to create an experience that transcends the ordinary and connects listeners to something greater than themselves.
              </p>
              <p className="text-stone-300 leading-relaxed font-lora">
                As part of the Sthavishtah Yoga & Wellness family, we believe that music and yoga share the same goal - to bring peace, balance, and awakening to those who seek it.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl">
                <Image
                  src="/images/swarasya-logo.jpeg"
                  alt="Swarasya Logo"
                  fill
                  className="object-contain bg-white p-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Band Members Section */}
      {bandMembers.length > 0 && (
        <section className="py-20 bg-stone-800/50">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-12">
              <div className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-4 border border-amber-500/30">
                <Users className="inline-block mr-1 h-3 w-3" />
                The Artists
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-white mb-4">
                Meet Our Musicians
              </h2>
              <p className="text-stone-400 max-w-2xl mx-auto font-lora">
                Talented artists united by a shared love for spiritual music and a mission to spread peace through melody.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bandMembers.map((member) => (
                <Card key={member.id} className="bg-stone-900/80 border-amber-900/30 overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden">
                    {member.image_url ? (
                      <Image
                        src={member.image_url}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-700 flex items-center justify-center">
                        <Users className="h-16 w-16 text-stone-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent"></div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-playfair text-xl font-semibold text-white mb-1">{member.name}</h3>
                    <p className="text-amber-400 text-sm font-medium mb-2">{member.role}</p>
                    <div className="flex items-center gap-2 text-stone-400 text-sm mb-3">
                      <Mic2 className="h-4 w-4" />
                      <span>{member.instrument}</span>
                    </div>
                    <p className="text-stone-400 text-sm font-lora leading-relaxed">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Albums Section */}
      {albums.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-12">
              <div className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-4 border border-amber-500/30">
                <Disc3 className="inline-block mr-1 h-3 w-3" />
                Discography
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-white mb-4">
                Our Albums
              </h2>
              <p className="text-stone-400 max-w-2xl mx-auto font-lora">
                Collections of spiritual music crafted to accompany your meditation, yoga practice, and moments of reflection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {albums.map((album) => (
              <Card key={album.id} className="bg-stone-800/50 border-amber-900/30 overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                <div className="relative aspect-square overflow-hidden">
                  {album.image_url ? (
                    <Image
                      src={album.image_url}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-700 flex items-center justify-center">
                      <Disc3 className="h-16 w-16 text-stone-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {album.spotify_link || album.youtube_link ? (
                      <Button 
                        size="lg" 
                        className="bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-full"
                        asChild
                      >
                        <Link href={album.spotify_link || album.youtube_link} target="_blank">
                          <Play className="h-5 w-5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-full">
                        <Play className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-xl font-semibold text-white mb-1">{album.title}</h3>
                  <div className="flex items-center justify-between text-stone-400 text-sm">
                    <span>{album.year}</span>
                    <span>{album.tracks} Tracks</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </section>
      )}

      {/* Connection to Yoga Section */}
      <section className="py-20 bg-gradient-to-r from-amber-900/30 via-stone-800/50 to-amber-900/30">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-4 border border-amber-500/30">
            <Heart className="inline-block mr-1 h-3 w-3" />
            Music & Wellness
          </div>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-white mb-6">
            Part of the Sthavishtah Family
          </h2>
          <p className="text-stone-300 leading-relaxed mb-8 font-lora text-lg">
            Swarasya is the musical heart of Sthavishtah Yoga & Wellness. Our compositions accompany meditation sessions, yoga classes, and spiritual gatherings, creating an atmosphere of tranquility and connection. We believe that when music and movement unite, transformation happens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold rounded-full">
              <Link href="/user/register">
                Join Our Yoga Sessions
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-amber-400/50 text-amber-100 hover:bg-amber-500/20 rounded-full">
              <Link href="/">
                Explore Sthavishtah
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-amber-900/30 py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-500/30 bg-white">
                <Image src="/images/swarasya-logo.jpeg" alt="Swarasya" fill className="object-contain p-1" />
              </div>
              <div>
                <p className="font-playfair text-lg font-semibold text-white">SWARASYA</p>
                <p className="text-stone-400 text-sm">A Sthavishtah Initiative</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="p-2 text-stone-400 hover:text-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="p-2 text-stone-400 hover:text-amber-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800 text-center">
            <p className="text-stone-500 text-sm">
              &copy; {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
