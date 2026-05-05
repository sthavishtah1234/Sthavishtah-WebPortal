"use client"

import { Suspense } from "react"
import { getSupabaseServerClient } from "@/lib/supabase"
import Link from "next/link"

// Simple component to display the YouTube video without controls
function CourseVideoPlayer({ course }) {
  // Extract YouTube video ID
  const getYoutubeVideoId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getYoutubeVideoId(course.youtube_link)

  // Create a restricted YouTube embed URL that hides controls
  const getRestrictedYoutubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}?controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        {course.description && <p className="text-gray-600 mb-4">{course.description}</p>}
      </div>

      {videoId ? (
        <div className="aspect-video mb-8 rounded-lg overflow-hidden shadow-lg relative">
          {/* CSS overlay to prevent interaction with YouTube controls */}
          <div className="absolute inset-0 z-10 pointer-events-none"></div>

          <iframe
            width="100%"
            height="100%"
            src={getRestrictedYoutubeEmbedUrl(videoId)}
            title={course.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          ></iframe>

          {/* Custom play/pause overlay */}
          <style jsx>{`
            /* Hide YouTube player controls */
            iframe {
              pointer-events: none; /* Disable interaction with the iframe */
            }
            
            /* Make the video container clickable for play/pause */
            .video-container {
              position: relative;
              cursor: pointer;
            }
          `}</style>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-8">
          No video link available for this session.
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Link href="/user/previous-sessions" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
          Back to Previous Sessions
        </Link>
      </div>
    </div>
  )
}

// Error component
function ErrorComponent({ message }) {
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Error</h1>
      <p className="mb-6">{message}</p>
      <Link
        href="/user/previous-sessions"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Back to Previous Sessions
      </Link>
    </div>
  )
}

async function VideoPlayerContent({ contentId }) {
  try {
    // Get the course directly from the courses table
    const supabase = getSupabaseServerClient()
    const { data: course, error } = await supabase.from("courses").select("*").eq("id", contentId).single()

    if (error) {
      console.error("Error fetching course:", error)
      return <ErrorComponent message="Failed to load the course. Please try again later." />
    }

    if (!course) {
      return <ErrorComponent message="Course not found. It may have been removed." />
    }

    // Check if the course has a YouTube link
    if (!course.youtube_link) {
      return <ErrorComponent message="This course does not have a video link." />
    }

    // Display the course video
    return <CourseVideoPlayer course={course} />
  } catch (error) {
    console.error("Unexpected error:", error)
    return <ErrorComponent message="An unexpected error occurred. Please try again later." />
  }
}

export default function VideoPlayerPage({ params }) {
  const contentId = params.contentId

  return (
    <Suspense fallback={<div className="container mx-auto p-8">Loading video content...</div>}>
      <VideoPlayerContent contentId={contentId} />
    </Suspense>
  )
}
