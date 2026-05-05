"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, RefreshCw, Users, Eye, EyeOff, Save, X } from "lucide-react"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

interface TeamMember {
  id: number
  name: string
  role: string
  image_url: string
  experience: string
  bio: string
  specialization: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showTeamSection, setShowTeamSection] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    image_url: "",
    experience: "",
    bio: "",
    specialization: "",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchTeamMembers()
    fetchSiteSettings()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "show_our_team_section")
        .single()

      if (error) {
        // If table doesn't exist, show helpful error message
        if (error.message.includes("does not exist")) {
          setError("Please run the site_settings_schema.sql script in your main database first!")
        }
        console.error("Error fetching site settings:", error)
        return
      }
      setShowTeamSection(data?.setting_value ?? true)
    } catch (err: any) {
      console.error("Error fetching site settings:", err)
    }
  }

  const handleToggleVisibility = async (checked: boolean) => {
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          setting_key: "show_our_team_section",
          setting_value: checked,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      )

      if (error) {
        if (error.message.includes("does not exist")) {
          setError("Please run the site_settings_schema.sql script in your main database first!")
        } else {
          setError(error.message)
        }
        return
      }
      setShowTeamSection(checked)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      image_url: "",
      experience: "",
      bio: "",
      specialization: "",
    })
  }

  const handleAdd = () => {
    setShowAddDialog(true)
    resetForm()
  }

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      image_url: member.image_url,
      experience: member.experience,
      bio: member.bio,
      specialization: member.specialization,
    })
    setShowEditDialog(true)
  }

  const handleDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await supabase.from("team_members").delete().eq("id", deleteId)

      if (error) throw error
      await fetchTeamMembers()
      setShowDeleteDialog(false)
      setDeleteId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSave = async () => {
    try {
      if (selectedMember) {
        // Edit existing member
        const { error } = await supabase
          .from("team_members")
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", selectedMember.id)

        if (error) throw error
        setShowEditDialog(false)
      } else {
        // Add new member
        const maxOrder = teamMembers.length > 0 ? Math.max(...teamMembers.map((m) => m.display_order)) : 0
        const { error } = await supabase.from("team_members").insert({
          ...formData,
          display_order: maxOrder + 1,
          is_active: true,
        })

        if (error) throw error
        setShowAddDialog(false)
      }

      await fetchTeamMembers()
      resetForm()
      setSelectedMember(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const activeMembers = teamMembers.filter((m) => m.is_active)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Team Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your yoga instructors and team members</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchTeamMembers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
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

        <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              {showTeamSection ? <Eye className="h-5 w-5 mr-2" /> : <EyeOff className="h-5 w-5 mr-2" />}
              Our Team Section Visibility
            </CardTitle>
            <CardDescription>Control whether the Our Team section appears on the homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Switch
                id="team-visibility"
                checked={showTeamSection}
                onCheckedChange={handleToggleVisibility}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="team-visibility" className="text-base font-medium cursor-pointer">
                {showTeamSection ? (
                  <span className="text-green-700">Our Team section is VISIBLE on homepage</span>
                ) : (
                  <span className="text-gray-600">Our Team section is HIDDEN on homepage</span>
                )}
              </Label>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              When enabled, visitors can see the Our Team section on the homepage with a button to explore the full team
              page.
            </p>
          </CardContent>
        </Card>

        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-green-700">{teamMembers.length}</p>
                  <p className="text-green-600">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-blue-700">{activeMembers.length}</p>
                  <p className="text-blue-600">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                {showTeamSection ? (
                  <Eye className="h-8 w-8 text-purple-600" />
                ) : (
                  <EyeOff className="h-8 w-8 text-gray-400" />
                )}
                <div className="ml-4">
                  <p className="text-2xl font-bold text-purple-700">{showTeamSection ? "Visible" : "Hidden"}</p>
                  <p className="text-purple-600">Section Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-green-800">Team Members</CardTitle>
            <CardDescription>Manage your yoga instructors and their information</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200">
                            <Image
                              src={member.image_url || "/placeholder.svg"}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {member.experience}
                          </span>
                        </TableCell>
                        <TableCell>{member.specialization}</TableCell>
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
            <DialogTitle className="text-green-800">
              {selectedMember ? "Edit Team Member" : "Add New Team Member"}
            </DialogTitle>
            <DialogDescription>
              {selectedMember ? "Update the team member information" : "Add a new instructor to your team"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Senior Yoga Instructor"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Experience</label>
                <Input
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 5+ years"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/path/to/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Specialization</label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Hatha Yoga, Meditation"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief description of expertise and background"
                  rows={6}
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
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
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
              This action cannot be undone. This will permanently delete the team member from your website.
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
    </AdminLayout>
  )
}
