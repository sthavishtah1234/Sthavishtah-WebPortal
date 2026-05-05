"use client"

import { useState } from "react"
import { Camera, CameraOff, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CameraPermissionProps {
  onPermissionGranted: () => void
  onSkip: () => void
}

export default function CameraPermission({ onPermissionGranted, onSkip }: CameraPermissionProps) {
  const [checking, setChecking] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown")

  const checkCameraPermission = async () => {
    setChecking(true)
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      })

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop())

      setPermissionStatus("granted")
      setTimeout(() => {
        onPermissionGranted()
      }, 1000)
    } catch (error) {
      console.error("Camera permission denied:", error)
      setPermissionStatus("denied")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md text-center">
        <div className="mb-6">
          <Camera className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-2">Camera Access</h2>
          <p className="text-gray-300">Would you like to enable your camera for a better live session experience?</p>
          <p className="text-gray-400 text-sm mt-2">
            Your camera feed will only be visible to you - not recorded or shared.
          </p>
        </div>

        {permissionStatus === "unknown" && (
          <div className="space-y-4">
            <Button
              onClick={checkCameraPermission}
              disabled={checking}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {checking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Requesting Permission...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Enable Camera
                </>
              )}
            </Button>
            <Button onClick={onSkip} variant="outline" className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Skip & Continue
            </Button>
          </div>
        )}

        {permissionStatus === "granted" && (
          <div className="text-green-400">
            <Camera className="h-8 w-8 mx-auto mb-2" />
            <p>Camera access granted! Starting session...</p>
          </div>
        )}

        {permissionStatus === "denied" && (
          <div className="space-y-4">
            <div className="text-red-400">
              <CameraOff className="h-8 w-8 mx-auto mb-2" />
              <p>Camera access denied. You can still join the session.</p>
            </div>
            <Button onClick={onSkip} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Continue Without Camera
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
