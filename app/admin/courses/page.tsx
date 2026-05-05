"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Search, Trash2, ChevronDown, ChevronRight, SortAsc } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface Course {
  id: number
  title: string
  description: string
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
}

interface GroupedCourse {
  title: string
  description: string
  youtube_link: string
  scheduled_date: string
  language: string
  batches: {
    id: number
    is_predefined_batch: boolean
    batch_number: string | null
    custom_batch_time: string | null
    subscription_id: number | null
  }[]
  scheduling_type: string
  subscription_day: number | null
  subscription_week: number | null
}

type SortOption = "date" | "title" | "subscription" | "language"

export default function ManageCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({})
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [subscriptionNames, setSubscriptionNames] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    fetchCourses()
    fetchSubscriptionNames()
  }, [])

  async function fetchCourses() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("courses").select("*").order("scheduled_date", { ascending: false })

      if (error) throw error

      setCourses(data || [])

      // Group courses by title, date, and language
      const grouped = groupCoursesByTitleAndDate(data || [])
      setGroupedCourses(grouped)

      // Initialize all groups as open
      const initialOpenState = {}
      grouped.forEach((group, index) => {
        initialOpenState[`${group.title}_${group.scheduled_date}_${group.language}`] = true
      })
      setOpenGroups(initialOpenState)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscriptionNames() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name")

      if (error) throw error

      const namesMap: { [key: number]: string } = {}
      data?.forEach((sub) => {
        namesMap[sub.id] = sub.name
      })

      setSubscriptionNames(namesMap)
    } catch (error) {
      console.error("Error fetching subscription names:", error)
    }
  }

  const groupCoursesByTitleAndDate = (courses: Course[]): GroupedCourse[] => {
    const grouped: { [key: string]: GroupedCourse } = {}

    courses.forEach((course) => {
      // Create a unique key for each course group
      const key = `${course.title}_${course.scheduled_date}_${course.language}`

      if (!grouped[key]) {
        grouped[key] = {
          title: course.title,
          description: course.description,
          youtube_link: course.youtube_link,
          scheduled_date: course.scheduled_date,
          language: course.language,
          batches: [],
          scheduling_type: course.scheduling_type,
          subscription_day: course.subscription_day,
          subscription_week: course.subscription_week,
        }
      }

      // Add this batch to the course
      grouped[key].batches.push({
        id: course.id,
        is_predefined_batch: course.is_predefined_batch,
        batch_number: course.batch_number,
        custom_batch_time: course.custom_batch_time,
        subscription_id: course.subscription_id,
      })
    })

    // Convert to array
    return Object.values(grouped)
  }

  // Sort the grouped courses based on the selected sort option
  const sortGroupedCourses = (courses: GroupedCourse[]): GroupedCourse[] => {
    return [...courses].sort((a, b) => {
      switch (sortOption) {
        case "date":
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "language":
          return a.language.localeCompare(b.language)
        case "subscription":
          // Count paid batches (with subscription_id) in each course
          const aPaidBatches = a.batches.filter((batch) => batch.subscription_id !== null).length
          const bPaidBatches = b.batches.filter((batch) => batch.subscription_id !== null).length

          // Sort by number of paid batches (descending)
          if (aPaidBatches !== bPaidBatches) {
            return bPaidBatches - aPaidBatches
          }

          // If tied on subscription, sort by date (newest first)
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        default:
          return 0
      }
    })
  }

  const filteredGroupedCourses = sortGroupedCourses(
    groupedCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  )

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("courses").delete().eq("id", id)

      if (error) throw error

      // Refresh the courses list
      fetchCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "date":
        return "Date (Newest)"
      case "title":
        return "Title"
      case "language":
        return "Language"
      case "subscription":
        return "Subscription"
      default:
        return "Sort"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Courses</h1>
          <Button onClick={() => router.push("/admin/courses/create")}>
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
            <CardDescription>View, edit, and delete courses from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <SortAsc className="mr-2 h-4 w-4" />
                    Sort by: {getSortLabel(sortOption)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOption("date")}>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("title")}>Title</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("language")}>Language</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("subscription")}>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading courses...</div>
            ) : filteredGroupedCourses.length === 0 ? (
              <div className="text-center py-4">
                {searchQuery ? "No courses match your search." : "No courses found. Create your first course!"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Batches</TableHead>
                      <TableHead>Scheduling</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroupedCourses.map((course) => {
                      const groupKey = `${course.title}_${course.scheduled_date}_${course.language}`
                      const isOpen = openGroups[groupKey]
                      const paidBatches = course.batches.filter((batch) => batch.subscription_id !== null).length
                      const totalBatches = course.batches.length

                      return (
                        <>
                          <TableRow
                            key={`header-${groupKey}`}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleGroup(groupKey)}
                          >
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{formatDate(course.scheduled_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{course.language}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {course.batches.length} batches
                                  {paidBatches > 0 && (
                                    <span className="ml-1 text-xs text-gray-500">({paidBatches} paid)</span>
                                  )}
                                </span>
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              {course.scheduling_type === "date" && (
                                <span>Date: {format(new Date(course.scheduled_date), "MMM d, yyyy")}</span>
                              )}
                              {course.scheduling_type === "day" && (
                                <span>Day {course.subscription_day} of subscription</span>
                              )}
                              {course.scheduling_type === "week" && (
                                <span>Week {course.subscription_week} of subscription</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/courses/create?duplicate=${course.batches[0].id}`)
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Similar
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Render batch rows only if the group is open */}
                          {isOpen &&
                            course.batches.map((batch) => (
                              <TableRow key={`batch-${batch.id}`} className="bg-gray-50">
                                <TableCell className="pl-8">
                                  <span className="text-gray-500">Batch:</span>
                                </TableCell>
                                <TableCell>
                                  {batch.is_predefined_batch && batch.batch_number ? (
                                    <Badge variant="outline">{getBatchLabel(batch.batch_number)}</Badge>
                                  ) : (
                                    <span>{batch.custom_batch_time}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {batch.subscription_id ? (
                                    <Badge className="cursor-help" title={`Subscription ID: ${batch.subscription_id}`}>
                                      {subscriptionNames[batch.subscription_id] || "Paid Access"}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Free Access</Badge>
                                  )}
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => router.push(`/admin/courses/edit/${batch.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDeleteCourse(batch.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
