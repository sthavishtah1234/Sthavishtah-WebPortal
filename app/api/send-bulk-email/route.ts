import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const { userIds, subscriptionIds, subject, message, targetType } = await request.json()

    console.log("📧 Creating email job...")
    console.log("Target type:", targetType)
    console.log("User IDs:", userIds?.length || 0)
    console.log("Subscription IDs:", subscriptionIds?.length || 0)

    let finalUserIds: number[] = []

    if (targetType === "users" && userIds) {
      finalUserIds = userIds
    } else if (targetType === "subscriptions" && subscriptionIds) {
      // Fetch users from selected subscriptions
      const { data: subscriptionUsers, error: subError } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .in("subscription_id", subscriptionIds)
        .eq("is_active", true)

      if (subError) {
        console.error("Error fetching subscription users:", subError)
        return NextResponse.json({ success: false, error: "Failed to fetch subscription users" }, { status: 500 })
      }

      // Remove duplicates
      const userIdSet = new Set(subscriptionUsers.map((sub) => sub.user_id))
      finalUserIds = Array.from(userIdSet)
    }

    if (finalUserIds.length === 0) {
      return NextResponse.json({ success: false, error: "No users found to send emails to" }, { status: 400 })
    }

    console.log(`📊 Total users to email: ${finalUserIds.length}`)

    // Create email job in database
    const { data: emailJob, error: jobError } = await supabase
      .from("email_jobs")
      .insert({
        user_ids: finalUserIds,
        subject,
        message,
        status: "pending",
        total_recipients: finalUserIds.length,
        success_count: 0,
        failed_count: 0,
        progress: 0,
      })
      .select()
      .single()

    if (jobError) {
      console.error("Error creating email job:", jobError)
      return NextResponse.json({ success: false, error: "Failed to create email job" }, { status: 500 })
    }

    console.log(`✅ Email job created with ID: ${emailJob.id}`)

    // Start processing the job immediately (in background)
    // This will continue even if the API request times out
    processEmailJob(emailJob.id).catch((error) => {
      console.error("Background email processing error:", error)
    })

    return NextResponse.json({
      success: true,
      message: `Email job created successfully. Sending to ${finalUserIds.length} users.`,
      jobId: emailJob.id,
      totalRecipients: finalUserIds.length,
    })
  } catch (error) {
    console.error("Error in send-bulk-email:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Background function to process email jobs
async function processEmailJob(jobId: number) {
  const supabase = createClient()

  try {
    console.log(`🚀 Starting to process email job ${jobId}`)

    // Update job status to processing
    await supabase
      .from("email_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    // Get job details
    const { data: job, error: jobError } = await supabase.from("email_jobs").select("*").eq("id", jobId).single()

    if (jobError || !job) {
      throw new Error("Job not found")
    }

    // Get user details
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", job.user_ids)

    if (usersError) {
      throw new Error("Failed to fetch users")
    }

    console.log(`👥 Processing ${users.length} users for job ${jobId}`)

    let successCount = 0
    let failedCount = 0
    const batchSize = 5 // Process 5 emails at a time
    const emailDelay = 3000 // 3 seconds between emails
    const batchDelay = 10000 // 10 seconds between batches

    // Process users in batches
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(users.length / batchSize)

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`)

      // Process each email in the batch
      for (let j = 0; j < batch.length; j++) {
        const user = batch[j]
        const emailIndex = i + j + 1

        try {
          console.log(`📧 Sending email ${emailIndex}/${users.length} to ${user.email}`)

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Sthavishtah Yoga <support@sthavishtah.com>",
              to: [user.email],
              subject: job.subject,
              html: job.message,
            }),
          })

          if (emailResponse.ok) {
            successCount++
            console.log(`✅ Email sent successfully to ${user.email}`)
          } else {
            failedCount++
            const errorText = await emailResponse.text()
            console.error(`❌ Failed to send email to ${user.email}:`, errorText)
          }
        } catch (emailError) {
          failedCount++
          console.error(`❌ Error sending email to ${user.email}:`, emailError)
        }

        // Update progress
        const progress = Math.round((emailIndex / users.length) * 100)
        await supabase
          .from("email_jobs")
          .update({
            success_count: successCount,
            failed_count: failedCount,
            progress: progress,
          })
          .eq("id", jobId)

        // Add delay between emails (except for the last one in batch)
        if (j < batch.length - 1) {
          console.log(`⏳ Waiting ${emailDelay / 1000} seconds before next email...`)
          await new Promise((resolve) => setTimeout(resolve, emailDelay))
        }
      }

      // Add delay between batches (except for the last batch)
      if (i + batchSize < users.length) {
        console.log(`⏸️ Batch ${batchNumber} complete. Waiting ${batchDelay / 1000} seconds before next batch...`)
        await new Promise((resolve) => setTimeout(resolve, batchDelay))
      }
    }

    // Mark job as completed
    await supabase
      .from("email_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        success_count: successCount,
        failed_count: failedCount,
        progress: 100,
      })
      .eq("id", jobId)

    console.log(`🎉 Email job ${jobId} completed! Success: ${successCount}, Failed: ${failedCount}`)
  } catch (error) {
    console.error(`💥 Error processing email job ${jobId}:`, error)

    // Mark job as failed
    await supabase
      .from("email_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
  }
}
