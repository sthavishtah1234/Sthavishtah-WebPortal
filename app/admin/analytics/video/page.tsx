"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  Play,
  Search,
  SlidersHorizontal,
  Users,
  Video,
  CheckCircle,
  BarChart2,
  PieChartIcon,
  LineChartIcon,
  RefreshCcw,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function VideoAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("all")
  const [sortBy, setSortBy] = useState("views")
  const [sortOrder, setSortOrder] = useState("desc")
  const [activeTab, setActiveTab] = useState("overview")
  const [chartType, setChartType] = useState("bar")
  const [totalViews, setTotalViews] = useState(0)
  const [totalCompletions, setTotalCompletions] = useState(0)
  const [averageCompletionRate, setAverageCompletionRate] = useState(0)
  const [topCourses, setTopCourses] = useState([])
  const [viewsByDay, setViewsByDay] = useState([])
  const [completionsByDay, setCompletionsByDay] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  useEffect(() => {
    fetchVideoAnalytics()
  }, [])

  useEffect(() => {
    if (courses.length > 0) {
      filterAndSortCourses()
    }
  }, [courses, searchQuery, dateRange, sortBy, sortOrder])

  const fetchVideoAnalytics = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch courses with video analytics data
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          youtube_link,
          scheduled_date,
          language,
          batch_number,
          user_courses(
            id,
            user_id,
            attended,
            completed_video,
            attended_at,
            users(name, email)
          )
        `)
        .order("scheduled_date", { ascending: false })

      if (coursesError) throw coursesError

      // Process the data to add analytics metrics
      const processedCourses = coursesData.map((course) => {
        const totalUsers = course.user_courses ? course.user_courses.length : 0
        const viewedUsers = course.user_courses ? course.user_courses.filter((uc) => uc.attended).length : 0
        const completedUsers = course.user_courses ? course.user_courses.filter((uc) => uc.completed_video).length : 0
        const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0

        return {
          ...course,
          totalUsers,
          viewedUsers,
          completedUsers,
          completionRate: Number.parseFloat(completionRate.toFixed(2)),
          lastViewed:
            course.user_courses && course.user_courses.length > 0
              ? course.user_courses
                  .filter((uc) => uc.attended)
                  .sort((a, b) => new Date(b.attended_at) - new Date(a.attended_at))[0]?.attended_at
              : null,
        }
      })

      setCourses(processedCourses)

      // Calculate summary metrics
      const totalViewsCount = processedCourses.reduce((sum, course) => sum + course.viewedUsers, 0)
      const totalCompletionsCount = processedCourses.reduce((sum, course) => sum + course.completedUsers, 0)
      const avgCompletionRate =
        processedCourses.length > 0
          ? processedCourses.reduce((sum, course) => sum + course.completionRate, 0) / processedCourses.length
          : 0

      setTotalViews(totalViewsCount)
      setTotalCompletions(totalCompletionsCount)
      setAverageCompletionRate(Number.parseFloat(avgCompletionRate.toFixed(2)))

      // Get top courses by views
      const topCoursesByViews = [...processedCourses].sort((a, b) => b.viewedUsers - a.viewedUsers).slice(0, 5)
      setTopCourses(topCoursesByViews)

      // Generate views by day data (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split("T")[0]
      }).reverse()

      const viewsByDayData = last30Days.map((day) => {
        const views = processedCourses.reduce((sum, course) => {
          const viewsOnDay = course.user_courses
            ? course.user_courses.filter((uc) => uc.attended && uc.attended_at && uc.attended_at.startsWith(day)).length
            : 0
          return sum + viewsOnDay
        }, 0)
        return { date: day, views }
      })
      setViewsByDay(viewsByDayData)

      const completionsByDayData = last30Days.map((day) => {
        const completions = processedCourses.reduce((sum, course) => {
          const completionsOnDay = course.user_courses
            ? course.user_courses.filter((uc) => uc.completed_video && uc.attended_at && uc.attended_at.startsWith(day))
                .length
            : 0
          return sum + completionsOnDay
        }, 0)
        return { date: day, completions }
      })
      setCompletionsByDay(completionsByDayData)

      setFilteredCourses(processedCourses)
    } catch (error) {
      console.error("Error fetching video analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load video analytics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let filtered = [...courses]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.language?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const startDate = new Date()

      if (dateRange === "30days") {
        startDate.setDate(now.getDate() - 30)
      } else if (dateRange === "90days") {
        startDate.setDate(now.getDate() - 90)
      }

      filtered = filtered.filter((course) => {
        const courseDate = new Date(course.scheduled_date)
        return courseDate >= startDate
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "views":
          comparison = a.viewedUsers - b.viewedUsers
          break
        case "completions":
          comparison = a.completedUsers - b.completedUsers
          break
        case "completion_rate":
          comparison = a.completionRate - b.completionRate
          break
        case "date":
          comparison = new Date(a.scheduled_date) - new Date(b.scheduled_date)
          break
        default:
          comparison = a.viewedUsers - b.viewedUsers
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredCourses(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      "Title",
      "Batch",
      "Language",
      "Date",
      "Total Users",
      "Views",
      "Completions",
      "Completion Rate (%)",
      "Last Viewed",
    ]

    const csvData = filteredCourses.map((course) => [
      course.title,
      course.batch_number || "N/A",
      course.language || "English",
      new Date(course.scheduled_date).toLocaleDateString(),
      course.totalUsers,
      course.viewedUsers,
      course.completedUsers,
      course.completionRate,
      course.lastViewed ? new Date(course.lastViewed).toLocaleString() : "Never",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `video_analytics_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A"
    return new Date(dateTimeString).toLocaleString()
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topCourses}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="title"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="viewedUsers" name="Views" fill="#0088FE" />
            <Bar dataKey="completedUsers" name="Completions" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      )
    } else if (chartType === "pie") {
      const data = topCourses.map((course) => ({
        name: course.title.length > 20 ? `${course.title.substring(0, 20)}...` : course.title,
        value: course.viewedUsers,
      }))

      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} views`, "Views"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    } else if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={viewsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" name="Views" stroke="#0088FE" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  }

  const renderCompletionTrendChart = () => {
    // Combine views and completions data
    const combinedData = viewsByDay.map((item, index) => ({
      date: item.date,
      views: item.views,
      completions: completionsByDay[index]?.completions || 0,
    }))

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="views" name="Views" stroke="#0088FE" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="completions" name="Completions" stroke="#00C49F" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video analytics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Analytics</h1>
            <p className="text-muted-foreground">
              Track video views, completions, and engagement metrics across all courses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchVideoAnalytics}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analytics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalViews}</div>
                  <p className="text-xs text-muted-foreground">Across {courses.length} videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCompletions}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalViews > 0
                      ? `${((totalCompletions / totalViews) * 100).toFixed(1)}% of total views`
                      : "No views yet"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageCompletionRate}%</div>
                  <p className="text-xs text-muted-foreground">Average across all videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">Available for viewing</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Videos by Views</CardTitle>
                    <CardDescription>The most viewed videos across all courses</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={chartType === "bar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("bar")}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === "pie" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("pie")}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === "line" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("line")}
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-2">{renderChart()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Video Performance</CardTitle>
                    <CardDescription>Detailed analytics for all videos</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-[200px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <Calendar className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="30days">Last 30 Days</SelectItem>
                          <SelectItem value="90days">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="views">Views</SelectItem>
                          <SelectItem value="completions">Completions</SelectItem>
                          <SelectItem value="completion_rate">Completion Rate</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <Video className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-2 text-muted-foreground">No videos found matching your criteria</p>
                      </div>
                    ) : (
                      filteredCourses.map((course) => (
                        <Card key={course.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-gray-100 p-4 flex items-center justify-center">
                              <div className="text-center">
                                <div className="relative w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                                  <Play className="h-8 w-8 text-primary" />
                                  {course.youtube_link && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                                      {course.viewedUsers}
                                    </div>
                                  )}
                                </div>
                                <h3 className="mt-2 font-medium text-sm line-clamp-2">{course.title}</h3>
                                <div className="mt-1 flex items-center justify-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {course.language || "English"}
                                  </Badge>
                                  {course.batch_number && (
                                    <Badge variant="outline" className="text-xs">
                                      Batch {course.batch_number}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="md:w-2/3 p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{formatDate(course.scheduled_date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Views</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{course.viewedUsers}</p>
                                    <p className="text-xs text-muted-foreground">
                                      of {course.totalUsers} (
                                      {course.totalUsers > 0
                                        ? ((course.viewedUsers / course.totalUsers) * 100).toFixed(0)
                                        : 0}
                                      %)
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Completions</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{course.completedUsers}</p>
                                    <p className="text-xs text-muted-foreground">({course.completionRate}%)</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Last Viewed</p>
                                  <p className="font-medium">
                                    {course.lastViewed ? formatDateTime(course.lastViewed) : "Never"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-primary h-2.5 rounded-full"
                                    style={{ width: `${course.completionRate}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between mt-1">
                                  <p className="text-xs text-muted-foreground">0%</p>
                                  <p className="text-xs text-muted-foreground">
                                    Completion Rate: {course.completionRate}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">100%</p>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {course.totalUsers} registered users
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCourse(course)
                                    setShowUserDetails(true)
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Views & Completions Trend (Last 30 Days)</CardTitle>
                <CardDescription>Track how video views and completions have changed over time</CardDescription>
              </CardHeader>
              <CardContent>{renderCompletionTrendChart()}</CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate by Language</CardTitle>
                  <CardDescription>Compare video completion rates across different languages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(courses.map((c) => c.language || "English"))).map((language) => {
                      const languageCourses = courses.filter((c) => (c.language || "English") === language)
                      const avgCompletionRate =
                        languageCourses.length > 0
                          ? languageCourses.reduce((sum, c) => sum + c.completionRate, 0) / languageCourses.length
                          : 0

                      return (
                        <div key={language} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{language}</span>
                            <span>{avgCompletionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${avgCompletionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement by Batch</CardTitle>
                  <CardDescription>Compare video engagement metrics across different batches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(courses.filter((c) => c.batch_number).map((c) => c.batch_number))).map(
                      (batch) => {
                        const batchCourses = courses.filter((c) => c.batch_number === batch)
                        const totalViews = batchCourses.reduce((sum, c) => sum + c.viewedUsers, 0)
                        const totalUsers = batchCourses.reduce((sum, c) => sum + c.totalUsers, 0)
                        const viewRate = totalUsers > 0 ? (totalViews / totalUsers) * 100 : 0

                        return (
                          <div key={batch} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Batch {batch}</span>
                              <span>{viewRate.toFixed(1)}% view rate</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${viewRate}%` }}></div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {totalViews} views from {totalUsers} registered users
                            </div>
                          </div>
                        )
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Video Analytics - User Details</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title} - {formatDate(selectedCourse?.scheduled_date)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedCourse?.totalUsers || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedCourse?.viewedUsers || 0}</p>
                    <p className="text-sm text-muted-foreground">Viewed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCourse?.completedUsers || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">User Activity Details</h3>
              <div className="border rounded-lg">
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted font-medium text-sm">
                  <div>User Name</div>
                  <div>Email</div>
                  <div>Status</div>
                  <div>Last Activity</div>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {selectedCourse?.user_courses && selectedCourse.user_courses.length > 0 ? (
                      selectedCourse.user_courses.map((uc, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-3 text-sm">
                          <div className="font-medium">{uc.user?.name || "N/A"}</div>
                          <div className="text-muted-foreground">{uc.user?.email || "N/A"}</div>
                          <div>
                            {uc.completed_video ? (
                              <Badge className="bg-blue-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            ) : uc.attended ? (
                              <Badge className="bg-green-500">
                                <Eye className="w-3 h-3 mr-1" />
                                Viewed
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Viewed</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {uc.attended_at ? formatDateTime(uc.attended_at) : "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">No users registered for this video</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
