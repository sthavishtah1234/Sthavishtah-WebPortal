import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const supabase = createClient()
    const jobId = Number.parseInt(params.jobId)

    if (isNaN(jobId)) {
      return NextResponse.json({ success: false, error: "Invalid job ID" }, { status: 400 })
    }

    const { data: job, error } = await supabase.from("email_jobs").select("*").eq("id", jobId).single()

    if (error || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        totalRecipients: job.total_recipients,
        successCount: job.success_count,
        failedCount: job.failed_count,
        progress: job.progress,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      },
    })
  } catch (error) {
    console.error("Error fetching email job status:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
