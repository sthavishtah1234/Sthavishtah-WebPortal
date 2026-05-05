"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getZoomSdkKey } from "@/app/actions/get-zoom-sdk-key"

declare global {
  interface Window {
    ZoomMtg: any
  }
}

interface ZoomPlayerProps {
  meetingNumber: string
  passcode?: string
  userName: string
  userEmail?: string
  onEnd?: () => void
}

export function ZoomPlayer({ meetingNumber, passcode = "", userName, userEmail, onEnd }: ZoomPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const zoomContainerRef = useRef<HTMLDivElement>(null)
  const [sdkKey, setSdkKey] = useState<string | null>(null)

  useEffect(() => {
    fetchSdkKeyAndLoad()
  }, [])

  const fetchSdkKeyAndLoad = async () => {
    try {
      const key = await getZoomSdkKey()
      console.log("[v0] SDK Key fetched:", !!key)
      setSdkKey(key)
      await loadZoomSDK(key)
    } catch (err) {
      console.error("[v0] Error fetching SDK key:", err)
      setError("Failed to load Zoom configuration")
      setIsLoading(false)
    }
  }

  const loadZoomSDK = async (key: string) => {
    try {
      const link = document.createElement("link")
      link.href = "https://source.zoom.us/2.18.0/css/bootstrap.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)

      const link2 = document.createElement("link")
      link2.href = "https://source.zoom.us/2.18.0/css/react-select.css"
      link2.rel = "stylesheet"
      document.head.appendChild(link2)

      const script = document.createElement("script")
      script.src = "https://source.zoom.us/2.18.0/lib/vendor/react.min.js"
      script.async = true
      document.body.appendChild(script)

      const script2 = document.createElement("script")
      script2.src = "https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js"
      script2.async = true
      document.body.appendChild(script2)

      const script3 = document.createElement("script")
      script3.src = "https://source.zoom.us/2.18.0/lib/vendor/redux.min.js"
      script3.async = true
      document.body.appendChild(script3)

      const script4 = document.createElement("script")
      script4.src = "https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js"
      script4.async = true
      document.body.appendChild(script4)

      const script5 = document.createElement("script")
      script5.src = "https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js"
      script5.async = true
      document.body.appendChild(script5)

      const mainScript = document.createElement("script")
      mainScript.src = "https://source.zoom.us/zoom-meeting-2.18.0.min.js"
      mainScript.async = true
      mainScript.onload = () => initializeZoom(key)
      mainScript.onerror = () => {
        setError("Failed to load Zoom SDK")
        setIsLoading(false)
      }
      document.body.appendChild(mainScript)
    } catch (err) {
      console.error("[v0] Error loading Zoom SDK:", err)
      setError("Failed to initialize Zoom")
      setIsLoading(false)
    }
  }

  const initializeZoom = async (key: string) => {
    try {
      console.log("[v0] Initializing Zoom meeting...")

      const cleanMeetingNumber = meetingNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "")
      console.log("[v0] Clean meeting number:", cleanMeetingNumber)

      const response = await fetch("/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNumber: cleanMeetingNumber, role: 0 }),
      })

      console.log("[v0] Zoom signature response status:", response.status)

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = "Failed to get Zoom signature"

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("[v0] Zoom signature error (JSON):", errorData)
        } else {
          const errorText = await response.text()
          console.error("[v0] Zoom signature error (Text):", errorText)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      const signature = data.signature

      if (!signature) {
        throw new Error("No signature received from API")
      }

      console.log("[v0] Zoom signature received successfully")

      if (!key) {
        throw new Error("SDK Key not available")
      }

      console.log("[v0] SDK Key available:", !!key)

      window.ZoomMtg.setZoomJSLib("https://source.zoom.us/2.18.0/lib", "/av")
      window.ZoomMtg.preLoadWasm()
      window.ZoomMtg.prepareWebSDK()

      window.ZoomMtg.init({
        leaveUrl: window.location.origin + "/user/access-course",
        success: (success: any) => {
          console.log("[v0] Zoom init success:", success)

          window.ZoomMtg.join({
            sdkKey: key,
            signature: signature,
            meetingNumber: cleanMeetingNumber,
            userName: userName,
            userEmail: userEmail || "",
            passWord: passcode,
            success: (success: any) => {
              console.log("[v0] Zoom join success:", success)
              setIsLoading(false)
            },
            error: (error: any) => {
              console.error("[v0] Zoom join error:", error)
              setError("Failed to join meeting")
              setIsLoading(false)
            },
          })
        },
        error: (error: any) => {
          console.error("[v0] Zoom init error:", error)
          setError("Failed to initialize meeting")
          setIsLoading(false)
        },
      })
    } catch (err: any) {
      console.error("[v0] Error initializing Zoom:", err)
      setError(err.message || "Failed to join meeting")
      setIsLoading(false)
    }
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
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p>Connecting to meeting...</p>
          </div>
        </div>
      )}

      <div ref={zoomContainerRef} id="zmmtg-root" className="w-full h-full"></div>

      {!isLoading && (
        <Button onClick={onEnd} className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700" size="sm">
          <X className="w-4 h-4 mr-2" />
          Leave Meeting
        </Button>
      )}
    </div>
  )
}
