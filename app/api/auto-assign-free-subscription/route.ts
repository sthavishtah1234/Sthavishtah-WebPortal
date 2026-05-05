import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, numericUserId, isRegistration } = await request.json()

    // For registration flow, we trust the request (it comes from our own registration page)
    // For admin actions, require admin password
    if (!isRegistration) {
      const adminPassword = request.headers.get("x-admin-password")
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
    }

    if (!userId && !numericUserId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    let finalNumericUserId = numericUserId

    // If we have string userId but not numeric, look it up
    if (!finalNumericUserId && userId) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (userError) {
        console.error("Error fetching user by user_id:", userError)
        return NextResponse.json({ success: false, error: userError.message }, { status: 500 })
      }

      if (!userData) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      finalNumericUserId = userData.id
    }

    // Get the free subscription that is marked as default for new users
    const { data: freeSubscriptions, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("is_default_for_new_users", true)

    if (subscriptionError) {
      console.error("Error fetching free subscription:", subscriptionError)
      return NextResponse.json({ success: false, error: subscriptionError.message }, { status: 500 })
    }

    if (!freeSubscriptions || freeSubscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No subscription marked as default for new users. Please create one in admin panel.",
        },
        { status: 404 },
      )
    }

    // Process each default subscription
    const results = await Promise.all(
      freeSubscriptions.map(async (subscription) => {
        // For one-time subscriptions, check if user has already had this subscription
        if (subscription.is_one_time_only) {
          const { data: existingSubscription, error: checkError } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", finalNumericUserId)
            .eq("subscription_id", subscription.id)
            .maybeSingle()

          if (checkError) {
            console.error(`Error checking existing subscription ${subscription.id}:`, checkError)
            return {
              success: false,
              subscription_id: subscription.id,
              error: checkError.message,
            }
          }

          // If user already had this subscription, skip it
          if (existingSubscription) {
            return {
              success: true,
              subscription_id: subscription.id,
              message: "User already had this one-time subscription",
              skipped: true,
            }
          }
        } else {
          // For regular subscriptions, check if user already has an active subscription
          const { data: activeSubscription, error: activeError } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", finalNumericUserId)
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)
            .maybeSingle()

          if (activeError) {
            console.error(`Error checking active subscription ${subscription.id}:`, activeError)
            return {
              success: false,
              subscription_id: subscription.id,
              error: activeError.message,
            }
          }

          // If user already has this subscription active, skip it
          if (activeSubscription) {
            return {
              success: true,
              subscription_id: subscription.id,
              message: "User already has this subscription active",
              skipped: true,
            }
          }
        }

        // Calculate start and end dates based on subscription duration_days
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(startDate.getDate() + (subscription.duration_days || 30))

        // Add user to subscription using the numeric ID
        const { error } = await supabase.from("user_subscriptions").insert({
          user_id: finalNumericUserId,
          subscription_id: subscription.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          activation_date: startDate.toISOString(),
          status: "active",
          is_active: true,
          is_one_time_subscription: subscription.is_one_time_only || false,
          total_active_days_used: 0,
          last_day_counted: null,
        })

        if (error) {
          console.error(`Error adding user to subscription ${subscription.id}:`, error)
          return {
            success: false,
            subscription_id: subscription.id,
            error: error.message,
          }
        }

        return {
          success: true,
          subscription_id: subscription.id,
          subscription_name: subscription.name,
          message: `User added to "${subscription.name}" subscription successfully`,
        }
      }),
    )

    // Check if any subscriptions were successfully assigned
    const anySuccess = results.some((result) => result.success && !result.skipped)
    const allSkipped = results.every((result) => result.success && result.skipped)

    if (allSkipped) {
      return NextResponse.json({
        success: true,
        message: "User already has the default subscription(s)",
        results,
      })
    }

    if (anySuccess) {
      return NextResponse.json({
        success: true,
        message: "User added to default subscription(s) successfully",
        results,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to add user to default subscription(s)",
          results,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in auto-assign-free-subscription API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
