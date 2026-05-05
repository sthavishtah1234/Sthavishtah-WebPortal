"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ClientPoseExtractor } from "@/lib/client-pose-extractor"

export default function ProcessInstructorVideoPage() {
  const [courseId, setCourseId] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleProcessVideo = async () => {
    if (!courseId || !videoFile) {
      alert("Please provide both Course ID and video file")
      return
    }

    setProcessing(true)
    setProgress(0)
    setStatus("Initializing pose detection...")
    setResult(null)

    try {
      const extractor = new ClientPoseExtractor()
      await extractor.initialize()

      setStatus("Extracting poses from video (happens locally in your browser)...")

      const poses = await extractor.extractPosesFromVideo(videoFile, (percent) => {
        setProgress(percent)
        setStatus(`Processing video locally: ${Math.round(percent)}%`)
      })

      setStatus("Uploading pose data to database...")
      setProgress(100)

      const response = await fetch("/api/process-instructor-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          poses: poses.map((p) => ({
            timestamp_ms: p.timestamp * 1000,
            landmarks: p.landmarks,
            visibility: p.visibility,
          })),
          videoDurationMs: poses[poses.length - 1]?.timestamp * 1000 || 0,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("✅ Processing complete! Video processed locally, only pose data stored.")
        setResult(data)
      } else {
        setStatus("❌ Failed to process video")
        console.error(data.error)
      }
    } catch (error) {
      console.error("Error processing video:", error)
      setStatus("❌ Error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Process Instructor Video for Pose Tracking</CardTitle>
          <CardDescription>
            Upload instructor video to extract pose data locally in your browser. The video stays on your computer -
            only pose landmarks are sent to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course ID</Label>
            <Input
              id="courseId"
              placeholder="Enter course ID"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Instructor Video File</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              disabled={processing}
            />
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button onClick={handleProcessVideo} disabled={processing || !courseId || !videoFile} className="w-full">
            {processing ? "Processing..." : "Process Video"}
          </Button>

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">{status}</p>
            </div>
          )}

          {status && !processing && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium">{status}</p>
              {result && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Session ID: {result.sessionId}</p>
                  <p>Poses Stored: {result.posesStored}</p>
                  <p className="mt-2 text-xs">The course has been automatically updated with pose tracking enabled.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
