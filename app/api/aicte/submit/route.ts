export const dynamic = "force-dynamic"

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
    const instagramLink = (formData.get("instagram_link") as string) || null
    const instagramId = (formData.get("instagram_id") as string) || null

    if (!image || !studentId || !eventId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check for existing submission
    const { data: existing } = await supabase
      .from("aicte_submissions")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("event_id", eventId)
      .single()

    if (existing) {
      // Only allow re-submission if the previous one was rejected
      if (existing.status !== "rejected") {
        return NextResponse.json({ success: false, error: "You have already submitted a photo for this event" }, { status: 400 })
      }
      // For rejected submissions: fall through and update the existing record below
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

    let submission

    if (existing && existing.status === "rejected") {
      // Re-submission: update the existing rejected record and reset to pending
      const { data: updated, error: updateError } = await supabase
        .from("aicte_submissions")
        .update({
          photo_url: photoUrl,
          status: "pending",
          ai_score: aiScore,
          admin_note: null,
          reviewed_at: null,
          submitted_at: new Date().toISOString(),
          instagram_link: instagramLink,
          instagram_id: instagramId,
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Resubmission update error:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update submission record" }, { status: 500 })
      }
      submission = updated
    } else {
      // New submission: insert a fresh record
      const { data: inserted, error: insertError } = await supabase
        .from("aicte_submissions")
        .insert({
          student_id: parseInt(studentId),
          event_id: eventId,
          photo_url: photoUrl,
          status: "pending",
          ai_score: aiScore,
          instagram_link: instagramLink,
          instagram_id: instagramId,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Submission insert error:", insertError)
        return NextResponse.json({ success: false, error: "Failed to save submission record" }, { status: 500 })
      }
      submission = inserted
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
