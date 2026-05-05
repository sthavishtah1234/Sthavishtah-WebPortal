"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Trash2, Copy, Check, Link2, Users, ExternalLink } from "lucide-react"
import Link from "next/link"

interface InfluencerLink {
  id: string
  code: string
  influencer_name: string
  notes: string | null
  is_active: boolean
  created_at: string
  booking_count: number
}

export default function InfluencerLinksPage() {
  const [links, setLinks] = useState<InfluencerLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    influencer_name: "",
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/influencer-links")
      const data = await res.json()
      if (data.success) {
        setLinks(data.links)
      }
    } catch (err) {
      console.error("Failed to fetch links:", err)
    } finally {
      setLoading(false)
    }
  }

  const createLink = async () => {
    if (!formData.code || !formData.influencer_name) {
      setError("Code and name are required")
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/influencer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setLinks([{ ...data.link, booking_count: 0 }, ...links])
        setFormData({ code: "", influencer_name: "", notes: "" })
        setShowForm(false)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to create link")
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const res = await fetch("/api/influencer-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      })
      const data = await res.json()

      if (data.success) {
        setLinks(links.map(l => l.id === id ? { ...l, is_active } : l))
      }
    } catch (err) {
      console.error("Failed to toggle:", err)
    }
  }

  const deleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this influencer link?")) return

    try {
      const res = await fetch(`/api/influencer-links?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        setLinks(links.filter(l => l.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  const copyLink = (code: string) => {
    const link = `${baseUrl}/events?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const totalBookings = links.reduce((sum, l) => sum + l.booking_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Influencer Links</h1>
              <p className="text-gray-600">Generate tracking links for influencers</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Link2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Links</p>
                  <p className="text-2xl font-bold">{links.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Check className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Links</p>
                  <p className="text-2xl font-bold">{links.filter(l => l.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Influencer Link</CardTitle>
              <CardDescription>Generate a unique tracking link for an influencer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })}
                    placeholder="e.g., john, sarah"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link: {baseUrl}/events?ref={formData.code || "code"}
                  </p>
                </div>
                <div>
                  <Label>Influencer Name *</Label>
                  <Input
                    value={formData.influencer_name}
                    onChange={(e) => setFormData({ ...formData, influencer_name: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Instagram, YouTube"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createLink} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
                  {creating ? "Creating..." : "Create Link"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Influencer Links</CardTitle>
            <CardDescription>Track bookings from each influencer</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No influencer links yet. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{link.influencer_name}</p>
                          {link.notes && <p className="text-xs text-gray-500">{link.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{link.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-[200px] truncate">
                            /events?ref={link.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyLink(link.code)}
                          >
                            {copiedCode === link.code ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-lg">{link.booking_count}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={(checked) => toggleActive(link.id, checked)}
                          />
                          <span className={link.is_active ? "text-green-600" : "text-gray-400"}>
                            {link.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(link.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
