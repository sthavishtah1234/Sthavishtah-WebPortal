"use client"

import { useState, useEffect } from "react"
import SwarasyaAdminLayout from "@/components/swarasya-admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, RefreshCw, Users, Save, X, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
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

interface BandMember {
  id: number
  name: string
  role: string
  instrument: string
  image_url: string
  bio: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function SwarasyaMembersPage() {
  const [members, setMembers] = useState<BandMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<BandMember | null>(null)
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    instrument: "",
    image_url: "",
    bio: "",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("swarasya_members")
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
      setMembers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      instrument: "",
      image_url: "",
      bio: "",
    })
  }

  const handleAdd = () => {
    setShowAddDialog(true)
    resetForm()
  }

  const handleEdit = (member: BandMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      instrument: member.instrument || "",
      image_url: member.image_url || "",
      bio: member.bio || "",
    })
    setShowEditDialog(true)
  }

  const handleDelete = (id: number) => {
    setDeleteMemberId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteMemberId) return

    try {
      const { error } = await supabase.from("swarasya_members").delete().eq("id", deleteMemberId)

      if (error) throw error
      setSuccess("Member deleted successfully!")
      await fetchMembers()
      setShowDeleteDialog(false)
      setDeleteMemberId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSave = async () => {
    try {
      if (selectedMember) {
        const { error } = await supabase
          .from("swarasya_members")
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", selectedMember.id)

        if (error) throw error
        setSuccess("Member updated successfully!")
        setShowEditDialog(false)
      } else {
        const maxOrder = members.length > 0 ? Math.max(...members.map((m) => m.display_order)) : 0
        const { error } = await supabase.from("swarasya_members").insert({
          ...formData,
          display_order: maxOrder + 1,
          is_active: true,
        })

        if (error) throw error
        setSuccess("Member added successfully!")
        setShowAddDialog(false)
      }

      await fetchMembers()
      resetForm()
      setSelectedMember(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleVisibility = async (member: BandMember) => {
    try {
      const { error } = await supabase
        .from("swarasya_members")
        .update({ is_active: !member.is_active, updated_at: new Date().toISOString() })
        .eq("id", member.id)

      if (error) throw error
      setSuccess(`Member ${member.is_active ? "hidden from" : "shown on"} public page`)
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const activeMembers = members.filter((m) => m.is_active)

  return (
    <SwarasyaAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Band Members
            </h1>
            <p className="text-gray-600 mt-1">
              {activeMembers.length} of {members.length} members visible on public page
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchMembers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
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

        {/* Members Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-amber-800">All Band Members</CardTitle>
            <CardDescription>Toggle the switch to show/hide members on the public Swarasya page</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Users className="h-12 w-12 mb-2 text-gray-300" />
                <p>No band members yet. Add your first member!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-20">Visible</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className={`hover:bg-gray-50 ${!member.is_active ? "opacity-60" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={member.is_active}
                              onCheckedChange={() => toggleVisibility(member)}
                            />
                            {member.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-200 bg-gray-100">
                            {member.image_url ? (
                              <Image
                                src={member.image_url}
                                alt={member.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>{member.instrument}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(member)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(member.id)}
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
            <CardTitle className="text-blue-800 text-lg">How to Add Images from Google Drive</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 text-sm space-y-2">
            <p>1. Upload your image to Google Drive</p>
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
            setSelectedMember(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-800">
              {selectedMember ? "Edit Band Member" : "Add New Band Member"}
            </DialogTitle>
            <DialogDescription>
              {selectedMember ? "Update the band member information" : "Add a new musician to Swarasya"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label>Role *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Lead Vocalist, Percussionist"
                />
              </div>

              <div>
                <Label>Instrument</Label>
                <Input
                  value={formData.instrument}
                  onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                  placeholder="e.g., Vocals & Harmonium"
                />
              </div>

              <div>
                <Label>Image URL (Google Drive)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://drive.google.com/uc?export=view&id=..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief description about the musician"
                  rows={8}
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
                setSelectedMember(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!formData.name || !formData.role}
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedMember ? "Update" : "Add"} Member
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
              This action cannot be undone. This will permanently delete the band member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SwarasyaAdminLayout>
  )
}
