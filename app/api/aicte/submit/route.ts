import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const studentId = formData.get("student_id") as string
    const eventId = formData.get("event_id") as string
    const aiScoreStr = formData.get("ai_score") as string

    if (!image || !studentId || !eventId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from("aicte_submissions")
      .select("id")
      .eq("student_id", studentId)
      .eq("event_id", eventId)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: "You have already submitted a photo for this event" }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileExt = "jpg"
    const fileName = `${studentId}/${eventId}-${uuidv4()}.${fileExt}`
    const buffer = Buffer.from(await image.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("aicte-photos")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to upload photo. Storage bucket may not exist." }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("aicte-photos")
      .getPublicUrl(fileName)

    const photoUrl = urlData.publicUrl

    // Parse AI score
    const aiScore = aiScoreStr && aiScoreStr !== "null" ? parseFloat(aiScoreStr) : null

    // Insert submission record
    const { data: submission, error: insertError } = await supabase
      .from("aicte_submissions")
      .insert({
        student_id: parseInt(studentId),
        event_id: eventId,
        photo_url: photoUrl,
        status: "pending",
        ai_score: aiScore,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Submission insert error:", insertError)
      return NextResponse.json({ success: false, error: "Failed to save submission record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Photo submitted successfully",
    })
  } catch (error) {
    console.error("Submit error:", error)
    return NextResponse.json({ success: false, error: "Server error during submission" }, { status: 500 })
  }
}
