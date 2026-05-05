"use server"

export async function getZoomSdkKey() {
  const sdkKey = process.env.ZOOM_API_KEY

  if (!sdkKey) {
    throw new Error("ZOOM_API_KEY not configured")
  }

  return sdkKey
}
