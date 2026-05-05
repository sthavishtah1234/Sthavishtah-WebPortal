"use client"

import { useEffect, useRef, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getZoomSdkKey } from "@/app/actions/get-zoom-sdk-key"

declare global {
  interface Window {
    ZoomMtg: any
  }
}

interface ZoomPlayerHybridProps {
  meetingNumber: string
  passcode?: string
  userName: string
  userEmail?: string
  joinUrl?: string
  onEnd?: () => void
}

export function ZoomPlayerHybrid({
  meetingNumber,
  passcode = "",
  userName,
  userEmail,
  joinUrl,
  onEnd,
}: ZoomPlayerHybridProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embedMethod, setEmbedMethod] = useState<"sdk" | "iframe">("iframe")
  const zoomContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("[v0] ZoomPlayerHybrid mounted with props:", {
      meetingNumber,
      passcode,
      userName,
      userEmail,
      joinUrl,
    })
  }, [])

  useEffect(() => {
    checkCredentialsAndLoad()
  }, [])

  const checkCredentialsAndLoad = async () => {
    try {
      console.log("[v0] Checking for SDK credentials...")
      // Try to get SDK key first
      const key = await getZoomSdkKey()

      if (key) {
        console.log("[v0] SDK Key available, using Meeting SDK")
        setEmbedMethod("sdk")
        await loadMeetingSDK(key)
      } else {
        console.log("[v0] SDK Key not available, falling back to iframe immediately")
        setEmbedMethod("iframe")
        setTimeout(() => setIsLoading(false), 1000)
      }
    } catch (err) {
      console.log("[v0] SDK not available, using iframe fallback:", err)
      setEmbedMethod("iframe")
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  const loadMeetingSDK = async (sdkKey: string) => {
    try {
      const link = document.createElement("link")
      link.href = "https://source.zoom.us/2.18.0/css/bootstrap.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)

      const link2 = document.createElement("link")
      link2.href = "https://source.zoom.us/2.18.0/css/react-select.css"
      link2.rel = "stylesheet"
      document.head.appendChild(link2)

      await loadScript("https://source.zoom.us/2.18.0/lib/vendor/react.min.js")
      await loadScript("https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js")
      await loadScript("https://source.zoom.us/2.18.0/lib/vendor/redux.min.js")
      await loadScript("https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js")
      await loadScript("https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js")
      await loadScript("https://source.zoom.us/zoom-meeting-2.18.0.min.js")

      await initializeMeetingSDK(sdkKey)
    } catch (err) {
      console.error("[v0] Meeting SDK load failed:", err)
      setError("Failed to load Zoom SDK")
      setIsLoading(false)
    }
  }

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.body.appendChild(script)
    })
  }

  const initializeMeetingSDK = async (sdkKey: string) => {
    try {
      const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, "")
      console.log("[v0] Initializing with meeting number:", cleanMeetingNumber)

      const response = await fetch("/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNumber: cleanMeetingNumber, role: 0 }),
      })

      console.log("[v0] Signature API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Signature API error response:", errorText)

        console.log("[v0] SDK signature failed, falling back to iframe")
        setEmbedMethod("iframe")
        setIsLoading(false)
        return
      }

      const responseData = await response.json()
      console.log("[v0] Signature received, length:", responseData.signature?.length || 0)
      const { signature } = responseData

      window.ZoomMtg.setZoomJSLib("https://source.zoom.us/2.18.0/lib", "/av")
      window.ZoomMtg.preLoadWasm()
      window.ZoomMtg.prepareWebSDK()

      window.ZoomMtg.init({
        leaveUrl: window.location.origin + "/user/access-course",
        success: () => {
          window.ZoomMtg.join({
            sdkKey: sdkKey,
            signature: signature,
            meetingNumber: cleanMeetingNumber,
            userName: userName,
            userEmail: userEmail || "",
            passWord: passcode,
            success: () => {
              console.log("[v0] Successfully joined meeting via SDK")
              setIsLoading(false)
            },
            error: (error: any) => {
              console.error("[v0] Join error:", error)
              console.log("[v0] SDK join failed, falling back to iframe")
              setEmbedMethod("iframe")
              setIsLoading(false)
            },
          })
        },
        error: (error: any) => {
          console.error("[v0] Init error:", error)
          console.log("[v0] SDK init failed, falling back to iframe")
          setEmbedMethod("iframe")
          setIsLoading(false)
        },
      })
    } catch (err: any) {
      console.error("[v0] Meeting SDK initialization failed:", err)
      console.error("[v0] Error details:", err.message, err.stack)
      console.log("[v0] SDK error caught, falling back to iframe")
      setEmbedMethod("iframe")
      setIsLoading(false)
    }
  }

  const getIframeUrl = () => {
    if (joinUrl) {
      console.log("[v0] Using provided join URL:", joinUrl)
      return joinUrl
    }

    const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, "")
    let url = `https://zoom.us/wc/join/${cleanMeetingNumber}`

    if (passcode) {
      url += `?pwd=${encodeURIComponent(passcode)}`
    }

    url += passcode ? `&prefer=1` : `?prefer=1`

    console.log("[v0] Generated iframe URL:", url)
    return url
  }

  useEffect(() => {
    console.log("[v0] Embed method set to:", embedMethod)
    console.log("[v0] Loading state:", isLoading)
  }, [embedMethod, isLoading])

  if (!meetingNumber || meetingNumber.trim() === "") {
    console.error("[v0] No meeting number provided!")
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Meeting Not Available</h2>
          <p className="text-gray-400 mb-6">No meeting ID was provided for this course.</p>
          <Button onClick={onEnd} variant="outline">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to Join Meeting</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={onEnd} variant="outline">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="text-center text-white">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Connecting to Zoom meeting...</p>
            <p className="text-sm text-gray-400 mt-2">
              {embedMethod === "sdk" ? "Loading Meeting SDK..." : "Preparing meeting room..."}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Meeting: {meetingNumber} | Method: {embedMethod}
            </p>
          </div>
        </div>
      )}

      {embedMethod === "sdk" ? (
        // Meeting SDK embed
        <div ref={zoomContainerRef} id="zmmtg-root" className="w-full h-full"></div>
      ) : (
        // Simple iframe embed
        <>
          {console.log("[v0] Rendering iframe with URL:", getIframeUrl())}
          <iframe
            src={getIframeUrl()}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; display-capture"
            title="Zoom Meeting"
            onLoad={() => {
              console.log("[v0] Zoom iframe loaded successfully")
              setIsLoading(false)
            }}
            onError={(e) => {
              console.error("[v0] Zoom iframe error:", e)
              setError("Failed to load Zoom meeting. Please try again.")
              setIsLoading(false)
            }}
          />
        </>
      )}

      {!isLoading && onEnd && (
        <Button onClick={onEnd} className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700" size="sm">
          <X className="w-4 h-4 mr-2" />
          Leave Meeting
        </Button>
      )}
    </div>
  )
}

export default ZoomPlayerHybrid
