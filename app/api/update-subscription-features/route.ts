import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Get all subscriptions
    const { data: subscriptions, error: fetchError } = await supabase.from("subscriptions").select("*")

    if (fetchError) {
      throw fetchError
    }

    let updatedCount = 0
    let errorCount = 0

    // Update each subscription
    for (const subscription of subscriptions || []) {
      // Only update if features exist but aren't properly stored
      if (subscription.features && Array.isArray(subscription.features)) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            features: subscription.features, // Re-save the features to ensure they're stored properly
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} subscriptions. Errors: ${errorCount}`,
      updatedCount,
      errorCount,
    })
  } catch (error) {
    console.error("Error updating subscription features:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
