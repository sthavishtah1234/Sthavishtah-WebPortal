"use client"

import { useState, useEffect } from "react"
import SwarasyaAdminLayout from "@/components/swarasya-admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, RefreshCw, Disc3, Save, X, Eye, EyeOff, Music, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase"

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
  created_at: string
}

export default function SwarasyaAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [deleteAlbumId, setDeleteAlbumId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    tracks: 0,
    image_url: "",
    spotify_link: "",
    youtube_link: "",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("swarasya_albums")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) {
        if (error.message.includes("does not exist")) {
          setError("Please run the swarasya_schema.sql script in your Supabase database first!")
          setLoading(false)
          return
        }
        throw error
      }
      setAlbums(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      year: "",
      tracks: 0,
      image_url: "",
      spotify_link: "",
      youtube_link: "",
    })
  }

  const handleAdd = () => {
    setShowAddDialog(true)
    resetForm()
  }

  const handleEdit = (album: Album) => {
    setSelectedAlbum(album)
    setFormData({
      title: album.title,
      year: album.year || "",
      tracks: album.tracks || 0,
      image_url: album.image_url || "",
      spotify_link: album.spotify_link || "",
      youtube_link: album.youtube_link || "",
    })
    setShowEditDialog(true)
  }

  const handleDelete = (id: number) => {
    setDeleteAlbumId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteAlbumId) return

    try {
      const { error } = await supabase.from("swarasya_albums").delete().eq("id", deleteAlbumId)

      if (error) throw error
      setSuccess("Album deleted successfully!")
      await fetchAlbums()
      setShowDeleteDialog(false)
      setDeleteAlbumId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSave = async () => {
    try {
      if (selectedAlbum) {
        const { error } = await supabase
          .from("swarasya_albums")
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", selectedAlbum.id)

        if (error) throw error
        setSuccess("Album updated successfully!")
        setShowEditDialog(false)
      } else {
        const maxOrder = albums.length > 0 ? Math.max(...albums.map((a) => a.display_order)) : 0
        const { error } = await supabase.from("swarasya_albums").insert({
          ...formData,
          display_order: maxOrder + 1,
          is_active: true,
        })

        if (error) throw error
        setSuccess("Album added successfully!")
        setShowAddDialog(false)
      }

      await fetchAlbums()
      resetForm()
      setSelectedAlbum(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleVisibility = async (album: Album) => {
    try {
      const { error } = await supabase
        .from("swarasya_albums")
        .update({ is_active: !album.is_active, updated_at: new Date().toISOString() })
        .eq("id", album.id)

      if (error) throw error
      setSuccess(`Album ${album.is_active ? "hidden from" : "shown on"} public page`)
      await fetchAlbums()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const activeAlbums = albums.filter((a) => a.is_active)
  const totalTracks = albums.reduce((sum, album) => sum + (album.tracks || 0), 0)

  return (
    <SwarasyaAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Albums
            </h1>
            <p className="text-gray-600 mt-1">
              {activeAlbums.length} of {albums.length} albums visible on public page | {totalTracks} total tracks
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchAlbums} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Album
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

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 flex justify-between items-center">
              <p className="text-green-600">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Albums Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-purple-800">All Albums</CardTitle>
            <CardDescription>Toggle the switch to show/hide albums on the public Swarasya page</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : albums.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Disc3 className="h-12 w-12 mb-2 text-gray-300" />
                <p>No albums yet. Add your first album!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-20">Visible</TableHead>
                      <TableHead>Cover</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Tracks</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albums.map((album) => (
                      <TableRow key={album.id} className={`hover:bg-gray-50 ${!album.is_active ? "opacity-60" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={album.is_active}
                              onCheckedChange={() => toggleVisibility(album)}
                            />
                            {album.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded overflow-hidden border-2 border-purple-200 bg-gray-100">
                            {album.image_url ? (
                              <Image
                                src={album.image_url}
                                alt={album.title}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Disc3 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{album.title}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {album.year || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>{album.tracks} tracks</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {album.spotify_link && (
                              <Link href={album.spotify_link} target="_blank" className="text-green-600 hover:text-green-800">
                                <Music className="h-4 w-4" />
                              </Link>
                            )}
                            {album.youtube_link && (
                              <Link href={album.youtube_link} target="_blank" className="text-red-600 hover:text-red-800">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}
                            {!album.spotify_link && !album.youtube_link && (
                              <span className="text-gray-400 text-sm">No links</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(album)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(album.id)}
                              className="hover:bg-red-50 hover:border-red-300 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Drive Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 text-lg">How to Add Album Covers from Google Drive</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 text-sm space-y-2">
            <p>1. Upload your album cover image to Google Drive</p>
            <p>2. Right-click on the image and select &quot;Get link&quot;</p>
            <p>3. Make sure it&apos;s set to &quot;Anyone with the link can view&quot;</p>
            <p>4. Copy the file ID from the URL (the long string between /d/ and /view)</p>
            <p>5. Use this format for the Image URL:</p>
            <code className="block bg-blue-100 p-2 rounded mt-2">
              https://drive.google.com/uc?export=view&id=YOUR_FILE_ID
            </code>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setShowEditDialog(false)
            resetForm()
            setSelectedAlbum(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-purple-800">
              {selectedAlbum ? "Edit Album" : "Add New Album"}
            </DialogTitle>
            <DialogDescription>
              {selectedAlbum ? "Update the album information" : "Add a new album to your discography"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Album title"
                />
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <Label>Number of Tracks</Label>
                <Input
                  type="number"
                  value={formData.tracks}
                  onChange={(e) => setFormData({ ...formData, tracks: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://drive.google.com/uc?export=view&id=..."
                />
              </div>

              <div>
                <Label>Spotify Link</Label>
                <Input
                  value={formData.spotify_link}
                  onChange={(e) => setFormData({ ...formData, spotify_link: e.target.value })}
                  placeholder="https://open.spotify.com/album/..."
                />
              </div>

              <div>
                <Label>YouTube Link</Label>
                <Input
                  value={formData.youtube_link}
                  onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setShowEditDialog(false)
                resetForm()
                setSelectedAlbum(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!formData.title}
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedAlbum ? "Update" : "Add"} Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Album
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SwarasyaAdminLayout>
  )
}
