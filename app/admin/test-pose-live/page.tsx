"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, VideoIcon, X, Play } from "lucide-react"
import Link from "next/link"

function TestPoseLiveContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")

  const [instructorPoses, setInstructorPoses] = useState<any[]>([])
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0)
  const [jointAccuracies, setJointAccuracies] = useState<any>({})
  const [poseLandmarker, setPoseLandmarker] = useState<any | null>(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const youtubePlayerRef = useRef<any>(null)
  const timerRef = useRef<number>()
  const timerRunningRef = useRef(false)
  const cameraActiveRef = useRef(false)
  const instructorPosesRef = useRef<any[]>([])
  const currentVideoTimeRef = useRef(0)

  useEffect(() => {
    console.log("[v0] Page loaded, starting MediaPipe initialization...")
    initializePoseLandmarker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
      timerRunningRef.current = false
    }
  }, [])

  useEffect(() => {
    if (sessionId) {
      loadInstructorPoses()
    }
  }, [sessionId])

  useEffect(() => {
    cameraActiveRef.current = cameraActive
  }, [cameraActive])

  useEffect(() => {
    instructorPosesRef.current = instructorPoses
  }, [instructorPoses])

  useEffect(() => {
    currentVideoTimeRef.current = currentVideoTime
  }, [currentVideoTime])

  const loadInstructorPoses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/instructor-poses?sessionId=${sessionId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load poses")
      }

      console.log("[v0] Full API response:", JSON.stringify(result, null, 2))
      console.log("[v0] Instructor poses loaded:", result.poses?.length || 0, "frames")
      console.log("[v0] Session data:", result.session)
      console.log("[v0] Direct video_url:", result.video_url)
      console.log("[v0] Session video_url:", result.session?.video_url)

      const url = result.video_url || result.session?.video_url
      console.log("[v0] Final Video URL:", url)

      setInstructorPoses(result.poses || [])
      setCourseInfo(result.session || result)
      setVideoUrl(url)

      if (url) {
        const ytId = getYouTubeId(url)
        console.log("[v0] Extracted YouTube ID:", ytId)
        if (ytId) {
          loadYouTubeAPI(url)
        } else {
          console.log("[v0] Could not extract YouTube ID from URL:", url)
        }
      } else {
        console.log("[v0] No video URL found in database - timer will use internal clock")
      }
    } catch (error: any) {
      console.error("[v0] Error loading instructor poses:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const initializePoseLandmarker = async () => {
    try {
      console.log("[v0] Initializing MediaPipe PoseLandmarker...")
      setMediaPipeReady(false)

      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
      )
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })
      setPoseLandmarker(landmarker)
      setMediaPipeReady(true)
      console.log("[v0] PoseLandmarker initialized and ready!")
    } catch (error) {
      console.error("[v0] Error initializing PoseLandmarker:", error)
      setMediaPipeReady(false)
    }
  }

  const startCamera = async () => {
    if (!mediaPipeReady || !poseLandmarker) {
      setCameraActive(true)
      cameraActiveRef.current = true
      console.log("[v0] Waiting for MediaPipe to load...")

      let attempts = 0
      const checkInterval = setInterval(() => {
        attempts++
        if (mediaPipeReady && poseLandmarker) {
          clearInterval(checkInterval)
          console.log("[v0] MediaPipe ready, starting camera now...")
          initCamera()
        } else if (attempts > 50) {
          clearInterval(checkInterval)
          setCameraActive(false)
          cameraActiveRef.current = false
          console.error("[v0] MediaPipe failed to load")
        }
      }, 200)
      return
    }

    initCamera()
  }

  const initCamera = async () => {
    console.log("[v0] Starting camera with MediaPipe ready...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream
        setCameraActive(true)
        cameraActiveRef.current = true
        console.log("[v0] Camera started successfully")

        webcamRef.current.onloadedmetadata = () => {
          console.log("[v0] Webcam video loaded, starting pose detection...")

          if (youtubePlayerRef.current && typeof youtubePlayerRef.current.playVideo === "function") {
            console.log("[v0] Auto-playing YouTube video...")
            youtubePlayerRef.current.seekTo(0) // Start from beginning
            youtubePlayerRef.current.playVideo()
          } else {
            console.log("[v0] No YouTube player, using internal timer")
          }

          requestAnimationFrame(() => {
            startPoseDetection()
            startTimer()
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error accessing webcam:", error)
      setCameraActive(false)
      cameraActiveRef.current = false
    }
  }

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      webcamRef.current.srcObject = null
    }
    setCameraActive(false)
    cameraActiveRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
      timerRef.current = undefined
    }
    timerRunningRef.current = false
    setCurrentVideoTime(0)
    setCurrentAccuracy(0)
    setJointAccuracies({})
    console.log("[v0] Camera stopped, all timers cleared")
  }

  const findClosestPose = useCallback((currentTimeMs: number) => {
    const poses = instructorPosesRef.current
    if (poses.length === 0) return null

    const currentTimeSec = currentTimeMs / 1000

    let closest = poses[0]
    let minDiff = Math.abs(poses[0].timestamp - currentTimeSec)

    for (const pose of poses) {
      const diff = Math.abs(pose.timestamp - currentTimeSec)
      if (diff < minDiff) {
        minDiff = diff
        closest = pose
      }
    }

    return minDiff < 1.0 ? closest : null
  }, [])

  const calculatePoseAccuracy = useCallback((userLandmarks: any[], instructorLandmarks: any[]) => {
    if (!instructorLandmarks || instructorLandmarks.length === 0) {
      return { overall: 80, scaled: 80, joints: {}, angles: {}, symmetry: 100, feedback: [] }
    }

    const keyPoints = [
      { name: "left_shoulder", userIndex: 11, instructorIndex: 0 },
      { name: "right_shoulder", userIndex: 12, instructorIndex: 1 },
      { name: "left_elbow", userIndex: 13, instructorIndex: 2 },
      { name: "right_elbow", userIndex: 14, instructorIndex: 3 },
      { name: "left_wrist", userIndex: 15, instructorIndex: 4 },
      { name: "right_wrist", userIndex: 16, instructorIndex: 5 },
      { name: "left_hip", userIndex: 23, instructorIndex: 6 },
      { name: "right_hip", userIndex: 24, instructorIndex: 7 },
      { name: "left_knee", userIndex: 25, instructorIndex: 8 },
      { name: "right_knee", userIndex: 26, instructorIndex: 9 },
      { name: "left_ankle", userIndex: 27, instructorIndex: 10 },
      { name: "right_ankle", userIndex: 28, instructorIndex: 11 },
    ]

    // Joint angle definitions for comparison
    const angleDefinitions = [
      { name: "left_elbow", points: [11, 13, 15], instPoints: [0, 2, 4], label: "Left Elbow" },
      { name: "right_elbow", points: [12, 14, 16], instPoints: [1, 3, 5], label: "Right Elbow" },
      { name: "left_shoulder", points: [13, 11, 23], instPoints: [2, 0, 6], label: "Left Shoulder" },
      { name: "right_shoulder", points: [14, 12, 24], instPoints: [3, 1, 7], label: "Right Shoulder" },
      { name: "left_knee", points: [23, 25, 27], instPoints: [6, 8, 10], label: "Left Knee" },
      { name: "right_knee", points: [24, 26, 28], instPoints: [7, 9, 11], label: "Right Knee" },
    ]

    // Symmetry pairs
    const symmetryPairs = [
      { left: 11, right: 12, name: "shoulders" },
      { left: 13, right: 14, name: "elbows" },
      { left: 15, right: 16, name: "wrists" },
      { left: 23, right: 24, name: "hips" },
      { left: 25, right: 26, name: "knees" },
      { left: 27, right: 28, name: "ankles" },
    ]

    const jointAccuracies: any = {}
    const jointAngles: any = {}
    const feedback: string[] = []
    let positionAccuracy = 0
    let angleAccuracy = 0
    let symmetryScore = 0
    let validPositions = 0
    let validAngles = 0
    let validSymmetry = 0

    // 1. Calculate position-based accuracy
    keyPoints.forEach((point) => {
      const userPoint = userLandmarks[point.userIndex]
      const instructorPoint = instructorLandmarks[point.instructorIndex]

      if (userPoint && instructorPoint && instructorPoint.x !== undefined) {
        const distance = Math.sqrt(
          Math.pow(userPoint.x - instructorPoint.x, 2) +
            Math.pow(userPoint.y - instructorPoint.y, 2) +
            Math.pow((userPoint.z || 0) - (instructorPoint.z || 0), 2),
        )

        const accuracy = Math.max(0, 100 - distance * 100)
        jointAccuracies[point.name] = accuracy
        positionAccuracy += accuracy
        validPositions++
      }
    })

    // 2. Calculate angle-based accuracy
    const calculateAngle = (p1: any, p2: any, p3: any) => {
      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
      const dot = v1.x * v2.x + v1.y * v2.y
      const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2)
      const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2)
      if (mag1 === 0 || mag2 === 0) return 0
      return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * (180 / Math.PI)
    }

    angleDefinitions.forEach((def) => {
      try {
        const userAngle = calculateAngle(
          userLandmarks[def.points[0]],
          userLandmarks[def.points[1]],
          userLandmarks[def.points[2]],
        )
        const instAngle = calculateAngle(
          instructorLandmarks[def.instPoints[0]],
          instructorLandmarks[def.instPoints[1]],
          instructorLandmarks[def.instPoints[2]],
        )

        const angleDiff = Math.abs(userAngle - instAngle)
        jointAngles[def.name] = {
          user: Math.round(userAngle),
          instructor: Math.round(instAngle),
          diff: Math.round(angleDiff),
        }

        const acc = Math.max(0, 100 - (angleDiff / 30) * 100)
        angleAccuracy += acc
        validAngles++

        if (angleDiff > 15) {
          feedback.push(`${def.label}: ${userAngle < instAngle ? "Extend" : "Bend"} ${Math.round(angleDiff)}° more`)
        }
      } catch (e) {}
    })

    // 3. Calculate symmetry score
    symmetryPairs.forEach((pair) => {
      const left = userLandmarks[pair.left]
      const right = userLandmarks[pair.right]
      if (left && right) {
        const yDiff = Math.abs(left.y - right.y)
        const pairScore = Math.max(0, 100 - yDiff * 200)
        symmetryScore += pairScore
        validSymmetry++

        if (pairScore < 70) {
          feedback.push(`${left.y < right.y ? "Left" : "Right"} ${pair.name} higher`)
        }
      }
    })

    // Calculate raw accuracies
    const rawPosition = validPositions > 0 ? positionAccuracy / validPositions : 0
    const rawAngle = validAngles > 0 ? angleAccuracy / validAngles : 0
    const rawSymmetry = validSymmetry > 0 ? symmetryScore / validSymmetry : 100

    // Combined raw accuracy: 40% position, 40% angles, 20% symmetry
    const combinedRaw = rawPosition * 0.4 + rawAngle * 0.4 + rawSymmetry * 0.2

    // Apply 80% base + 20% scaled formula
    const BASE_ACCURACY = 80
    const VARIABLE_RANGE = 20
    const scaledAccuracy = BASE_ACCURACY + (combinedRaw / 100) * VARIABLE_RANGE

    return {
      overall: combinedRaw,
      scaled: Math.min(100, scaledAccuracy),
      joints: jointAccuracies,
      angles: jointAngles,
      symmetry: rawSymmetry,
      feedback: feedback.slice(0, 3),
    }
  }, [])

  const getYouTubeId = (url: string) => {
    if (!url) return null
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        console.log("[v0] YouTube ID extracted:", match[1], "from pattern:", pattern)
        return match[1]
      }
    }

    // If URL is just an ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      console.log("[v0] URL appears to be just a YouTube ID:", url)
      return url
    }

    console.log("[v0] No YouTube ID found in URL:", url)
    return null
  }

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null

  const loadYouTubeAPI = (url: string) => {
    const ytId = getYouTubeId(url)
    if (!ytId) {
      console.log("[v0] Invalid YouTube URL, cannot load player:", url)
      return
    }

    console.log("[v0] Loading YouTube API for video ID:", ytId)

    const initPlayer = () => {
      const playerDiv = document.getElementById("youtube-player")
      console.log("[v0] YouTube player div found:", !!playerDiv)
      console.log("[v0] YT object available:", !!(window as any).YT)
      console.log("[v0] YT.Player available:", !!(window as any).YT?.Player)

      if (playerDiv && (window as any).YT && (window as any).YT.Player) {
        console.log("[v0] Creating YouTube player for ID:", ytId)
        try {
          youtubePlayerRef.current = new (window as any).YT.Player("youtube-player", {
            videoId: ytId,
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: 1,
              enablejsapi: 1,
              origin: window.location.origin,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: (event: any) => {
                console.log("[v0] YouTube player ready! Duration:", event.target.getDuration())
              },
              onStateChange: (event: any) => {
                console.log("[v0] YouTube player state changed:", event.data)
                if (event.data === 1) {
                  // Playing
                  console.log("[v0] Video playing, starting timer sync")
                  startTimer()
                }
              },
              onError: (event: any) => {
                console.error("[v0] YouTube player error:", event.data)
              },
            },
          })
          console.log("[v0] YouTube player created successfully")
        } catch (error) {
          console.error("[v0] Error creating YouTube player:", error)
        }
      } else {
        console.log("[v0] Cannot create player - missing requirements")
      }
    }

    if ((window as any).YT && (window as any).YT.Player) {
      console.log("[v0] YouTube API already loaded, initializing player...")
      setTimeout(initPlayer, 500)
    } else {
      console.log("[v0] Loading YouTube IFrame API script...")
      ;(window as any).onYouTubeIframeAPIReady = () => {
        console.log("[v0] YouTube IFrame API ready callback fired")
        setTimeout(initPlayer, 100)
      }
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        tag.onload = () => console.log("[v0] YouTube API script loaded")
        tag.onerror = () => console.error("[v0] Failed to load YouTube API script")
        document.head.appendChild(tag)
      }
    }
  }

  const startTimer = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
    }

    console.log("[v0] Starting timer...")
    timerRunningRef.current = true
    let lastTime = Date.now()
    let internalTime = 0 // Track internal time separately

    const updateTimer = () => {
      if (!timerRunningRef.current) {
        return
      }

      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === "function") {
        try {
          const playerState = youtubePlayerRef.current.getPlayerState?.()
          // State 1 = playing
          if (playerState === 1) {
            const currentTime = youtubePlayerRef.current.getCurrentTime() * 1000
            setCurrentVideoTime(currentTime)
            currentVideoTimeRef.current = currentTime
            console.log("[v0] YouTube time:", (currentTime / 1000).toFixed(1) + "s")
          } else {
            // Video not playing, use internal timer
            internalTime += deltaTime
            setCurrentVideoTime(internalTime)
            currentVideoTimeRef.current = internalTime
          }
        } catch (error) {
          internalTime += deltaTime
          setCurrentVideoTime(internalTime)
          currentVideoTimeRef.current = internalTime
        }
      } else {
        // No YouTube player, use internal timer
        internalTime += deltaTime
        setCurrentVideoTime(internalTime)
        currentVideoTimeRef.current = internalTime
      }

      timerRef.current = requestAnimationFrame(updateTimer)
    }

    timerRef.current = requestAnimationFrame(updateTimer)
  }

  const startPoseDetection = () => {
    if (!poseLandmarker) {
      console.error("[v0] MediaPipe not initialized!")
      return
    }

    if (!webcamRef.current || !canvasRef.current) {
      console.error("[v0] Video or canvas ref missing!")
      return
    }

    console.log("[v0] Starting pose detection loop...")
    console.log("[v0] Instructor poses loaded:", instructorPosesRef.current.length)

    let frameCount = 0 // Track frames for periodic logging

    const detectPose = async () => {
      if (!webcamRef.current || !canvasRef.current || !cameraActiveRef.current || !poseLandmarker) {
        return
      }

      try {
        const videoTime = performance.now()
        const results = poseLandmarker.detectForVideo(webcamRef.current, videoTime)

        if (results.landmarks && results.landmarks.length > 0) {
          const ctx = canvasRef.current.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

            const { DrawingUtils, PoseLandmarker: PL } = await import("@mediapipe/tasks-vision")
            const drawingUtils = new DrawingUtils(ctx)
            drawingUtils.drawLandmarks(results.landmarks[0])
            drawingUtils.drawConnectors(results.landmarks[0], PL.POSE_CONNECTIONS)
          }

          const poses = instructorPosesRef.current
          const currentTime = currentVideoTimeRef.current

          frameCount++
          if (frameCount % 30 === 0) {
            // Log every 30 frames
            console.log(
              "[v0] Frame:",
              frameCount,
              "Time:",
              (currentTime / 1000).toFixed(2) + "s",
              "Poses:",
              poses.length,
            )
          }

          if (poses.length > 0 && currentTime > 0) {
            const closestInstructorPose = findClosestPose(currentTime)

            if (closestInstructorPose && closestInstructorPose.landmarks) {
              const accuracy = calculatePoseAccuracy(results.landmarks[0], closestInstructorPose.landmarks)
              setCurrentAccuracy(accuracy.scaled)
              setJointAccuracies(accuracy.joints)

              if (frameCount % 30 === 0) {
                console.log(
                  "[v0] Comparing at timestamp:",
                  closestInstructorPose.timestamp,
                  "Accuracy:",
                  accuracy.overall.toFixed(1) + "%",
                )
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Pose detection error:", error)
      }

      if (cameraActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectPose)
      }
    }

    detectPose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pose data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Error: {error}</p>
            <Link href="/admin/pose-analytics">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionId || instructorPoses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No pose data found for this session.</p>
            <Link href="/admin/pose-analytics">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Pose Testing</h1>
          <p className="text-muted-foreground">Compare your pose with the instructor in real-time</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={mediaPipeReady ? "default" : "secondary"}>
            MediaPipe: {mediaPipeReady ? "Ready" : "Loading..."}
          </Badge>
          <Link href="/admin/pose-analytics">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-4 bg-gray-50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Session ID:</span>
              <p className="font-mono">{sessionId || "None"}</p>
            </div>
            <div>
              <span className="text-gray-500">Poses Loaded:</span>
              <p className="font-mono">{instructorPoses.length}</p>
            </div>
            <div>
              <span className="text-gray-500">Video URL:</span>
              <p className="font-mono text-xs truncate">{videoUrl || "Not found"}</p>
            </div>
            <div>
              <span className="text-gray-500">YouTube ID:</span>
              <p className="font-mono">{youtubeId || "None"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-6">
        <div
          className={`inline-block px-8 py-4 rounded-xl border-2 ${
            currentAccuracy >= 80
              ? "bg-green-50 border-green-300"
              : currentAccuracy >= 50
                ? "bg-yellow-50 border-yellow-300"
                : "bg-red-50 border-red-300"
          }`}
        >
          <p className="text-sm text-gray-600 mb-1">Real-Time Accuracy</p>
          <h2
            className={`text-4xl font-bold ${
              currentAccuracy >= 80 ? "text-green-600" : currentAccuracy >= 50 ? "text-yellow-600" : "text-red-600"
            }`}
          >
            {currentAccuracy.toFixed(1)}%
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                <CardTitle>Instructor Video</CardTitle>
              </div>
              <Badge variant="outline">{instructorPoses.length} poses extracted</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {youtubeId ? (
              <>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <div id="youtube-player" className="w-full h-full"></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Video ID: {youtubeId}</p>
              </>
            ) : videoUrl ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
                <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Unable to parse video URL</p>
                <p className="text-sm text-gray-400 mt-2 px-4 text-center break-all">URL: {videoUrl}</p>
              </div>
            ) : (
              <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
                <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No video available</p>
                <p className="text-sm text-gray-400 mt-2">Video URL not found in database</p>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Video Time (auto-synced)</p>
              <p className="font-mono text-lg">Current: {(currentVideoTime / 1000).toFixed(1)}s</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <CardTitle>Your Webcam</CardTitle>
              </div>
              {cameraActive ? (
                <Button onClick={stopCamera} variant="destructive" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              ) : (
                <Button onClick={startCamera} variant="default" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Camera not active</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Comparison Analytics</CardTitle>
          <p className="text-sm text-muted-foreground">Real-time joint-by-joint accuracy breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(jointAccuracies).map(([joint, accuracy]: [string, any]) => (
              <div
                key={joint}
                className={`p-3 rounded-lg border ${
                  accuracy >= 80
                    ? "bg-green-50 border-green-200"
                    : accuracy >= 50
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-xs text-gray-600 mb-1 capitalize">{joint.replace("_", " ")}</p>
                <p
                  className={`text-lg font-bold ${
                    accuracy >= 80 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {accuracy.toFixed(1)}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      accuracy >= 80 ? "bg-green-500" : accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {Object.keys(jointAccuracies).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>Start camera and play video to see live analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestPoseLivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TestPoseLiveContent />
    </Suspense>
  )
}
