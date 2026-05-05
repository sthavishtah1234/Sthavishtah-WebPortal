import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiting (use Redis in production)
const registrationAttempts = new Map<string, { count: number; timestamp: number }>()

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"}&response=${token}`,
    })
    const data = await response.json()
    return { success: data.success, score: data.score || 0 }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error)
    return { success: false, score: 0 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, recaptchaToken } = await request.json()

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const now = Date.now()
    const attempts = registrationAttempts.get(ip)

    if (attempts) {
      // Reset if more than 1 hour has passed
      if (now - attempts.timestamp > 3600000) {
        registrationAttempts.set(ip, { count: 1, timestamp: now })
      } else if (attempts.count >= 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many registration attempts. Please try again later.",
          },
          { status: 429 },
        )
      } else {
        registrationAttempts.set(ip, { count: attempts.count + 1, timestamp: attempts.timestamp })
      }
    } else {
      registrationAttempts.set(ip, { count: 1, timestamp: now })
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken)

    if (!recaptchaResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Bot detection failed. Please try again.",
        },
        { status: 400 },
      )
    }

    if (recaptchaResult.score < 0.5) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration blocked due to suspicious activity.",
        },
        { status: 400 },
      )
    }

    const suspiciousPatterns = ["test", "fake", "dummy", "admin"]
    const lowercaseName = name.toLowerCase()
    for (const pattern of suspiciousPatterns) {
      if (lowercaseName.includes(pattern)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid name. Please use your real name.",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification passed",
    })
  } catch (error) {
    console.error("Registration verification error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Verification failed",
      },
      { status: 500 },
    )
  }
}
