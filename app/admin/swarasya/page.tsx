"use client"

import { useState, useEffect } from "react"
import SwarasyaAdminLayout from "@/components/swarasya-admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Disc3, Music, RefreshCw, ExternalLink, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface BandMember {
  id: number
  name: string
  is_active: boolean
}

interface Album {
  id: number
  title: string
  tracks: number
  is_active: boolean
}

export default function SwarasyaDashboardPage() {
  const [members, setMembers] = useState<BandMember[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: membersData, error: membersError } = await supabase
        .from("swarasya_members")
        .select("id, name, is_active")
        .order("display_order", { ascending: true })

      if (membersError) {
        if (membersError.message.includes("does not exist")) {
          setError("Please run the swarasya_schema.sql script in your Supabase database first!")
          setLoading(false)
          return
        }
        throw membersError
      }
      setMembers(membersData || [])

      const { data: albumsData, error: albumsError } = await supabase
        .from("swarasya_albums")
        .select("id, title, tracks, is_active")
        .order("display_order", { ascending: true })

      if (albumsError && !albumsError.message.includes("does not exist")) {
        throw albumsError
      }
      setAlbums(albumsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeMembers = members.filter((m) => m.is_active)
  const activeAlbums = albums.filter((a) => a.is_active)
  const totalTracks = albums.reduce((sum, album) => sum + (album.tracks || 0), 0)

  return (
    <SwarasyaAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Swarasya Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Overview of your band management</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/swarasya" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Page
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-amber-700">{members.length}</p>
                  <p className="text-amber-600 font-medium">Total Members</p>
                </div>
                <Users className="h-10 w-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-700">{activeMembers.length}</p>
                  <p className="text-green-600 font-medium">Visible Members</p>
                </div>
                <Eye className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-700">{albums.length}</p>
                  <p className="text-purple-600 font-medium">Total Albums</p>
                </div>
                <Disc3 className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-teal-700">{totalTracks}</p>
                  <p className="text-teal-600 font-medium">Total Tracks</p>
                </div>
                <Music className="h-10 w-10 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Users className="h-5 w-5" />
                Band Members
              </CardTitle>
              <CardDescription>
                Manage your Swarasya band members. Toggle visibility to show/hide on the public page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Eye className="h-4 w-4" /> {activeMembers.length} visible
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <EyeOff className="h-4 w-4" /> {members.length - activeMembers.length} hidden
                  </span>
                </div>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <Link href="/admin/swarasya/members">
                  Manage Members
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Disc3 className="h-5 w-5" />
                Albums
              </CardTitle>
              <CardDescription>
                Manage your discography. Toggle visibility to show/hide albums on the public page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Eye className="h-4 w-4" /> {activeAlbums.length} visible
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <EyeOff className="h-4 w-4" /> {albums.length - activeAlbums.length} hidden
                  </span>
                </div>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Link href="/admin/swarasya/albums">
                  Manage Albums
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">How Visibility Works</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>
              <strong>Toggle ON (Visible):</strong> The item will be displayed on the public Swarasya page.
            </p>
            <p>
              <strong>Toggle OFF (Hidden):</strong> The item will be hidden from the public page but still exists in admin.
            </p>
            <p className="text-sm text-blue-600 mt-4">
              Use the visibility toggle to control what visitors see without deleting content.
            </p>
          </CardContent>
        </Card>
      </div>
    </SwarasyaAdminLayout>
  )
}
