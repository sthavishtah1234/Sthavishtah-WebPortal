import { createHash, randomBytes } from "crypto"
import { getSupabaseServerClient } from "@/lib/supabase"

// Token expiration time (reduced to 2 hours in seconds for security)
const TOKEN_EXPIRY = 2 * 60 * 60

// Generate a secure token for a user
export async function generateUserToken(userId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient()

    // Generate a random token
    const randomToken = randomBytes(32).toString("hex")

    // Create a hash of the token to store in the database
    const tokenHash = createHash("sha256").update(randomToken).digest("hex")

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + TOKEN_EXPIRY)

    // Invalidate any existing tokens for this user
    await supabase.from("user_tokens").update({ is_valid: false }).eq("user_id", userId).eq("is_valid", true)

    // Store the token in the database
    const { error } = await supabase.from("user_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      is_valid: true,
      usage_count: 0,
      max_uses: 1, // Single-use token
      device_fingerprint: null, // Will be set on first use
    })

    if (error) {
      console.error("Error storing token:", error)
      return null
    }

    // Return the unhashed token to be used in the URL
    return randomToken
  } catch (error) {
    console.error("Error generating token:", error)
    return null
  }
}

// Validate a token and get the associated user
export async function validateToken(token: string, deviceFingerprint: string): Promise<{ userId: string } | null> {
  try {
    const supabase = getSupabaseServerClient()

    // Hash the provided token to compare with stored hash
    const tokenHash = createHash("sha256").update(token).digest("hex")

    // Find the token in the database
    const { data, error } = await supabase
      .from("user_tokens")
      .select("id, user_id, expires_at, is_valid, usage_count, max_uses, device_fingerprint")
      .eq("token_hash", tokenHash)
      .eq("is_valid", true)
      .single()

    if (error || !data) {
      console.error("Token not found or invalid")
      return null
    }

    // Check if token has expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      // Invalidate expired token
      await supabase.from("user_tokens").update({ is_valid: false }).eq("id", data.id)
      console.error("Token has expired")
      return null
    }

    // Check if token has reached max uses
    if (data.usage_count >= data.max_uses) {
      await supabase.from("user_tokens").update({ is_valid: false }).eq("id", data.id)
      console.error("Token has reached maximum usage limit")
      return null
    }

    // Device binding check
    if (data.device_fingerprint && data.device_fingerprint !== deviceFingerprint) {
      console.error("Token is bound to a different device")
      return null
    }

    // Update token usage and bind to device if first use
    const updates: any = { usage_count: data.usage_count + 1 }

    // If this is first use, bind the token to this device
    if (!data.device_fingerprint) {
      updates.device_fingerprint = deviceFingerprint
    }

    // If this was the last allowed use, invalidate the token
    if (data.usage_count + 1 >= data.max_uses) {
      updates.is_valid = false
    }

    await supabase.from("user_tokens").update(updates).eq("id", data.id)

    return { userId: data.user_id }
  } catch (error) {
    console.error("Error validating token:", error)
    return null
  }
}

// Invalidate a token (for logout or security purposes)
export async function invalidateToken(token: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient()

    // Hash the token
    const tokenHash = createHash("sha256").update(token).digest("hex")

    // Invalidate the token
    const { error } = await supabase.from("user_tokens").update({ is_valid: false }).eq("token_hash", tokenHash)

    if (error) {
      console.error("Error invalidating token:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in invalidateToken:", error)
    return false
  }
}
