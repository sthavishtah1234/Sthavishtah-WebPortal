"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null)

  const testConnection = async () => {
    setStatus("testing")
    setErrorMessage(null)

    try {
      // Check if environment variables are set
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      setSupabaseUrl(url || "Not set")

      if (!url) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
      }

      // Validate URL format
      try {
        new URL(url)
      } catch (error) {
        throw new Error(`Invalid Supabase URL format: ${url}`)
      }

      // Try to initialize the client
      const supabase = getSupabaseBrowserClient()

      // Test a simple query
      const { data, error } = await supabase.from("reviews").select("count").limit(1)

      if (error) {
        throw new Error(`Query failed: ${error.message}`)
      }

      setStatus("success")
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div className="font-medium">URL:</div>
            <div className="text-sm font-mono break-all">{supabaseUrl || "Not tested yet"}</div>
          </div>

          {status === "success" && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>Your Supabase connection is working correctly.</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{errorMessage || "An unknown error occurred"}</AlertDescription>
            </Alert>
          )}

          <Button onClick={testConnection} disabled={status === "testing"} className="w-full">
            {status === "testing" ? "Testing..." : "Test Supabase Connection"}
          </Button>

          {status !== "idle" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Troubleshooting Tips</AlertTitle>
              <AlertDescription className="text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check that your NEXT_PUBLIC_SUPABASE_URL is correct in .env.local</li>
                  <li>Verify that your NEXT_PUBLIC_SUPABASE_ANON_KEY is valid</li>
                  <li>Ensure your Supabase project is active and not paused</li>
                  <li>Check for network connectivity issues</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
