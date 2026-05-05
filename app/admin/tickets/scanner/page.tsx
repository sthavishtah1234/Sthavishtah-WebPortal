"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Loader2,
  Check,
  X,
} from "lucide-react"
import AdminLayout from "@/components/admin-layout"

interface BookingResult {
  id: string
  booking_name: string
  booking_email: string
  booking_phone: string
  is_paid: boolean
  is_attended: boolean
  attended_at: string | null
  event_tickets: {
    event_name: string
    event_date: string
    event_time: string
    venue: string
  }
}

function ScanResultOverlay({
  success,
  onDone,
}: {
  success: boolean
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone()
    }, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="scan-result-overlay flex flex-col items-center gap-4">
        {success ? (
          <div className="rounded-full bg-green-500 p-6 shadow-[0_0_60px_rgba(34,197,94,0.5)]">
            <Check className="h-24 w-24 text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className="rounded-full bg-red-500 p-6 shadow-[0_0_60px_rgba(239,68,68,0.5)]">
            <X className="h-24 w-24 text-white" strokeWidth={3} />
          </div>
        )}
        <p className="text-2xl font-bold text-white">
          {success ? "Check-in Successful" : "Verification Failed"}
        </p>
      </div>
    </div>
  )
}

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [result, setResult] = useState<{
    success: boolean
    message: string
    booking?: BookingResult
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlaySuccess, setOverlaySuccess] = useState(false)
  const scannerContainerRef = useRef<string>(
    "qr-reader-" + Math.random().toString(36).slice(2)
  )
  const html5QrScannerRef = useRef<any>(null)

  const getPassword = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminPassword") || ""
    }
    return ""
  }

  const verifyQRCode = useCallback(async (qrData: string) => {
    const password = getPassword()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/tickets/verify-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ qr_code_data: qrData }),
      })

      const data = await res.json()

      if (data.success) {
        setOverlaySuccess(true)
        setShowOverlay(true)
        setResult({
          success: true,
          message: "Check-in successful!",
          booking: data.booking,
        })
      } else {
        setOverlaySuccess(false)
        setShowOverlay(true)
        setResult({
          success: false,
          message: data.error || "Verification failed",
          booking: data.booking,
        })
      }
    } catch {
      setOverlaySuccess(false)
      setShowOverlay(true)
      setResult({
        success: false,
        message: "Failed to verify QR code",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrScannerRef.current) {
        const scannerState = html5QrScannerRef.current.getState()
        if (scannerState === 2 || scannerState === 3) {
          await html5QrScannerRef.current.stop()
        }
        html5QrScannerRef.current.clear()
        html5QrScannerRef.current = null
      }
    } catch (e) {
      // ignore stop errors
    }
    setScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    setCameraError(null)
    setInitializing(true)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")

      if (html5QrScannerRef.current) {
        try {
          const state = html5QrScannerRef.current.getState()
          if (state === 2 || state === 3) {
            await html5QrScannerRef.current.stop()
          }
          html5QrScannerRef.current.clear()
        } catch {
          // ignore
        }
      }

      const scanner = new Html5Qrcode(scannerContainerRef.current)
      html5QrScannerRef.current = scanner

      setScanning(true)

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          verifyQRCode(decodedText)
          scanner
            .stop()
            .then(() => {
              scanner.clear()
              html5QrScannerRef.current = null
              setScanning(false)
            })
            .catch(() => {
              setScanning(false)
            })
        },
        () => {
          // QR code not found in frame - keep scanning
        }
      )

      setInitializing(false)
    } catch (error: any) {
      setInitializing(false)
      setScanning(false)

      if (
        error?.message?.includes("Permission") ||
        error?.name === "NotAllowedError"
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings and try again."
        )
      } else if (
        error?.name === "NotFoundError" ||
        error?.message?.includes("no camera")
      ) {
        setCameraError("No camera found on this device.")
      } else if (error?.name === "NotReadableError") {
        setCameraError(
          "Camera is in use by another application. Please close other apps using the camera."
        )
      } else {
        setCameraError(
          `Could not start camera: ${error?.message || "Unknown error"}. You can use manual entry below.`
        )
      }
    }
  }, [verifyQRCode])

  useEffect(() => {
    return () => {
      if (html5QrScannerRef.current) {
        try {
          const state = html5QrScannerRef.current.getState()
          if (state === 2 || state === 3) {
            html5QrScannerRef.current.stop().then(() => {
              html5QrScannerRef.current?.clear()
            })
          } else {
            html5QrScannerRef.current.clear()
          }
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [])

  const handleManualVerify = () => {
    if (manualCode.trim()) {
      verifyQRCode(manualCode.trim())
    }
  }

  const handleScanAgain = async () => {
    setResult(null)
    setManualCode("")
    setTimeout(() => {
      startScanner()
    }, 300)
  }

  return (
    <AdminLayout>
      {/* Full-screen tick / cross overlay */}
      {showOverlay && (
        <ScanResultOverlay
          success={overlaySuccess}
          onDone={() => setShowOverlay(false)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
        </div>

        {/* Scanner Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {cameraError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-red-800">{cameraError}</p>
                    <Button
                      onClick={startScanner}
                      size="sm"
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Camera container - mirror effect is applied via CSS in globals.css */}
            <div
              id={scannerContainerRef.current}
              className={
                scanning
                  ? "w-full max-w-sm mx-auto rounded-lg overflow-hidden"
                  : "hidden"
              }
            />

            {scanning && (
              <div className="mt-4">
                <Button
                  onClick={stopScanner}
                  variant="destructive"
                  className="w-full"
                >
                  Stop Scanner
                </Button>
              </div>
            )}

            {!scanning && !cameraError && (
              <div className="text-center space-y-4">
                {initializing ? (
                  <>
                    <Loader2 className="w-16 h-16 mx-auto text-emerald-600 animate-spin" />
                    <p className="text-gray-600">Starting camera...</p>
                  </>
                ) : (
                  <>
                    <QrCode className="w-16 h-16 mx-auto text-emerald-600" />
                    <p className="text-gray-600">
                      Tap the button below to open the camera and scan a QR
                      code.
                    </p>
                    <Button
                      onClick={startScanner}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Open Scanner
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>QR Code Data</Label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code data (e.g., TKT-abc12345-xyz)"
                onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
              />
            </div>
            <Button
              onClick={handleManualVerify}
              disabled={loading || !manualCode.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Manually"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card (detailed info, shown after overlay auto-dismisses) */}
        {result && (
          <Card
            className={
              result.success
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : result.message === "Already checked in" ? (
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      result.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </h3>
                </div>
              </div>

              {result.booking && (
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {result.booking.booking_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {result.booking.booking_email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {result.booking.booking_phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {result.booking.event_tickets?.event_name} -{" "}
                      {new Date(
                        result.booking.event_tickets?.event_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {result.booking.event_tickets?.venue}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {result.booking.is_paid ? (
                      <Badge className="bg-green-100 text-green-800">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Unpaid</Badge>
                    )}
                    {result.booking.is_attended && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Checked In
                        {result.booking.attended_at &&
                          ` at ${new Date(result.booking.attended_at).toLocaleTimeString()}`}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleScanAgain}
                variant="outline"
                className="w-full mt-4"
              >
                Scan Next
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
