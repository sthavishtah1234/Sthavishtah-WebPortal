"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, Users, TrendingUp, Trash2, Eye, Calendar, ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PoseAnalyticsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("instructor-videos")
  const [instructorVideos, setInstructorVideos] = useState<any[]>([])
  const [userSessions, setUserSessions] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/pose-analytics?type=${activeTab}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      if (activeTab === "instructor-videos") {
        setInstructorVideos(result.data || [])
      } else if (activeTab === "user-performance") {
        setUserSessions(result.data || [])
      } else if (activeTab === "insights") {
        setInsights(result.data)
      }
    } catch (error) {
      console.error("Error loading pose analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteInstructorVideo = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this instructor video pose data?")) return

    try {
      const response = await fetch("/api/ai/pose-analytics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      setInstructorVideos(instructorVideos.filter((v) => v.id !== sessionId))
    } catch (error) {
      console.error("Error deleting pose session:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Pose Analytics</h1>
            </div>
            <p className="text-gray-600">Monitor instructor video processing and user pose tracking performance</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 p-1">
            <TabsTrigger value="instructor-videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Instructor Videos
            </TabsTrigger>
            <TabsTrigger value="user-performance" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructor-videos" className="mt-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <CardTitle className="text-xl">Processed Instructor Videos</CardTitle>
                <CardDescription>Videos that have been processed for pose tracking</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading videos...</p>
                  </div>
                ) : instructorVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No instructor videos processed yet</p>
                    <p className="text-sm mt-2">Upload a video in the course creation page to get started</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Session ID</TableHead>
                          <TableHead className="font-semibold">Total Frames</TableHead>
                          <TableHead className="font-semibold">Processed At</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instructorVideos.map((video) => (
                          <TableRow key={video.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-sm">{video.id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {video.total_frames || 0} frames
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(video.created_at)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Link href={`/admin/test-pose-live?sessionId=${video.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                                    <Eye className="w-4 h-4" />
                                    Test Live
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteInstructorVideo(video.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
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

          <TabsContent value="user-performance" className="mt-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <CardTitle className="text-xl">User Pose Tracking Sessions</CardTitle>
                <CardDescription>Recent user performance data from live sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading sessions...</p>
                  </div>
                ) : userSessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No user sessions tracked yet</p>
                    <p className="text-sm mt-2">Sessions will appear here once users join live classes</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">User</TableHead>
                          <TableHead className="font-semibold">Course</TableHead>
                          <TableHead className="font-semibold">Overall Accuracy</TableHead>
                          <TableHead className="font-semibold">Timestamp</TableHead>
                          <TableHead className="font-semibold text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userSessions.map((session) => (
                          <TableRow key={session.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{session.user_id.substring(0, 8)}...</TableCell>
                            <TableCell className="text-sm">{session.course_id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  session.overall_accuracy >= 80
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : session.overall_accuracy >= 60
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                      : "bg-red-100 text-red-700 border-red-200"
                                }
                              >
                                {session.overall_accuracy.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{formatDate(session.tracked_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
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

          <TabsContent value="insights" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading insights...</p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Average Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">{insights.avgAccuracy.toFixed(1)}%</div>
                      <p className="text-xs text-gray-500 mt-2">Overall pose accuracy</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">{insights.totalSessions}</div>
                      <p className="text-xs text-gray-500 mt-2">Tracking sessions recorded</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Unique Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-600">{insights.uniqueUsers}</div>
                      <p className="text-xs text-gray-500 mt-2">Users tracked</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Best Joint</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-orange-600">
                        {Math.max(...Object.values(insights.jointAccuracy)).toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500 mt-2 capitalize">
                        {
                          Object.keys(insights.jointAccuracy)[
                            Object.values(insights.jointAccuracy).indexOf(
                              Math.max(...Object.values(insights.jointAccuracy)),
                            )
                          ]
                        }
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100 bg-white">
                    <CardTitle className="text-xl">Joint-by-Joint Performance</CardTitle>
                    <CardDescription>Average accuracy across different body joints</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {Object.entries(insights.jointAccuracy).map(([joint, accuracy]: [string, any]) => (
                        <div key={joint}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold capitalize text-gray-700">{joint}</span>
                            <span className="text-sm font-medium text-gray-600">{accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                accuracy >= 80 ? "bg-green-500" : accuracy >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No data available for insights</p>
                <p className="text-sm mt-2">Start tracking sessions to see insights</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
