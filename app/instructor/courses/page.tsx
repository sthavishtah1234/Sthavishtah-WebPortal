"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InstructorLayout } from "@/components/instructor-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Calendar, Filter, SortAsc } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  is_predefined_batch: boolean
  batch_number: string | null
  custom_batch_time: string | null
  subscription_id: number | null
  language: string
  created_at: string
  scheduling_type: string
  subscription_day: number | null
  subscription_week: number | null
  instructor_id: number | null
}

type SortOption = "date" | "title" | "language"

export default function InstructorCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [instructorId, setInstructorId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null)
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])

  useEffect(() => {
    const id = localStorage.getItem("instructorId")
    if (id) {
      setInstructorId(Number.parseInt(id))
      fetchCourses(Number.parseInt(id))
    }
  }, [])

  const fetchCourses = async (instructorId: number) => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch only courses created by this instructor
      // Remove created_by_type filter for now since column doesn't exist yet
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("scheduled_date", { ascending: false })

      if (error) throw error

      setCourses(data || [])

      // Extract unique languages for filtering
      const languages = [...new Set(data?.map((course) => course.language) || [])]
      setAvailableLanguages(languages)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (id: number) => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Only check instructor_id for now
      const { error } = await supabase.from("courses").delete().eq("id", id).eq("instructor_id", instructorId)

      if (error) throw error

      // Remove the deleted course from state
      setCourses(courses.filter((course) => course.id !== id))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const confirmDelete = (id: number) => {
    setCourseToDelete(id)
    setDeleteDialogOpen(true)
  }

  const getSortedAndFilteredCourses = () => {
    return courses
      .filter((course) => {
        // Apply search filter
        const matchesSearch =
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))

        // Apply language filter if selected
        const matchesLanguage = filterLanguage ? course.language === filterLanguage : true

        return matchesSearch && matchesLanguage
      })
      .sort((a, b) => {
        // Apply sorting
        switch (sortOption) {
          case "date":
            return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
          case "title":
            return a.title.localeCompare(b.title)
          case "language":
            return a.language.localeCompare(b.language)
          default:
            return 0
        }
      })
  }

  const getBatchLabel = (course: Course) => {
    if (course.is_predefined_batch && course.batch_number) {
      const batchNum = Number.parseInt(course.batch_number)
      if (batchNum <= 3) {
        return `Morning Batch ${batchNum} (${
          batchNum === 1 ? "5:30 to 6:30" : batchNum === 2 ? "6:40 to 7:40" : "7:50 to 8:50"
        })`
      } else {
        return `Evening Batch ${batchNum} (${
          batchNum === 4 ? "5:30 to 6:30" : batchNum === 5 ? "6:40 to 7:40" : "7:50 to 8:50"
        })`
      }
    } else if (course.custom_batch_time) {
      return course.custom_batch_time
    }
    return "No batch specified"
  }

  const getSchedulingTypeLabel = (course: Course) => {
    if (course.scheduling_type === "date") {
      return `Date: ${format(new Date(course.scheduled_date), "MMM d, yyyy")}`
    } else if (course.scheduling_type === "day") {
      return `Day ${course.subscription_day} of subscription`
    } else if (course.scheduling_type === "week") {
      return `Week ${course.subscription_week} of subscription`
    }
    return "Unknown scheduling"
  }

  const filteredCourses = getSortedAndFilteredCourses()

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <Button onClick={() => router.push("/instructor/courses/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
            <CardDescription>View, edit, and manage your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      {filterLanguage || "All Languages"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterLanguage(null)}>All Languages</DropdownMenuItem>
                    {availableLanguages.map((language) => (
                      <DropdownMenuItem key={language} onClick={() => setFilterLanguage(language)}>
                        {language}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SortAsc className="mr-2 h-4 w-4" />
                      Sort: {sortOption === "date" ? "Date" : sortOption === "title" ? "Title" : "Language"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOption("date")}>Date</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption("title")}>Title</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption("language")}>Language</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500">
                  {searchQuery || filterLanguage
                    ? "No courses match your search criteria"
                    : "You haven't created any courses yet"}
                </p>
                <Button asChild className="mt-4">
                  <a href="/instructor/courses/create">Create Your First Course</a>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date/Schedule</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{getSchedulingTypeLabel(course)}</TableCell>
                        <TableCell>{getBatchLabel(course)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/instructor/courses/edit/${course.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => confirmDelete(course.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => courseToDelete && handleDeleteCourse(courseToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InstructorLayout>
  )
}
