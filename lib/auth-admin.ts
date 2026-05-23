import { getSupabaseServerClient } from "@/lib/supabase"

/**
 * Verifies if the provided password is a valid admin password.
 * Checks both environment variables (primary) and the database settings (fallback)
 * to be extremely robust against Vercel environment variable parsing issues.
 */
export async function verifyAdminPassword(password: string | null): Promise<boolean> {
  if (!password) return false

  // 1. Primary check: environment variables
  const envPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  if (envPassword && password === envPassword) {
    return true
  }

  // 2. Fallback check: database settings table (handles Vercel special-character parsing issues)
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "admin_password")
      .single()

    if (!error && data && data.setting_value) {
      if (password === data.setting_value) {
        return true
      }
    } else if (error) {
      console.error("Failed to query admin_settings:", error.message)
    }
  } catch (err) {
    console.error("Exception in verifyAdminPassword:", err)
  }

  return false
}
