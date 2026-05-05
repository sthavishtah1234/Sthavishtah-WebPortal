"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Maximize, X } from "lucide-react"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function PreviousSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [sessionData, setSessionData] = useState<any>(null)
  const [videoId, setVideoId] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const playerRef = useRef<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.from("user_sessions").select("*, courses(*)").eq("id", sessionId).single()

      if (data) {
        setSessionData(data)
        const ytId = extractYouTubeId(data.courses?.video_url || data.courses?.youtube_url || "")
        setVideoId(ytId)
      }
    }
    fetchSession()
  }, [sessionId])

  // Extract YouTube video ID
  function extractYouTubeId(url: string): string {
    if (!url) return ""
    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/, /^([a-zA-Z0-9_-]{11})$/]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return url
  }

  // Load YouTube API
  useEffect(() => {
    if (!videoId) return

    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      initializePlayer()
    }
  }, [videoId])

  function initializePlayer() {
    if (!videoId || playerRef.current) return

    playerRef.current = new window.YT.Player("youtube-player-prev", {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0, // Disable controls
        disablekb: 1, // Disable keyboard controls
        fs: 0, // Disable fullscreen button
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3, // Disable annotations
        enablejsapi: 1,
      },
    })
  }

  // Fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* YouTube Video */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10">
        <div id="youtube-player-prev" className="w-full h-full" />
        <div className="absolute inset-0 w-full h-full z-20 cursor-default" style={{ pointerEvents: "all" }} />
      </div>

      <style jsx global>{`
        #youtube-player-prev iframe {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        #youtube-player-prev {
          pointer-events: none !important;
        }
        #youtube-player-prev iframe * {
          pointer-events: none !important;
          user-select: none !important;
        }
      `}</style>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Session Info */}
          <div className="text-white">
            <h3 className="font-semibold">{sessionData?.courses?.title || "Previous Session"}</h3>
            <p className="text-sm text-gray-400">Recording</p>
          </div>

          {/* Right: Maximize & Exit */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/user/previous-sessions")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
            >
              <X className="w-5 h-5" />
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
