import { createClient } from "@supabase/supabase-js"

export function getAISupabaseClient() {
  const supabaseUrl = process.env.AI_SUPABASE_URL
  const supabaseKey = process.env.AI_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("AI Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseKey)
}
