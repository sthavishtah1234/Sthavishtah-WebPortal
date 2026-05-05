"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Edit, Trash2, Plus, Check, X } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("announcement")
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  useEffect(() => {
    fetchUpdates()
  }, [])

  async function fetchUpdates() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("updates").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUpdates(data || [])
    } catch (err) {
      console.error("Error fetching updates:", err)
      setError("Failed to load updates. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title.trim() || !content.trim() || !type) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const supabase = getSupabaseBrowserClient()

      if (isEditing) {
        // Update existing record
        const { error } = await supabase
          .from("updates")
          .update({
            title,
            content,
            type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentId)

        if (error) throw error

        setSuccess("Update successfully edited!")
      } else {
        // Insert new record
        const { error } = await supabase.from("updates").insert([
          {
            title,
            content,
            type,
          },
        ])

        if (error) throw error

        setSuccess("New update successfully added!")
      }

      // Reset form and refresh data
      resetForm()
      fetchUpdates()
    } catch (err) {
      console.error("Error saving update:", err)
      setError("Failed to save update. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this update?")) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("updates").delete().eq("id", id)

      if (error) throw error

      setSuccess("Update successfully deleted!")
      fetchUpdates()
    } catch (err) {
      console.error("Error deleting update:", err)
      setError("Failed to delete update. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(update) {
    setTitle(update.title)
    setContent(update.content)
    setType(update.type)
    setCurrentId(update.id)
    setIsEditing(true)
  }

  function resetForm() {
    setTitle("")
    setContent("")
    setType("announcement")
    setCurrentId(null)
    setIsEditing(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Updates</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Update" : "Create New Update"}</CardTitle>
            <CardDescription>
              {isEditing ? "Edit the selected update information" : "Add a new update to display on the updates page"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter update title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter update content"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select update type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="schedule">Schedule Change</SelectItem>
                    <SelectItem value="system">System Update</SelectItem>
                    <SelectItem value="course">New Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading} className={isEditing ? "" : "ml-auto"}>
                {isEditing ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Update
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Updates List */}
        <h2 className="text-xl font-semibold mt-8">Existing Updates</h2>

        {loading && <p>Loading updates...</p>}

        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <Card key={update.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{update.title}</CardTitle>
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
                  <CardDescription>
                    {new Date(update.created_at).toLocaleDateString()} at{" "}
                    {new Date(update.created_at).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{update.content}</p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(update)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(update.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
              <p>No updates found. Create your first update using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
