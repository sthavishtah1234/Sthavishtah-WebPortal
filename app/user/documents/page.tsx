"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Search, AlertCircle, Database } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Document {
  id: number
  title: string
  url: string
  description: string
  category: string
  created_at: string
  is_visible: boolean
}

export default function UserDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = [
    { value: "all", label: "All Documents" },
    { value: "general", label: "General" },
    { value: "course_material", label: "Course Material" },
    { value: "reference", label: "Reference" },
    { value: "tutorial", label: "Tutorial" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    checkTableAndFetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [searchQuery, activeCategory, documents])

  async function checkTableAndFetchDocuments() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Check if the table exists
      const { error: checkError } = await supabase.from("documents").select("id").limit(1)

      if (checkError && checkError.message.includes("does not exist")) {
        setTableExists(false)
        setLoading(false)
        return
      }

      // If we get here, the table exists, so fetch documents
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
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

  function filterDocuments() {
    let filtered = [...documents]

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) => doc.title.toLowerCase().includes(query) || doc.description.toLowerCase().includes(query),
      )
    }

    setFilteredDocuments(filtered)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value)
  }

  function handleCategoryChange(category: string) {
    setActiveCategory(category)
  }

  if (!tableExists) {
    return (
      <UserLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>

          <Card>
            <CardHeader>
              <CardTitle>Documents Coming Soon</CardTitle>
              <CardDescription>The documents feature is currently being set up by the administrators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Database className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Available Yet</h3>
              <p className="text-center text-gray-500 mb-6 max-w-md">
                Please check back later. The administrators are working on adding documents for you to access.
              </p>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-8" value={searchQuery} onChange={handleSearch} />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" value={activeCategory} onValueChange={handleCategoryChange}>
          <TabsList className="mb-4 overflow-x-auto flex-nowrap">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.value} value={category.value}>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FileText className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No documents found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or category filter</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>
                          {categories.find((c) => c.value === doc.category)?.label || doc.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 line-clamp-3">{doc.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Document
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </UserLayout>
  )
}
