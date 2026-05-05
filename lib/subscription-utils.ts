import type { PostgrestError } from "@supabase/supabase-js"

export function formatSubscriptionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message)
  }

  // Handle Supabase PostgrestError
  if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
    const pgError = error as PostgrestError

    // Handle specific database errors
    if (pgError.code === "23505") {
      return "A subscription with this name already exists."
    }

    if (pgError.code === "23503") {
      return "This subscription is referenced by other records and cannot be modified."
    }

    if (pgError.message) {
      return pgError.message
    }
  }

  return "An unknown error occurred"
}

export function calculateDurationDays(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A"

  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function isSubscriptionActive(startDate: string | null, endDate: string | null, isActive = false): boolean {
  if (!startDate) return false

  const now = new Date()
  const start = new Date(startDate)

  if (start > now) return false

  if (!endDate) return isActive

  const end = new Date(endDate)
  return isActive && now <= end
}

export function calculateEndDate(activationDate: Date, durationDays: number): Date {
  const endDate = new Date(activationDate)
  endDate.setDate(endDate.getDate() + durationDays)
  return endDate
}

export function getActivationStatus(subscription: any): "active" | "pending" | "expired" {
  if (!subscription) return "expired"

  const now = new Date()
  const endDate = new Date(subscription.end_date)

  if (subscription.is_active && endDate > now) {
    return "active"
  } else if (!subscription.is_active && endDate > now) {
    return "pending"
  } else {
    return "expired"
  }
}
