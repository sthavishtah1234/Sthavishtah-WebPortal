"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Camera, Eye, Maximize, X } from "lucide-react"
import { extractYoutubeVideoId } from "@/lib/utils"
import ZoomPlayerSimple from "@/components/zoom-player-simple"
import { SilentPoseTracker } from "@/components/silent-pose-tracker"

interface LiveSessionProps {
  params: { courseId: string }
}

export default function LiveSessionPage({ params }: LiveSessionProps) {
  const courseId = params.courseId
  const router = useRouter()

  const [courseData, setCourseData] = useState<any>(null)
  const [videoId, setVideoId] = useState<string>("")
  const [videoType, setVideoType] = useState<"youtube" | "zoom">("youtube")
  const [zoomMeetingId, setZoomMeetingId] = useState("")
  const [zoomPasscode, setZoomPasscode] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")

  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)
  const [attendanceRecorded, setAttendanceRecorded] = useState(false)
  const [completionRecorded, setCompletionRecorded] = useState(false)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string; left: number }>>([])

  const [needsUserInteraction, setNeedsUserInteraction] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [user, setUser] = useState<any>(null)
  const instructorVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    async function fetchCourse() {
      console.log("[v0] Fetching course data for ID:", courseId)
      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

      if (error) {
        console.error("[v0] Error fetching course:", error)
        return
      }

      if (data) {
        console.log("[v0] Course data fetched:", data)
        setCourseData(data)

        const courseVideoType = data.video_type || "youtube"
        setVideoType(courseVideoType)
        console.log("[v0] Video type:", courseVideoType)

        if (courseVideoType === "zoom") {
          // Load Zoom meeting details
          setZoomMeetingId(data.zoom_meeting_id || "")
          setZoomPasscode(data.zoom_passcode || "")
          console.log("[v0] Zoom meeting ID:", data.zoom_meeting_id)
        } else {
          // Load YouTube video
          const videoUrl = data.youtube_link || data.video_url || data.youtube_url || ""
          console.log("[v0] Video URL from database:", videoUrl)
          const ytId = extractYoutubeVideoId(videoUrl)
          console.log("[v0] Extracted YouTube ID using utility:", ytId)
          if (ytId) {
            setVideoId(ytId)
            const scheduledDate = new Date(data.scheduled_date)

            if (data.is_predefined_batch && data.batch_number) {
              // Parse predefined batch times based on batch number
              const batchNum = Number.parseInt(data.batch_number)
              let hours = 0
              let minutes = 0

              if (batchNum === 1) {
                hours = 5
                minutes = 30 // Morning Batch 1 (5:30 to 6:30)
              } else if (batchNum === 2) {
                hours = 6
                minutes = 40 // Morning Batch 2 (6:40 to 7:40)
              } else if (batchNum === 3) {
                hours = 7
                minutes = 50 // Morning Batch 3 (7:50 to 8:50)
              } else if (batchNum === 4) {
                hours = 17
                minutes = 30 // Evening Batch 4 (5:30 to 6:30)
              } else if (batchNum === 5) {
                hours = 18
                minutes = 40 // Evening Batch 5 (6:40 to 7:40)
              } else if (batchNum === 6) {
                hours = 19
                minutes = 50 // Evening Batch 6 (7:50 to 8:50)
              }

              scheduledDate.setHours(hours, minutes, 0, 0)
              setSessionStartTime(scheduledDate)
              console.log("[v0] Predefined batch session start time:", scheduledDate)
            } else if (data.custom_batch_time) {
              // Parse custom batch time (e.g., "9:00 AM")
              const timeMatch = data.custom_batch_time.match(/(\d+):(\d+)\s*(AM|PM)/)
              if (timeMatch) {
                let hours = Number.parseInt(timeMatch[1])
                const minutes = Number.parseInt(timeMatch[2])
                const period = timeMatch[3]

                if (period === "PM" && hours !== 12) hours += 12
                if (period === "AM" && hours === 12) hours = 0

                scheduledDate.setHours(hours, minutes, 0, 0)
                setSessionStartTime(scheduledDate)
                console.log("[v0] Custom batch session start time:", scheduledDate)
              }
            }
          } else {
            console.error("[v0] Failed to extract video ID from URL:", videoUrl)
          }
        }
      }
    }

    fetchCourse()

    const storedUserName = localStorage.getItem("userName") || localStorage.getItem("userAuthenticated") || "User"
    const storedUserEmail = localStorage.getItem("userEmail") || ""
    setUserName(storedUserName)
    setUserEmail(storedUserEmail)

    recordAttendance()
  }, [courseId])

  const recordAttendance = async () => {
    console.log("[v0] recordAttendance called, attendanceRecorded:", attendanceRecorded)
    if (attendanceRecorded) return

    try {
      const userEmail = localStorage.getItem("userEmail")
      console.log("[v0] User email from localStorage:", userEmail)

      if (!userEmail) {
        console.error("[v0] No user email found in localStorage")
        return
      }

      // Get user ID
      console.log("[v0] Fetching user ID for email:", userEmail)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single()

      if (userError || !userData) {
        console.error("[v0] Error fetching user:", userError)
        return
      }

      console.log("[v0] User ID found:", userData.id, "Course ID:", courseId)

      // Check if user_courses entry exists
      const { data: existingEntry, error: checkError } = await supabase
        .from("user_courses")
        .select("id, attended")
        .eq("user_id", userData.id)
        .eq("course_id", courseId)
        .single()

      console.log("[v0] Existing entry check:", { existingEntry, checkError })

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[v0] Error checking user_courses:", checkError)
        return
      }

      if (existingEntry) {
        // Update existing entry
        console.log("[v0] Found existing entry, attended status:", existingEntry.attended)
        if (!existingEntry.attended) {
          console.log("[v0] Updating attendance to true")
          const { error: updateError } = await supabase
            .from("user_courses")
            .update({ attended: true, attended_at: new Date().toISOString() })
            .eq("id", existingEntry.id)

          if (updateError) {
            console.error("[v0] Error updating attendance:", updateError)
          } else {
            console.log("[v0] ✅ Attendance recorded successfully")
            setAttendanceRecorded(true)
          }
        } else {
          console.log("[v0] User already marked as attended")
          setAttendanceRecorded(true)
        }
      } else {
        // Create new entry
        console.log("[v0] No existing entry, creating new user_courses record")
        const { error: insertError } = await supabase.from("user_courses").insert({
          user_id: userData.id,
          course_id: courseId,
          attended: true,
          attended_at: new Date().toISOString(),
          completed_video: false,
        })

        if (insertError) {
          console.error("[v0] Error creating user_courses entry:", insertError)
        } else {
          console.log("[v0] ✅ Attendance recorded successfully (new entry)")
          setAttendanceRecorded(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error in recordAttendance:", error)
    }
  }

  const recordCompletion = async () => {
    console.log("[v0] recordCompletion called, completionRecorded:", completionRecorded)
    if (completionRecorded) return

    try {
      const userEmail = localStorage.getItem("userEmail")
      console.log("[v0] User email for completion:", userEmail)

      if (!userEmail) {
        console.error("[v0] No user email found for completion tracking")
        return
      }

      // Get user ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single()

      if (userError || !userData) {
        console.error("[v0] Error fetching user for completion:", userError)
        return
      }

      console.log("[v0] Marking video as completed for user:", userData.id, "course:", courseId)

      // Update user_courses to mark as completed
      const { error: updateError } = await supabase
        .from("user_courses")
        .update({ completed_video: true })
        .eq("user_id", userData.id)
        .eq("course_id", courseId)

      if (updateError) {
        console.error("[v0] Error recording completion:", updateError)
      } else {
        console.log("[v0] ✅ Video completion recorded successfully")
        setCompletionRecorded(true)
      }
    } catch (error) {
      console.error("[v0] Error in recordCompletion:", error)
    }
  }

  useEffect(() => {
    if (!sessionStartTime || !videoDuration || videoDuration === 0) return

    const checkSessionStatus = () => {
      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)

      // Only kick out if elapsed time is significantly past video duration (30 sec buffer)
      if (elapsedSeconds > videoDuration + 30) {
        console.log("[v0] Session expired - elapsed:", elapsedSeconds, "duration:", videoDuration)
        router.push(`/user/access-course?sessionEnded=${courseId}`)
      }
    }

    // Check every 5 seconds instead of every second
    const interval = setInterval(checkSessionStatus, 5000)
    return () => clearInterval(interval)
  }, [sessionStartTime, videoDuration, router, courseId])

  useEffect(() => {
    if (videoType !== "youtube" || !videoId || !sessionStartTime) return

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer()
      } else {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = initializePlayer
      }
    }

    const initializePlayer = () => {
      if (!playerRef.current) {
        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        })
      }
    }

    const onPlayerReady = (event: any) => {
      const duration = event.target.getDuration()
      setVideoDuration(duration)
      console.log("[v0] Video duration:", duration, "seconds")

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.setActionHandler("play", null)
        navigator.mediaSession.setActionHandler("pause", null)
        navigator.mediaSession.setActionHandler("seekbackward", null)
        navigator.mediaSession.setActionHandler("seekforward", null)
        navigator.mediaSession.setActionHandler("seekto", null)
      }

      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
      console.log("[v0] Session started at:", sessionStartTime, "Elapsed seconds:", elapsedSeconds)

      if (elapsedSeconds > duration) {
        console.log("[v0] Session already ended")
        router.push(`/user/access-course?sessionEnded=${courseId}`)
        return
      } else if (elapsedSeconds > 0) {
        const prePlayTime = Math.max(0, elapsedSeconds - 10)
        console.log("[v0] User joined late, seeking to:", prePlayTime, "(10 sec before current:", elapsedSeconds, ")")
        event.target.seekTo(prePlayTime, true)
      }

      tryAutoplay(event.target)
    }

    const onPlayerStateChange = (event: any) => {
      console.log("[v0] Player state changed:", event.data)

      if (event.data === 1) {
        // Playing
        const currentTime = playerRef.current?.getCurrentTime() || 0
        const now = new Date()
        const elapsedSeconds = Math.floor((now.getTime() - (sessionStartTime?.getTime() || now.getTime())) / 1000)
        const expectedTime = Math.max(0, elapsedSeconds - 10)

        if (currentTime > expectedTime + 5) {
          console.log("[v0] User is ahead of live position, resetting...")
          playerRef.current?.seekTo(expectedTime, true)
        }
      } else if (event.data === 0) {
        console.log("[v0] Video ended, recording completion")
        recordCompletion()
        setTimeout(() => {
          router.push(`/user/access-course?sessionEnded=${courseId}`)
        }, 2000)
      }
    }

    loadYouTubeAPI()

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [videoId, sessionStartTime, videoType])

  useEffect(() => {
    if (videoType === "youtube" && playerRef.current) {
      const iframe = document.querySelector("iframe")
      if (iframe) {
        instructorVideoRef.current = iframe as any
      }
    }
  }, [videoType, playerRef.current])

  useEffect(() => {
    async function fetchUser() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (videoType === "youtube" && !stream && !cameraEnabled) {
      requestCamera()
    }
  }, [videoType])

  async function requestCamera() {
    try {
      console.log("[v0] Requesting camera permissions...")
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      console.log("[v0] Camera access granted!")
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraEnabled(true)
    } catch (err) {
      console.error("[v0] Camera access denied or error:", err)
      alert("Camera access was denied. Please allow camera permissions in your browser settings.")
    }
  }

  function toggleCamera() {
    handleUserInteraction()
    console.log("[v0] Camera toggle clicked, current state:", cameraEnabled)
    if (cameraEnabled) {
      console.log("[v0] Turning camera off")
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraEnabled(false)
    } else {
      console.log("[v0] Requesting camera access")
      requestCamera()
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging) return
      setPreviewPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    function handleMouseUp() {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  function handleEmojiClick(emoji: string) {
    handleUserInteraction() // Enable autoplay on emoji click
    const id = Date.now().toString() + Math.random()
    const left = Math.random() * 80 + 10

    setFloatingEmojis((prev) => [...prev, { id, emoji, left }])

    // Remove emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id))
    }, 3000)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  function handleExit() {
    console.log("[v0] Exiting session, stopping camera...")
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    router.push("/user/dashboard")
  }

  useEffect(() => {
    return () => {
      console.log("[v0] Component unmounting, cleaning up camera")
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (stream && videoRef.current && cameraEnabled && previewVisible) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => console.log("[v0] Video play error:", err))
    }
  }, [stream, previewVisible, cameraEnabled])

  function handleManualPlay() {
    if (playerRef.current) {
      console.log("[v0] Manual play triggered")
      playerRef.current.playVideo()
      setNeedsUserInteraction(false)
      setHasUserInteracted(true)
    }
  }

  function tryAutoplay(player: any) {
    console.log("[v0] Attempting autoplay...")

    const playPromise = player.playVideo()

    // Check if playVideo returns a promise (newer YouTube API)
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("[v0] Autoplay succeeded")
          setNeedsUserInteraction(false)
        })
        .catch((error: any) => {
          console.log("[v0] Autoplay failed, requiring user interaction:", error)
          setNeedsUserInteraction(true)
        })
    } else {
      // Older API - check if video is playing after a delay
      setTimeout(() => {
        const state = player.getPlayerState()
        if (state !== window.YT.PlayerState.PLAYING) {
          console.log("[v0] Autoplay failed (detected via state check)")
          setNeedsUserInteraction(true)
        }
      }, 500)
    }
  }

  function handleUserInteraction() {
    if (!hasUserInteracted) {
      console.log("[v0] User interacted, enabling autoplay")
      setHasUserInteracted(true)

      // If player is waiting for interaction, play it now
      if (needsUserInteraction && playerRef.current) {
        playerRef.current.playVideo()
        setNeedsUserInteraction(false)
      }
    }
  }

  useEffect(() => {
    const updatePreviewPosition = () => {
      setPreviewPosition({
        x: window.innerWidth - 220,
        y: window.innerHeight - 200,
      })
    }
    updatePreviewPosition()
    window.addEventListener("resize", updatePreviewPosition)
    return () => window.removeEventListener("resize", updatePreviewPosition)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {videoType === "zoom" ? (
        // Zoom Player Simple
        <ZoomPlayerSimple
          meetingNumber={zoomMeetingId}
          passcode={zoomPasscode}
          joinUrl={courseData?.zoom_join_url}
          userName={userName}
          courseId={courseId}
        />
      ) : (
        <>
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30 bg-red-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>

          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 w-full h-full z-10">
              {videoId ? (
                <div id="youtube-player" className="w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-white">
                  <p className="text-sm md:text-base">Loading video...</p>
                </div>
              )}
            </div>
          </div>

          {needsUserInteraction && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
              <button
                onClick={handleManualPlay}
                className="px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white rounded-full text-lg md:text-xl font-bold flex items-center gap-2 md:gap-3 hover:bg-red-700 transition shadow-2xl"
              >
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="hidden sm:inline">Start Live Session</span>
                <span className="sm:hidden">Start</span>
              </button>
            </div>
          )}

          <style jsx global>{`
            #youtube-player iframe {
              pointer-events: all !important;
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
            #youtube-player {
              pointer-events: all !important;
            }
            /* Block YouTube controls overlay */
            #youtube-player iframe .ytp-chrome-bottom,
            #youtube-player iframe .ytp-gradient-bottom,
            #youtube-player iframe .ytp-progress-bar-container {
              pointer-events: none !important;
              display: none !important;
            }
            @keyframes floatUp {
              0% {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-500px) scale(1.8);
                opacity: 0;
              }
            }
            .emoji-float {
              animation: floatUp 3s ease-out forwards;
            }
          `}</style>

          {floatingEmojis.map((emojiItem) => (
            <div
              key={emojiItem.id}
              className="fixed bottom-0 text-4xl md:text-6xl pointer-events-none z-[100] animate-float"
              style={{
                left: `${emojiItem.left}%`,
                animation: "float-up 3s ease-out forwards",
              }}
            >
              {emojiItem.emoji}
            </div>
          ))}

          {cameraEnabled && previewVisible && (
            <div
              ref={previewRef}
              className="absolute z-50 w-32 h-24 md:w-48 md:h-36 bg-gray-900 border-2 border-blue-500 rounded-lg overflow-hidden shadow-2xl cursor-move"
              style={{
                left: `${previewPosition.x}px`,
                top: `${previewPosition.y}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
          )}

          {videoType === "youtube" && user && cameraEnabled && (
            <SilentPoseTracker
              userEmail={user.email}
              courseId={courseId}
              userVideoRef={videoRef.current}
              instructorVideoElement={instructorVideoRef.current}
              isActive={cameraEnabled}
            />
          )}

          <div className="relative z-30 bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 py-1.5 md:py-4 px-2 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-4 max-w-7xl mx-auto">
              {/* Camera controls */}
              <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto justify-center md:justify-start">
                <button
                  onClick={toggleCamera}
                  className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 transition text-xs md:text-base ${
                    cameraEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">{cameraEnabled ? "Camera ON" : "Camera OFF"}</span>
                  <span className="sm:hidden">Cam</span>
                </button>
                <button
                  onClick={() => setPreviewVisible(!previewVisible)}
                  className="px-2 py-1.5 md:px-4 md:py-2 bg-gray-700 text-white rounded-lg flex items-center gap-1 md:gap-2 hover:bg-gray-600 transition text-xs md:text-base"
                >
                  <Eye className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              <div className="flex items-center gap-0.5 md:gap-2 overflow-x-auto max-w-full md:max-w-none">
                {["😊", "❤️", "👍", "🔥", "💯", "😂", "🎉", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-lg md:text-2xl hover:scale-125 transition-transform p-1 md:p-2 hover:bg-gray-700/50 rounded flex-shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto justify-center md:justify-end">
                <button
                  onClick={toggleFullscreen}
                  className="px-2 py-1.5 md:px-4 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={handleExit}
                  className="px-2 py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg flex items-center gap-1 md:gap-2 hover:bg-red-700 transition text-xs md:text-base"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getSupabaseBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
