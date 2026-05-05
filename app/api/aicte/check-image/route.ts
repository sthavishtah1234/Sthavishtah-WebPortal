import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ blocked: false, ai_score: null, message: "No image provided" })
    }

    const apiUser = process.env.SIGHTENGINE_API_USER
    const apiSecret = process.env.SIGHTENGINE_API_SECRET

    if (!apiUser || !apiSecret) {
      console.warn("Sightengine credentials not configured — skipping AI check")
      return NextResponse.json({ blocked: false, ai_score: null, message: "AI check skipped (not configured)" })
    }

    try {
      const sightengineForm = new FormData()
      sightengineForm.append("media", image)
      sightengineForm.append("models", "genai")
      sightengineForm.append("api_user", apiUser)
      sightengineForm.append("api_secret", apiSecret)

      const response = await fetch("https://api.sightengine.com/1.0/check.json", {
        method: "POST",
        body: sightengineForm,
      })

      if (!response.ok) {
        console.error("Sightengine API error:", response.status)
        // Don't block — let admin review
        return NextResponse.json({ blocked: false, ai_score: null, message: "AI check failed — pending manual review" })
      }

      const result = await response.json()
      const aiScore = result.type?.ai_generated ?? null

      console.log("Sightengine result:", JSON.stringify(result.type))

      if (aiScore !== null && aiScore > 0.7) {
        return NextResponse.json({
          blocked: true,
          ai_score: aiScore,
          message: "This image appears to be AI-generated. Please upload a real photo from the event.",
        })
      }

      return NextResponse.json({
        blocked: false,
        ai_score: aiScore,
        message: "Image check passed",
      })
    } catch (apiError) {
      console.error("Sightengine API call failed:", apiError)
      // Fallback: don't block, let admin review
      return NextResponse.json({ blocked: false, ai_score: null, message: "AI check unavailable — pending manual review" })
    }
  } catch (error) {
    console.error("Image check error:", error)
    return NextResponse.json({ blocked: false, ai_score: null, message: "Error during check" })
  }
}
