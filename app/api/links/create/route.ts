import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const body = await request.json()

    console.log("📝 Creating link with data:", body)

    const { title, description = "", linkType, targetUrl, targetType, targetIds = null, expiresAt = null } = body

    // Validate required fields
    if (!title || !linkType || !targetUrl || !targetType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, linkType, targetUrl, targetType",
        },
        { status: 400 },
      )
    }

    // Generate unique token
    const token = Math.random().toString(36).substring(2, 15)

    // Convert targetIds array to comma-separated string
    let targetIdsString = null
    if (targetIds && Array.isArray(targetIds) && targetIds.length > 0) {
      targetIdsString = targetIds.join(",")
    } else if (targetIds && typeof targetIds === "string") {
      targetIdsString = targetIds
    }

    console.log("📝 Processed data:", {
      title,
      linkType,
      targetUrl,
      targetType,
      targetIdsString,
      token,
    })

    // Insert into database
    const { data, error } = await supabase
      .from("generated_links")
      .insert({
        title,
        description,
        link_type: linkType,
        token,
        target_url: targetUrl,
        target_type: targetType,
        target_ids: targetIdsString,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    console.log("✅ Link created successfully:", data)

    return NextResponse.json({
      success: true,
      link: data,
      full_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/l/${token}`,
    })
  } catch (error) {
    console.error("❌ Error creating link:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
