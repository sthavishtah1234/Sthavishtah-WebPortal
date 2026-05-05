"use client"

// Generate a device fingerprint based on available browser information
export function generateDeviceFingerprint(): string {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      !!navigator.cookieEnabled,
      typeof navigator.hardwareConcurrency !== "undefined" ? navigator.hardwareConcurrency : "unknown",
      typeof navigator.deviceMemory !== "undefined" ? navigator.deviceMemory : "unknown",
      typeof window.localStorage !== "undefined",
      typeof window.sessionStorage !== "undefined",
    ]

    // Add canvas fingerprinting if available
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.width = 200
        canvas.height = 50
        ctx.textBaseline = "top"
        ctx.font = "14px Arial"
        ctx.fillStyle = "#f60"
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = "#069"
        ctx.fillText("Fingerprint", 2, 15)
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
        ctx.fillText("Canvas", 4, 17)
        components.push(canvas.toDataURL())
      }
    } catch (e) {
      components.push("canvas-error")
    }

    // Create a hash of the components
    const fingerprint = components.join("###")

    // Use a simple hash function for the fingerprint
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return hash.toString(16)
  } catch (error) {
    console.error("Error generating device fingerprint:", error)
    return "unknown-device"
  }
}
