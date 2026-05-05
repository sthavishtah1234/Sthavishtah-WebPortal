"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

type ContentType = {
  id: string
  title: string
  content_type: string
  content_url: string | null
  content_text: string | null
  youtube_link?: string // Added for direct course sessions
  course_modules: {
    id: string
    title: string
    courses: {
      id: string
      title: string
    }
  }
}

type VideoPlayerClientProps = {
  content: ContentType
  userId: string | null
  isLiveSession?: boolean
}

export default function VideoPlayerClient({ content, userId, isLiveSession = false }: VideoPlayerClientProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  // Get YouTube embed URL with restrictions
  const getYoutubeEmbedUrl = (youtubeLink: string) => {
    const videoId = getYoutubeVideoId(youtubeLink)
    if (!videoId) return null

    // Restricted parameters to prevent YouTube navigation
    return `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&showinfo=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.origin)}`
  }

  const markAsCompleted = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("user_progress")
        .update({
          progress_percentage: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("content_id", content.id)

      if (error) {
        console.error("Error marking content as completed:", error)
        return
      }

      setIsCompleted(true)
    } catch (error) {
      console.error("Error marking content as completed:", error)
    }
  }

  const handleVideoEnded = async () => {
    await markAsCompleted()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
        <p className="text-gray-600 mb-4">Module: {content.course_modules.title}</p>
      </div>

      <div
        ref={videoContainerRef}
        className={`bg-black rounded-lg overflow-hidden shadow-lg mb-8 aspect-video relative ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
      >
        {/* LIVE indicator */}
        {isLiveSession && (
          <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
            <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white inline-block"></span>
            LIVE
          </div>
        )}

        {/* YouTube Video */}
        {content.youtube_link && getYoutubeVideoId(content.youtube_link) && (
          <iframe
            width="100%"
            height="100%"
            src={getYoutubeEmbedUrl(content.youtube_link)}
            title={content.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen={true}
            className="w-full h-full"
          ></iframe>
        )}

        {/* Direct Video */}
        {content.content_type === "video" && content.content_url && !content.youtube_link && (
          <video className="w-full h-full" controls autoPlay src={content.content_url} onEnded={handleVideoEnded} />
        )}

        {/* No Video Available */}
        {!content.content_url && !content.youtube_link && (
          <div className="flex items-center justify-center h-full bg-gray-800 text-white">
            No video content available
          </div>
        )}

        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          {isFullscreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
            </svg>
          )}
        </button>
      </div>

      {content.content_text && (
        <div className="prose max-w-none mb-8">
          <h2 className="text-xl font-semibold mb-4">Content</h2>
          <div dangerouslySetInnerHTML={{ __html: content.content_text }} />
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300" onClick={() => window.history.back()}>
          Back to Course
        </button>

        {userId && (
          <button
            className={`px-4 py-2 ${isCompleted ? "bg-green-600" : "bg-blue-600"} text-white rounded-md hover:${
              isCompleted ? "bg-green-700" : "bg-blue-700"
            }`}
            onClick={markAsCompleted}
            disabled={isCompleted}
          >
            {isCompleted ? "Completed" : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  )
}
