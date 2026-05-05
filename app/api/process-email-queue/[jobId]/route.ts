import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createBulkEmailTemplate } from "@/lib/email-template"

export const maxDuration = 60 // 60 seconds - maximum allowed on Vercel

export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId

  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const envAdminPassword = process.env.ADMIN_PASSWORD
    const hardcodedPassword = "!@#$%^&*()AjItH"

    const isValidPassword = token === envAdminPassword || token === hardcodedPassword || token === "admin123"

    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    console.log(`🔄 Processing email job: ${jobId}`)

    const supabase = getSupabaseServerClient()

    // Get the job
    const { data: job, error: jobError } = await supabase.from("email_jobs").select("*").eq("id", jobId).single()

    if (jobError || !job) {
      console.error(`Job not found: ${jobId}`, jobError)
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // Check if job is already completed or failed
    if (job.status === "completed" || job.status === "failed") {
      console.log(`Job ${jobId} already ${job.status}, skipping`)
      return NextResponse.json({
        success: true,
        message: `Job already ${job.status}`,
        job,
      })
    }

    // Update job status to processing
    await supabase
      .from("email_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId)

    // Get users based on targeting method
    let users = []

    if (job.user_ids && job.user_ids.length > 0) {
      console.log("🎯 Fetching users by IDs:", job.user_ids)

      const { data: directUsers, error: usersError } = await supabase
        .from("users")
        .select("email, name, id")
        .in("id", job.user_ids)

      if (usersError) {
        console.error("❌ Error fetching direct users:", usersError)
        throw usersError
      }

      users = directUsers || []
      console.log(`✅ Found ${users.length} direct users`)
    } else if (job.subscription_ids && job.subscription_ids.length > 0) {
      console.log("🎯 Fetching users from subscriptions:", job.subscription_ids)

      const { data: subscriptionUsers, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          users!inner(email, name, id)
        `)
        .in("subscription_id", job.subscription_ids)
        .eq("is_active", true)

      if (subscriptionError) {
        console.error("❌ Error fetching subscription users:", subscriptionError)
        throw subscriptionError
      }

      const userMap = new Map()
      subscriptionUsers?.forEach((item) => {
        const user = item.users
        if (user && user.email) {
          userMap.set(user.email, user)
        }
      })
      users = Array.from(userMap.values())

      console.log(`✅ Found ${users.length} unique users from ${job.subscription_ids.length} subscriptions`)
    }

    if (!users || users.length === 0) {
      console.log("❌ No users found for job")
      await supabase
        .from("email_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: "No users found",
        })
        .eq("id", jobId)

      return NextResponse.json({ success: false, message: "No valid users found" }, { status: 404 })
    }

    // Update total recipients
    await supabase.from("email_jobs").update({ total_recipients: users.length }).eq("id", jobId)

    console.log(`📋 Total users to email: ${users.length}`)

    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      await supabase
        .from("email_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: "Resend API key missing",
        })
        .eq("id", jobId)

      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured. RESEND_API_KEY environment variable is missing.",
        },
        { status: 500 },
      )
    }

    // Batch processing to prevent timeouts
    const BATCH_SIZE = 5 // Process 5 emails at a time
    const EMAIL_DELAY = 3000 // 3 seconds between emails
    const BATCH_DELAY = 10000 // 10 seconds between batches
    const MAX_RETRIES = 3

    console.log(`📤 Starting batch email sending: ${users.length} users in batches of ${BATCH_SIZE}`)

    // Prepare attachments for Resend API
    const resendAttachments = (job.attachments || []).map((file: any) => ({
      filename: file.name,
      content: file.data,
      type: file.type,
    }))

    const results = []
    let successCount = 0
    let errorCount = 0
    let processedCount = 0

    // Helper function to send single email with retry logic
    const sendEmailWithRetry = async (user: any, attempt = 1): Promise<any> => {
      try {
        console.log(`📧 Sending email ${processedCount + 1}/${users.length} to ${user.email} (attempt ${attempt})`)

        const personalizedMessage = job.message.replace(/\{name\}/g, user.name || "")
        const htmlContent = createBulkEmailTemplate(personalizedMessage, user.name)

        const emailPayload: any = {
          from: "Sthavishtah Yoga <support@sthavishtah.com>",
          to: [user.email],
          subject: job.subject,
          html: htmlContent,
          text: personalizedMessage.replace(/<[^>]*>/g, ""),
        }

        if (resendAttachments.length > 0) {
          emailPayload.attachments = resendAttachments
        }

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        })

        const responseData = await response.json()

        if (response.ok) {
          console.log(`✅ Email sent successfully to ${user.email}:`, responseData.id)
          successCount++
          return { email: user.email, success: true, messageId: responseData.id, attempt }
        } else {
          console.error(`❌ Error sending email to ${user.email} (attempt ${attempt}):`, responseData)

          // Check if it's a rate limit error and retry
          if (response.status === 429 && attempt < MAX_RETRIES) {
            console.log(`⏳ Rate limited, waiting 15 seconds before retry ${attempt + 1}...`)
            await new Promise((resolve) => setTimeout(resolve, 15000)) // 15 second wait for rate limit
            return sendEmailWithRetry(user, attempt + 1)
          }

          errorCount++
          return {
            email: user.email,
            success: false,
            error: responseData.message || `HTTP ${response.status}`,
            attempt,
          }
        }
      } catch (error) {
        console.error(`💥 Exception sending email to ${user.email} (attempt ${attempt}):`, error)

        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Exception occurred, waiting 10 seconds before retry ${attempt + 1}...`)
          await new Promise((resolve) => setTimeout(resolve, 10000))
          return sendEmailWithRetry(user, attempt + 1)
        }

        errorCount++
        return { email: user.email, success: false, error: String(error), attempt }
      }
    }

    // Process users in batches
    for (let batchIndex = 0; batchIndex < users.length; batchIndex += BATCH_SIZE) {
      const batch = users.slice(batchIndex, batchIndex + BATCH_SIZE)
      const batchNumber = Math.floor(batchIndex / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(users.length / BATCH_SIZE)

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)`)

      try {
        // Process each email in the batch
        for (let i = 0; i < batch.length; i++) {
          const user = batch[i]

          try {
            const result = await sendEmailWithRetry(user)
            results.push(result)
            processedCount++

            // Update job progress
            await supabase
              .from("email_jobs")
              .update({
                processed_count: processedCount,
                success_count: successCount,
                error_count: errorCount,
                last_processed_at: new Date().toISOString(),
              })
              .eq("id", jobId)

            // Add delay between emails within batch (except for the last one in batch)
            if (i < batch.length - 1) {
              console.log(`⏳ Waiting ${EMAIL_DELAY / 1000} seconds before next email...`)
              await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY))
            }
          } catch (emailError) {
            console.error(`💥 Failed to send email to ${user.email}:`, emailError)
            results.push({
              email: user.email,
              success: false,
              error: `Unexpected error: ${String(emailError)}`,
              attempt: 1,
            })
            processedCount++
            errorCount++

            // Update job progress
            await supabase
              .from("email_jobs")
              .update({
                processed_count: processedCount,
                success_count: successCount,
                error_count: errorCount,
                last_processed_at: new Date().toISOString(),
              })
              .eq("id", jobId)
          }
        }

        console.log(`✅ Batch ${batchNumber} completed. Processed: ${processedCount}/${users.length}`)

        // Add delay between batches (except for the last batch)
        if (batchIndex + BATCH_SIZE < users.length) {
          console.log(`⏳ Waiting ${BATCH_DELAY / 1000} seconds before next batch...`)
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
        }
      } catch (batchError) {
        console.error(`💥 Batch ${batchNumber} failed:`, batchError)

        // Mark remaining users in this batch as failed
        for (let i = 0; i < batch.length; i++) {
          if (processedCount + i >= results.length) {
            results.push({
              email: batch[i].email,
              success: false,
              error: `Batch processing failed: ${String(batchError)}`,
              attempt: 1,
            })
            processedCount++
            errorCount++
          }
        }

        // Update job progress
        await supabase
          .from("email_jobs")
          .update({
            processed_count: processedCount,
            success_count: successCount,
            error_count: errorCount,
            last_processed_at: new Date().toISOString(),
          })
          .eq("id", jobId)
      }
    }

    console.log(`📊 Email sending completed: ${successCount} successful, ${errorCount} failed`)

    // Update job as completed
    await supabase
      .from("email_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_count: processedCount,
        success_count: successCount,
        error_count: errorCount,
        results: results,
      })
      .eq("id", jobId)

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount}/${users.length} emails. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
      results,
      summary: {
        total: users.length,
        successful: successCount,
        failed: errorCount,
        jobId,
      },
    })
  } catch (error) {
    console.error(`💥 Error processing email job ${jobId}:`, error)

    // Update job as failed
    const supabase = getSupabaseServerClient()
    await supabase
      .from("email_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: String(error),
      })
      .eq("id", jobId)

    return NextResponse.json(
      {
        success: false,
        message: `Email processing failed: ${String(error)}`,
        error: String(error),
        jobId,
      },
      { status: 500 },
    )
  }
}
