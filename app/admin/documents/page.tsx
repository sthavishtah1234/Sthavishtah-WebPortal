"use client"

import { useState, useEffect, useRef } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Edit, ExternalLink, FileText, Plus, Trash2, Database, Users, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"

interface Document {
  id: number
  title: string
  url: string
  description: string
  category: string
  created_at: string
  is_active: boolean
  is_visible: boolean
  subscription_id: number | null
  subscription_name?: string
}

interface UserDocument {
  id: number
  title: string
  url: string
  description: string
  category: string
  created_at: string
  is_active: boolean
  user_id: number
  user_name?: string
  user_email?: string
}

interface Subscription {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
}

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("general")
  const [documents, setDocuments] = useState<Document[]>([])
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddUserDocDialogOpen, setIsAddUserDocDialogOpen] = useState(false)
  const [isEditUserDocDialogOpen, setIsEditUserDocDialogOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [currentUserDocument, setCurrentUserDocument] = useState<UserDocument | null>(null)
  const [creatingTable, setCreatingTable] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "general",
    is_active: true,
    is_visible: true,
    subscription_id: "",
  })

  const [userDocFormData, setUserDocFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "general",
    is_active: true,
    user_id: "",
  })

  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [showUserResults, setShowUserResults] = useState(false)
  const userSearchRef = useRef<HTMLDivElement>(null)

  const categories = [
    { value: "general", label: "General" },
    { value: "course_material", label: "Course Material" },
    { value: "reference", label: "Reference" },
    { value: "tutorial", label: "Tutorial" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    checkTableAndFetchData()

    // Check for subscription ID in URL query params
    const subscriptionParam = searchParams.get("subscription")
    if (subscriptionParam) {
      setFormData((prev) => ({
        ...prev,
        subscription_id: subscriptionParam,
      }))

      // If we're coming from a subscription card, automatically open the add dialog
      setIsAddDialogOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [userSearchRef])

  async function checkTableAndFetchData() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Check if the documents table exists
      const { error: checkError } = await supabase.from("documents").select("id").limit(1)

      if (checkError && checkError.message.includes("does not exist")) {
        setTableExists(false)
        setLoading(false)
        return
      }

      // Fetch documents, subscriptions, and users in parallel
      const [documentsResult, userDocumentsResult, subscriptionsResult, usersResult] = await Promise.all([
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
        supabase.from("user_documents").select("*, users(name, email)").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("id, name"),
        supabase.from("users").select("id, name, email"),
      ])

      if (documentsResult.error && !documentsResult.error.message.includes("does not exist")) {
        throw documentsResult.error
      }

      // Process documents with subscription names
      const docsWithSubscriptions = await Promise.all(
        (documentsResult.data || []).map(async (doc) => {
          if (doc.subscription_id) {
            const { data } = await supabase.from("subscriptions").select("name").eq("id", doc.subscription_id).single()
            return { ...doc, subscription_name: data?.name || "Unknown" }
          }
          return doc
        }),
      )

      // Process user documents with user names
      const userDocsWithNames = (userDocumentsResult.data || []).map((doc) => {
        const userData = doc.users as any
        return {
          ...doc,
          user_name: userData?.name || "Unknown",
          user_email: userData?.email || "",
        }
      })

      setDocuments(docsWithSubscriptions || [])
      setUserDocuments(userDocsWithNames || [])
      setSubscriptions(subscriptionsResult.data || [])
      setUsers(usersResult.data || [])
      setTableExists(true)
    } catch (err: any) {
      // Only set error if it's not the "relation does not exist" error
      if (!err.message.includes("does not exist")) {
        setError(err.message || "Failed to fetch documents")
      } else {
        setTableExists(false)
      }
      console.error("Error fetching documents:", err)
    } finally {
      setLoading(false)
    }
  }

  async function createDocumentsTables() {
    try {
      setCreatingTable(true)
      const response = await fetch("/api/create-documents-table", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create documents tables")
      }

      // Wait a moment for the table to be created
      setTimeout(() => {
        setTableExists(true)
        checkTableAndFetchData()
        setCreatingTable(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to create documents tables")
      console.error("Error creating documents tables:", err)
      setCreatingTable(false)
    }
  }

  // General documents functions
  async function handleAddDocument() {
    try {
      const supabase = getSupabaseBrowserClient()

      // Convert empty subscription_id to null
      const dataToInsert = {
        ...formData,
        subscription_id: formData.subscription_id ? Number.parseInt(formData.subscription_id) : null,
      }

      const { data, error } = await supabase.from("documents").insert([dataToInsert]).select()

      if (error) throw error

      setIsAddDialogOpen(false)
      resetForm()
      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to add document")
      console.error("Error adding document:", err)
    }
  }

  async function handleUpdateDocument() {
    if (!currentDocument) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Convert empty subscription_id to null
      const dataToUpdate = {
        ...formData,
        subscription_id: formData.subscription_id ? Number.parseInt(formData.subscription_id) : null,
      }

      const { error } = await supabase.from("documents").update(dataToUpdate).eq("id", currentDocument.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      resetForm()
      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to update document")
      console.error("Error updating document:", err)
    }
  }

  async function handleDeleteDocument(id: number) {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("documents").delete().eq("id", id)

      if (error) throw error

      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to delete document")
      console.error("Error deleting document:", err)
    }
  }

  async function handleToggleDocumentStatus(id: number, currentStatus: boolean) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("documents").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to update document status")
      console.error("Error updating document status:", err)
    }
  }

  // User documents functions
  async function handleAddUserDocument() {
    try {
      const supabase = getSupabaseBrowserClient()

      const dataToInsert = {
        ...userDocFormData,
        user_id: Number.parseInt(userDocFormData.user_id),
      }

      const { data, error } = await supabase.from("user_documents").insert([dataToInsert]).select()

      if (error) throw error

      setIsAddUserDocDialogOpen(false)
      resetUserDocForm()
      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to add user document")
      console.error("Error adding user document:", err)
    }
  }

  async function handleUpdateUserDocument() {
    if (!currentUserDocument) return

    try {
      const supabase = getSupabaseBrowserClient()

      const dataToUpdate = {
        ...userDocFormData,
        user_id: Number.parseInt(userDocFormData.user_id),
      }

      const { error } = await supabase.from("user_documents").update(dataToUpdate).eq("id", currentUserDocument.id)

      if (error) throw error

      setIsEditUserDocDialogOpen(false)
      resetUserDocForm()
      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to update user document")
      console.error("Error updating user document:", err)
    }
  }

  async function handleDeleteUserDocument(id: number) {
    if (!confirm("Are you sure you want to delete this user document?")) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("user_documents").delete().eq("id", id)

      if (error) throw error

      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to delete user document")
      console.error("Error deleting user document:", err)
    }
  }

  async function handleToggleUserDocumentStatus(id: number, currentStatus: boolean) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("user_documents").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      checkTableAndFetchData()
    } catch (err: any) {
      setError(err.message || "Failed to update user document status")
      console.error("Error updating user document status:", err)
    }
  }

  function editDocument(document: Document) {
    setCurrentDocument(document)
    setFormData({
      title: document.title,
      url: document.url,
      description: document.description,
      category: document.category,
      is_active: document.is_active,
      is_visible: document.is_visible,
      subscription_id: document.subscription_id ? document.subscription_id.toString() : "",
    })
    setIsEditDialogOpen(true)
  }

  function editUserDocument(document: UserDocument) {
    setCurrentUserDocument(document)
    setUserDocFormData({
      title: document.title,
      url: document.url,
      description: document.description,
      category: document.category,
      is_active: document.is_active,
      user_id: document.user_id.toString(),
    })

    // Find the user to display in the search box
    const user = users.find((u) => u.id === document.user_id)
    if (user) {
      setUserSearchQuery(`${user.name} (${user.email})`)
    }

    setIsEditUserDocDialogOpen(true)
  }

  function resetForm() {
    setFormData({
      title: "",
      url: "",
      description: "",
      category: "general",
      is_active: true,
      is_visible: true,
      subscription_id: "",
    })
    setCurrentDocument(null)
  }

  function resetUserDocForm() {
    setUserDocFormData({
      title: "",
      url: "",
      description: "",
      category: "general",
      is_active: true,
      user_id: "",
    })
    setUserSearchQuery("")
    setCurrentUserDocument(null)
  }

  function handleAddDialogOpen() {
    resetForm()
    setIsAddDialogOpen(true)
  }

  function handleAddUserDocDialogOpen() {
    resetUserDocForm()
    setIsAddUserDocDialogOpen(true)
  }

  function handleUserSearch(query: string) {
    setUserSearchQuery(query)

    if (query.trim() === "") {
      setFilteredUsers([])
      return
    }

    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase()),
    )

    setFilteredUsers(filtered)
    setShowUserResults(true)
  }

  function selectUser(user: User) {
    setUserDocFormData({ ...userDocFormData, user_id: user.id.toString() })
    setUserSearchQuery(`${user.name} (${user.email})`)
    setShowUserResults(false)
  }

  if (!tableExists) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>

          <Card>
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>
                The documents tables don't exist in your database yet. You need to create them before you can manage
                documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Database className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Database Tables Not Found</h3>
              <p className="text-center text-gray-500 mb-6 max-w-md">
                To use the document management feature, you need to create the required database tables first.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => window.open("/admin/debug", "_blank")} variant="outline" className="mr-2">
                Go to Debug Page
              </Button>
              <Button disabled={creatingTable} onClick={createDocumentsTables}>
                {creatingTable ? "Creating Tables..." : "Initialize Documents Tables"}
              </Button>
            </CardFooter>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Setup Instructions</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                To manually set up the documents tables, run the SQL from the db/documents_enhanced_schema.sql file in
                your Supabase SQL editor.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">General Documents</TabsTrigger>
            <TabsTrigger value="user">User-Specific Documents</TabsTrigger>
          </TabsList>

          {/* General Documents Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleAddDialogOpen}>
                <Plus className="mr-2 h-4 w-4" /> Add Document
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>General Documents</CardTitle>
                <CardDescription>
                  Manage documents that users can access based on their subscription. Documents with no subscription are
                  available to all users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading documents...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <FileText className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500">No documents found</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first document to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>
                              {categories.find((c) => c.value === doc.category)?.label || doc.category}
                            </TableCell>
                            <TableCell>
                              {doc.subscription_id ? (
                                <Badge variant="outline">{doc.subscription_name}</Badge>
                              ) : (
                                <Badge>All Users</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={doc.is_active ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleDocumentStatus(doc.id, doc.is_active)}
                              >
                                {doc.is_active ? "Active" : "Inactive"}
                              </Button>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                <span className="truncate">{doc.url}</span>
                                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="icon" onClick={() => editDocument(doc)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteDocument(doc.id)}>
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
          </TabsContent>

          {/* User-Specific Documents Tab */}
          <TabsContent value="user" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleAddUserDocDialogOpen}>
                <Plus className="mr-2 h-4 w-4" /> Add User Document
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User-Specific Documents</CardTitle>
                <CardDescription>
                  Manage documents that are assigned to specific users. These documents are only visible to the assigned
                  user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading user documents...</p>
                  </div>
                ) : userDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Users className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500">No user-specific documents found</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first user document to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{doc.user_name}</div>
                                <div className="text-xs text-gray-500">{doc.user_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {categories.find((c) => c.value === doc.category)?.label || doc.category}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={doc.is_active ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleUserDocumentStatus(doc.id, doc.is_active)}
                              >
                                {doc.is_active ? "Active" : "Inactive"}
                              </Button>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                <span className="truncate">{doc.url}</span>
                                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="icon" onClick={() => editUserDocument(doc)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteUserDocument(doc.id)}
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
          </TabsContent>
        </Tabs>

        {/* Add General Document Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Add a document link that users can access based on their subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document Title"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">
                  Document URL
                </label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="subscription" className="text-sm font-medium">
                  Subscription (Optional)
                </label>
                <Select
                  value={formData.subscription_id}
                  onValueChange={(value) => setFormData({ ...formData, subscription_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Available to all users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Available to all users</SelectItem>
                    {subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.subscription_id && formData.subscription_id !== "all" && (
                  <p className="text-xs text-blue-600">
                    This document will only be available to users with the selected subscription.
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  If no subscription is selected, the document will be available to all users.
                </p>
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is-active" className="text-sm font-medium">
                  Active (visible to users)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDocument}>Add Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit General Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>Update the document details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-url" className="text-sm font-medium">
                  Document URL
                </label>
                <Input
                  id="edit-url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-subscription" className="text-sm font-medium">
                  Subscription (Optional)
                </label>
                <Select
                  value={formData.subscription_id}
                  onValueChange={(value) => setFormData({ ...formData, subscription_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Available to all users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Available to all users</SelectItem>
                    {subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="edit-is-active" className="text-sm font-medium">
                  Active (visible to users)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDocument}>Update Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Document Dialog */}
        <Dialog open={isAddUserDocDialogOpen} onOpenChange={setIsAddUserDocDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add User-Specific Document</DialogTitle>
              <DialogDescription>Add a document that will only be visible to a specific user.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="user-doc-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="user-doc-title"
                  value={userDocFormData.title}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, title: e.target.value })}
                  placeholder="Document Title"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-doc-url" className="text-sm font-medium">
                  Document URL
                </label>
                <Input
                  id="user-doc-url"
                  value={userDocFormData.url}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-doc-user" className="text-sm font-medium">
                  User
                </label>
                <div className="relative" ref={userSearchRef}>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="user-doc-user"
                      placeholder="Search for a user..."
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={() => {
                        if (userSearchQuery.trim() !== "") {
                          setShowUserResults(true)
                        }
                      }}
                      className="pl-8"
                    />
                  </div>
                  {showUserResults && filteredUsers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1">
                        {filteredUsers.map((user) => (
                          <li
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showUserResults && filteredUsers.length === 0 && userSearchQuery.trim() !== "" && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-doc-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={userDocFormData.category}
                  onValueChange={(value) => setUserDocFormData({ ...userDocFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-doc-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="user-doc-description"
                  value={userDocFormData.description}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, description: e.target.value })}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="user-doc-is-active"
                  checked={userDocFormData.is_active}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="user-doc-is-active" className="text-sm font-medium">
                  Active (visible to user)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDocDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUserDocument}>Add User Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Document Dialog */}
        <Dialog open={isEditUserDocDialogOpen} onOpenChange={setIsEditUserDocDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Document</DialogTitle>
              <DialogDescription>Update the user-specific document details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-user-doc-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-user-doc-title"
                  value={userDocFormData.title}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-user-doc-url" className="text-sm font-medium">
                  Document URL
                </label>
                <Input
                  id="edit-user-doc-url"
                  value={userDocFormData.url}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-user-doc-user" className="text-sm font-medium">
                  User
                </label>
                <div className="relative" ref={userSearchRef}>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="edit-user-doc-user"
                      placeholder="Search for a user..."
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={() => {
                        if (userSearchQuery.trim() !== "") {
                          setShowUserResults(true)
                        }
                      }}
                      className="pl-8"
                    />
                  </div>
                  {showUserResults && filteredUsers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1">
                        {filteredUsers.map((user) => (
                          <li
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showUserResults && filteredUsers.length === 0 && userSearchQuery.trim() !== "" && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-user-doc-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={userDocFormData.category}
                  onValueChange={(value) => setUserDocFormData({ ...userDocFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-user-doc-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-user-doc-description"
                  value={userDocFormData.description}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-user-doc-is-active"
                  checked={userDocFormData.is_active}
                  onChange={(e) => setUserDocFormData({ ...userDocFormData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="edit-user-doc-is-active" className="text-sm font-medium">
                  Active (visible to user)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserDocDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUserDocument}>Update User Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
