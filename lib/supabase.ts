import { createClient as supabaseCreateClient, type SupabaseClient } from "@supabase/supabase-js"

// Singleton instances to prevent multiple clients
let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

// For main app (authentication, courses, payments, etc.)
export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Main Supabase URL and anon key must be defined for authentication")
  }

  browserClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return browserClient
}

// For server-side usage (main database)
export const getSupabaseServerClient = () => {
  if (serverClient) return serverClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    if (!supabaseAnonKey) missingVars.push("SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`)
  }

  serverClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey)

  return serverClient
}

// Default client (main database) - uses browser singleton
export const createClient = () => {
  return getSupabaseBrowserClient()
}
