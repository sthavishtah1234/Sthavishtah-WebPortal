import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function GET() {
  try {
    const results = {
      environment: process.env.NODE_ENV || "unknown",
      config_status: {
        razorpay_key_id: checkEnvVar("RAZORPAY_KEY_ID"),
        key_secret: checkEnvVar("RAZORPAY_KEY_SECRET"),
        webhook_secret: checkEnvVar("RAZORPAY_WEBHOOK_SECRET"),
      },
      api_test: null as any,
      warnings: [] as string[],
    }

    if (results.config_status.razorpay_key_id.exists) {
      const keyType = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ? "TEST" : "LIVE"
      results.config_status.razorpay_key_id.type = keyType

      if (process.env.NODE_ENV === "production" && keyType === "TEST") {
        results.warnings.push("Using TEST keys in production environment")
      }
      if (process.env.NODE_ENV === "development" && keyType === "LIVE") {
        results.warnings.push("Using LIVE keys in development environment")
      }
    }

    // Test API connection if keys exist
    if (results.config_status.razorpay_key_id.exists && results.config_status.key_secret.exists) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || "",
          key_secret: process.env.RAZORPAY_KEY_SECRET || "",
        })

        // Make a simple API call to verify credentials
        const apiResponse = await razorpay.orders.all({ count: 1 })

        results.api_test = {
          success: true,
          message: "Successfully connected to Razorpay API",
          details: {
            count: apiResponse.count,
            items_received: apiResponse.items?.length || 0,
          },
        }
      } catch (apiError: any) {
        results.api_test = {
          success: false,
          message: "Failed to connect to Razorpay API",
          error: apiError.message || String(apiError),
          status: apiError.statusCode,
        }

        if (apiError.statusCode === 401) {
          results.warnings.push("API authentication failed. Your API keys may be invalid.")
        }
      }
    } else {
      results.api_test = {
        success: false,
        message: "Cannot test API connection - missing API keys",
      }
    }

    return NextResponse.json({
      success: true,
      results,
      recommendations: generateRecommendations(results),
    })
  } catch (error) {
    console.error("Error in Razorpay setup verification:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

// Check if an environment variable exists and mask it if it does
function checkEnvVar(name: string) {
  const value = process.env[name]
  return {
    exists: !!value,
    value: value ? maskValue(value) : null,
    type: null, // Will be filled for key_id
  }
}

// Mask sensitive values
function maskValue(value: string): string {
  if (!value) return ""
  if (value.length <= 10) return "●●●●●●●●●●"
  return value.substring(0, 6) + "●●●●●●●●●●" + value.substring(value.length - 4)
}

// Generate recommendations based on results
function generateRecommendations(results: any): string[] {
  const recommendations = []

  // Missing environment variables
  if (!results.config_status.razorpay_key_id.exists) {
    recommendations.push("Add RAZORPAY_KEY_ID to your environment variables")
  }
  if (!results.config_status.key_secret.exists) {
    recommendations.push("Add RAZORPAY_KEY_SECRET to your environment variables")
  }
  if (!results.config_status.webhook_secret.exists) {
    recommendations.push("Add RAZORPAY_WEBHOOK_SECRET for secure webhook handling")
  }

  // API connection issues
  if (results.api_test && !results.api_test.success) {
    if (results.api_test.status === 401) {
      recommendations.push("Your API keys appear to be invalid. Verify them in your Razorpay dashboard.")
    } else if (results.api_test.error && results.api_test.error.includes("network")) {
      recommendations.push("There seems to be a network issue. Check your internet connection.")
    }
  }

  // Environment warnings
  if (results.warnings.includes("Using TEST keys in production environment")) {
    recommendations.push("Replace TEST keys with LIVE keys for production environment")
  }

  return recommendations
}
