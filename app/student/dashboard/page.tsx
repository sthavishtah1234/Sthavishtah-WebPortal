"use client"

import { useState, useEffect, useRef } from "react"
import StudentLayout from "@/components/student-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  Camera,
  Calendar,
  MapPin,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ImageIcon,
  Award,
  User,
  Mail,
  Phone,
} from "lucide-react"
import Image from "next/image"

interface AicteEvent {
  id: string
  name: string
  date: string
  day_of_week: string
  location: string
}

interface Submission {
  id: string
  event_id: string
  photo_url: string
  status: string
  ai_score: number | null
  admin_note: string | null
  submitted_at: string
}

export default function StudentDashboard() {
  const [events, setEvents] = useState<AicteEvent[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedEventForUpload, setSelectedEventForUpload] = useState<AicteEvent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentName = typeof window !== "undefined" ? localStorage.getItem("studentName") || "Student" : "Student"
  const studentEmail = typeof window !== "undefined" ? localStorage.getItem("studentEmail") || "" : ""
  const studentPhone = typeof window !== "undefined" ? localStorage.getItem("studentPhone") || "" : ""
  const studentId = typeof window !== "undefined" ? localStorage.getItem("studentId") || "" : ""

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [eventsRes, subsRes] = await Promise.all([
        fetch("/api/aicte/events"),
        fetch(`/api/aicte/submissions?student_id=${studentId}`),
      ])

      const eventsData = await eventsRes.json()
      const subsData = await subsRes.json()

      if (eventsData.success) setEvents(eventsData.events || [])
      if (subsData.success) setSubmissions(subsData.submissions || [])
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionForEvent = (eventId: string) => {
    return submissions.find((s) => s.event_id === eventId)
  }

  const approvedCount = submissions.filter((s) => s.status === "approved").length

  const openUploadDialog = (event: AicteEvent) => {
    setSelectedEventForUpload(event)
    setShowUploadDialog(true)
    setPreviewImage(null)
    setPreviewFile(null)
    setUploadError(null)
    setUploadSuccess(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be less than 10MB")
      return
    }

    setUploadError(null)
    setPreviewFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new window.Image()

      img.onload = () => {
        const MAX_WIDTH = 800
        let { width, height } = img

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            resolve(blob || file)
          },
          "image/jpeg",
          0.75
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleUpload = async () => {
    if (!previewFile || !selectedEventForUpload || !studentId) return

    setIsProcessing(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      // Step 1: Compress image
      const compressed = await compressImage(previewFile)

      // Step 2: AI check
      const formData = new FormData()
      formData.append("image", compressed, "photo.jpg")

      const aiRes = await fetch("/api/aicte/check-image", {
        method: "POST",
        body: formData,
      })

      const aiData = await aiRes.json()

      if (aiData.blocked) {
        setUploadError(aiData.message || "This image appears to be AI-generated. Please upload a real photo from the event.")
        setIsProcessing(false)
        return
      }

      // Step 3: Upload to server
      const uploadFormData = new FormData()
      uploadFormData.append("image", compressed, "photo.jpg")
      uploadFormData.append("student_id", studentId)
      uploadFormData.append("event_id", selectedEventForUpload.id)
      uploadFormData.append("ai_score", (aiData.ai_score ?? "null").toString())

      const uploadRes = await fetch("/api/aicte/submit", {
        method: "POST",
        body: uploadFormData,
      })

      const uploadData = await uploadRes.json()

      if (uploadData.success) {
        setUploadSuccess("Photo submitted successfully! It's now pending admin review.")
        setShowUploadDialog(false)
        fetchData() // Refresh
      } else {
        setUploadError(uploadData.error || "Upload failed. Please try again.")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setUploadError("An error occurred during upload. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Student Dashboard</h1>
          <p className="text-gray-600 font-lora mt-1">Manage your AICTE event submissions and track your points</p>
        </div>

        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{uploadSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Profile & Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{studentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{studentEmail || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{studentPhone || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AICTE Points Card */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <p className="text-3xl font-bold">{approvedCount}</p>
              <p className="text-sm opacity-90">AICTE Points Earned</p>
              <p className="text-xs mt-2 opacity-75">{submissions.length} total submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Event Photo Submissions
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Events Available</h3>
                <p className="text-gray-500">Check back later for upcoming events</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const submission = getSubmissionForEvent(event.id)
                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">{event.name}</CardTitle>
                      <CardDescription className="space-y-1">
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.date)} ({event.day_of_week})
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {submission ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            {getStatusBadge(submission.status)}
                          </div>

                          {/* Submitted photo thumbnail */}
                          <div
                            className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewPhoto(submission.photo_url)}
                          >
                            <Image
                              src={submission.photo_url}
                              alt="Submitted photo"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                            </div>
                          </div>

                          {submission.admin_note && (
                            <div className={`text-xs p-2 rounded ${
                              submission.status === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-gray-50 text-gray-600"
                            }`}>
                              <strong>Admin note:</strong> {submission.admin_note}
                            </div>
                          )}

                          <p className="text-xs text-gray-400">
                            Submitted {formatDate(submission.submitted_at)}
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => openUploadDialog(event)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-600" />
              Upload Event Photo
            </DialogTitle>
            <DialogDescription>
              {selectedEventForUpload?.name} — {selectedEventForUpload?.date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {uploadError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {previewImage ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={previewImage} alt="Preview" fill className="object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPreviewImage(null)
                      setPreviewFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    Change Photo
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleUpload}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Click to select a photo</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP — max 10MB</p>
                <p className="text-xs text-emerald-600 mt-2">
                  Photo will be compressed and checked for authenticity
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="sm:max-w-2xl p-2">
          {viewPhoto && (
            <div className="relative w-full h-[60vh]">
              <Image src={viewPhoto} alt="Submitted photo" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentLayout>
  )
}
