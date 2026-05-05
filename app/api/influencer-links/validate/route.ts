import { getSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// GET - Validate influencer code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ success: false, valid: false })
    }

    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("influencer_links")
      .select("code, influencer_name, is_active")
      .eq("code", code.toLowerCase())
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: true, valid: false })
    }

    return NextResponse.json({ success: true, valid: true, influencer: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, valid: false })
  }
}
