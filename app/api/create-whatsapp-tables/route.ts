import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Create whatsapp_access_requests table
    const { error: tableError } = await supabase.rpc("create_whatsapp_tables")

    if (tableError) {
      console.error("Error creating tables:", tableError)
      return NextResponse.json({ success: false, error: tableError.message }, { status: 500 })
    }

    // Add whatsapp_group_link column to subscriptions table if it doesn't exist
    const { error: columnError } = await supabase.rpc("add_whatsapp_link_column")

    if (columnError) {
      console.error("Error adding column:", columnError)
      return NextResponse.json({ success: false, error: columnError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp tables and columns created successfully",
    })
  } catch (error) {
    console.error("Error in create-whatsapp-tables route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
