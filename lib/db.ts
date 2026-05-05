import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const db = createClient(supabaseUrl, supabaseKey)

// Helper function for database operations
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const { data, error } = await db.rpc("execute_sql", {
      query_text: query,
      params: params,
    })

    if (error) {
      console.error("Database query error:", error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Database execution error:", error)
    return { data: null, error }
  }
}

// Common database operations
export const dbOperations = {
  // Get all users
  async getUsers() {
    return await db.from("users").select("*")
  },

  // Get all subscriptions
  async getSubscriptions() {
    return await db.from("subscriptions").select("*")
  },

  // Get all courses
  async getCourses() {
    return await db.from("courses").select("*")
  },

  // Get user subscriptions
  async getUserSubscriptions(userId: string) {
    return await db
      .from("user_subscriptions")
      .select(`
        *,
        subscriptions(*),
        users(*)
      `)
      .eq("user_id", userId)
  },

  // Get subscription users
  async getSubscriptionUsers(subscriptionId: string) {
    return await db
      .from("user_subscriptions")
      .select(`
        *,
        users(*),
        subscriptions(*)
      `)
      .eq("subscription_id", subscriptionId)
  },
}

export default db
