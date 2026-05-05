import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables
    const diagnostics = {
      environment: process.env.NODE_ENV || "unknown",
      razorpay_key_id: {
        exists: !!process.env.RAZORPAY_KEY_ID,
        value: process.env.RAZORPAY_KEY_ID ? maskKey(process.env.RAZORPAY_KEY_ID) : null,
        type: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ? "TEST" : "LIVE",
      },
      key_secret: {
        exists: !!process.env.RAZORPAY_KEY_SECRET,
        value: process.env.RAZORPAY_KEY_SECRET ? "●●●●●●●●●●●●●●●●" : null,
      },
      webhook_secret: {
        exists: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      },
    }

    // Check if we're using test keys in production or vice versa
    const warnings = []
    if (process.env.NODE_ENV === "production" && diagnostics.razorpay_key_id.type === "TEST") {
      warnings.push("Using TEST keys in production environment")
    }
    if (process.env.NODE_ENV === "development" && diagnostics.razorpay_key_id.type === "LIVE") {
      warnings.push("Using LIVE keys in development environment")
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      warnings,
      recommendations: generateRecommendations(diagnostics, warnings),
    })
  } catch (error) {
    console.error("Error in Razorpay diagnostics:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Diagnostics failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

// Mask the key for security
function maskKey(key: string): string {
  if (!key) return ""
  if (key.length <= 10) return "●●●●●●●●●●"
  return key.substring(0, 6) + "●●●●●●●●●●" + key.substring(key.length - 4)
}

// Generate recommendations based on diagnostics
function generateRecommendations(diagnostics: any, warnings: string[]): string[] {
  const recommendations = []

  if (!diagnostics.razorpay_key_id.exists) {
    recommendations.push("Add RAZORPAY_KEY_ID to your environment variables")
  }
  if (!diagnostics.key_secret.exists) {
    recommendations.push("Add RAZORPAY_KEY_SECRET to your environment variables")
  }
  if (!diagnostics.webhook_secret.exists) {
    recommendations.push("Add RAZORPAY_WEBHOOK_SECRET for secure webhook handling")
  }

  // Add recommendations based on warnings
  if (warnings.includes("Using TEST keys in production environment")) {
    recommendations.push("Replace TEST keys with LIVE keys for production environment")
  }

  return recommendations
}
