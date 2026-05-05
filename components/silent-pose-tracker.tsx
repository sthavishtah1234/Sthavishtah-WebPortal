"use client"

import { useEffect, useRef, useState } from "react"
import { ClientPoseExtractor } from "@/lib/client-pose-extractor"
import { analyzePoseQualityEnhanced, calculateFormScore, type PoseAnalysisResult } from "@/lib/advanced-pose-analysis"
import type { NormalizedLandmark } from "@mediapipe/tasks-vision"

interface SilentPoseTrackerProps {
  userEmail: string
  courseId: string
  poseSessionId: string | null
  userVideoRef: HTMLVideoElement | null
  videoCurrentTime: number
  isActive: boolean
}

export function SilentPoseTracker({
  userEmail,
  courseId,
  poseSessionId,
  userVideoRef,
  videoCurrentTime,
  isActive,
}: SilentPoseTrackerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [instructorPoses, setInstructorPoses] = useState<any[]>([])
  const extractorRef = useRef<ClientPoseExtractor | null>(null)
  const lastSendTime = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const poseHistory = useRef<NormalizedLandmark[][]>([])
  const maxHistoryLength = 30 // Keep last 30 frames (~1 second at 30fps)

  useEffect(() => {
    if (!poseSessionId) return

    fetch(`/api/ai/instructor-poses?sessionId=${poseSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.poses) {
          setInstructorPoses(data.poses)
          console.log("[v0] 📥 Loaded", data.poses.length, "instructor poses")
        }
      })
      .catch((err) => console.error("[v0] Failed to load instructor poses:", err))
  }, [poseSessionId])

  useEffect(() => {
    if (!isActive || !poseSessionId) return

    const extractor = new ClientPoseExtractor()
    extractor
      .initialize()
      .then(() => {
        console.log("[v0] 🎯 Silent pose tracking initialized with advanced CV analysis")
        extractorRef.current = extractor
        setIsInitialized(true)
      })
      .catch((err) => console.error("[v0] Pose tracking init failed:", err))

    return () => {
      extractorRef.current = null
      poseHistory.current = []
    }
  }, [isActive, poseSessionId])

  useEffect(() => {
    if (!isInitialized || !isActive || !userVideoRef || instructorPoses.length === 0) return

    const trackPoses = async () => {
      const now = performance.now()

      if (now - lastSendTime.current < 2000) return

      try {
        const currentTimeMs = videoCurrentTime * 1000

        const instructorPose = instructorPoses.reduce((prev, curr) => {
          const prevDiff = Math.abs((curr.timestamp || curr.timestamp_ms || 0) - currentTimeMs)
          const currDiff = Math.abs((prev.timestamp || prev.timestamp_ms || 0) - currentTimeMs)
          return prevDiff < currDiff ? curr : prev
        })

        if (!instructorPose || !extractorRef.current) return

        const userLandmarks = await extractorRef.current.extractPoseFromVideo(userVideoRef)

        if (!userLandmarks || userLandmarks.length === 0) {
          console.log("[v0] No user pose detected")
          return
        }

        poseHistory.current.push(userLandmarks)
        if (poseHistory.current.length > maxHistoryLength) {
          poseHistory.current.shift()
        }

        const analysis: PoseAnalysisResult = analyzePoseQualityEnhanced(
          instructorPose.landmarks || instructorPose.pose_landmarks,
          userLandmarks,
          poseHistory.current.slice(-10),
        )

        const formScore = calculateFormScore(analysis)

        console.log("[v0] Enhanced Analysis:", {
          timestamp: currentTimeMs,
          rawAccuracy: analysis.overallAccuracy.toFixed(1),
          scaledAccuracy: analysis.scaledAccuracy.toFixed(1),
          symmetry: analysis.symmetryScore.toFixed(1),
          formScore: formScore.toFixed(1),
          detectedPose: analysis.detectedPose,
        })

        await fetch("/api/pose-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: userEmail,
            course_id: courseId,
            video_timestamp_ms: currentTimeMs,
            overall_accuracy: analysis.scaledAccuracy, // Use scaled accuracy
            raw_accuracy: analysis.overallAccuracy,
            form_score: formScore,
            joint_accuracies: analysis.jointAccuracies,
            joint_angles: analysis.jointAngles,
            symmetry_score: analysis.symmetryScore,
            velocity_score: analysis.velocityScore,
            stability_score: analysis.stabilityScore,
            transition_quality: analysis.transitionQuality,
            detected_pose: analysis.detectedPose,
            feedback: analysis.formFeedback,
          }),
        })

        lastSendTime.current = now
      } catch (error) {
        console.error("[v0] Pose comparison error:", error)
      }
    }

    intervalRef.current = setInterval(trackPoses, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isInitialized, isActive, userVideoRef, instructorPoses, videoCurrentTime, userEmail, courseId])

  return null // No UI rendered - completely silent
}
