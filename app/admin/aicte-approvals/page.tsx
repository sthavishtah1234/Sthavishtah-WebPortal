"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ImageIcon,
  Eye,
  Filter,
  AlertTriangle,
} from "lucide-react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Submission {
  id: string
  student_id: number
  event_id: string
  photo_url: string
  status: string
  ai_score: number | null
  admin_note: string | null
  submitted_at: string
  reviewed_at: string | null
  student_name?: string
  event_name?: string
}

export default function AdminAicteApprovalsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const statusParam = filter === "all" ? "" : `&status=${filter}`
      const res = await fetch(`/api/aicte/submissions?admin=true${statusParam}`)
      const data = await res.json()

      if (data.success) {
        // Enrich with student names and event names
        const enriched = await enrichSubmissions(data.submissions || [])
        setSubmissions(enriched)
      }
    } catch (err) {
      console.error("Error fetching submissions:", err)
    } finally {
      setLoading(false)
    }
  }

  const enrichSubmissions = async (subs: Submission[]) => {
    if (subs.length === 0) return subs

    try {
      const supabase = getSupabaseBrowserClient()

      // Get unique student IDs and event IDs
      const studentIds = [...new Set(subs.map((s) => s.student_id))]
      const eventIds = [...new Set(subs.map((s) => s.event_id))]

      // Fetch student names
      const { data: students } = await supabase
        .from("users")
        .select("id, name")
        .in("id", studentIds)

      // Fetch event names
      const { data: events } = await supabase
        .from("aicte_events")
        .select("id, name")
        .in("id", eventIds)

      const studentMap = new Map(students?.map((s) => [s.id, s.name]) || [])
      const eventMap = new Map(events?.map((e) => [e.id, e.name]) || [])

      return subs.map((s) => ({
        ...s,
        student_name: studentMap.get(s.student_id) || `Student #${s.student_id}`,
        event_name: eventMap.get(s.event_id) || `Event`,
      }))
    } catch {
      return subs
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch("/api/aicte/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id, action: "approved" }),
      })

      const data = await res.json()
      if (data.success) fetchSubmissions()
    } catch (err) {
      console.error("Approve error:", err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch("/api/aicte/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: id,
          action: "rejected",
          admin_note: rejectNote || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setRejectingId(null)
        setRejectNote("")
        fetchSubmissions()
      }
    } catch (err) {
      console.error("Reject error:", err)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
    }
  }

  const getAiScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="outline" className="text-gray-500">No AI check</Badge>
    if (score > 0.7) return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> {(score * 100).toFixed(0)}% AI</Badge>
    if (score > 0.4) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{(score * 100).toFixed(0)}% AI</Badge>
    return <Badge className="bg-green-100 text-green-700 border-green-200">{(score * 100).toFixed(0)}% AI</Badge>
  }

  const pendingCount = submissions.filter(s => s.status === "pending").length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AICTE Photo Approvals</h1>
            <p className="text-gray-600 mt-1">
              Review and approve student event photo submissions
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{pendingCount} pending</Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No submissions found</h3>
              <p className="text-gray-500 mt-1">
                {filter === "pending" ? "No pending submissions to review" : `No ${filter} submissions`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Event</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">AI Score</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Photo</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{sub.student_name}</td>
                    <td className="p-3 text-sm">{sub.event_name}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(sub.submitted_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3">{getAiScoreBadge(sub.ai_score)}</td>
                    <td className="p-3">
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setViewPhoto(sub.photo_url)}
                      >
                        <Image src={sub.photo_url} alt="Photo" fill className="object-cover" />
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(sub.status)}</td>
                    <td className="p-3">
                      {sub.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                            onClick={() => handleApprove(sub.id)}
                            disabled={processingId === sub.id}
                          >
                            {processingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-3"
                            onClick={() => setRejectingId(sub.id)}
                            disabled={processingId === sub.id}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        sub.admin_note && (
                          <span className="text-xs text-gray-500 italic">Note: {sub.admin_note}</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Viewer */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="sm:max-w-2xl p-2">
          {viewPhoto && (
            <div className="relative w-full h-[60vh]">
              <Image src={viewPhoto} alt="Submission" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => { setRejectingId(null); setRejectNote("") }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Note (Optional)</label>
              <Input
                placeholder="Reason for rejection..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">This note will be visible to the student</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectingId(null); setRejectNote("") }}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => rejectingId && handleReject(rejectingId)}
                disabled={processingId === rejectingId}
              >
                {processingId === rejectingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject Submission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
