// Client-side utility to fetch the Razorpay key from the server
export async function getRazorpayKey(): Promise<string> {
  try {
    const response = await fetch("/api/razorpay/get-key")
    if (!response.ok) {
      throw new Error(`Failed to fetch Razorpay key: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.key) {
      throw new Error("Razorpay key not found in response")
    }

    return data.key
  } catch (error) {
    console.error("Error fetching Razorpay key:", error)
    throw error
  }
}
