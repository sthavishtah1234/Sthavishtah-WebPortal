"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, CreditCard } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { useToast } from "@/components/ui/use-toast"

export default function DatabaseMigrationPage() {
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const migrationFiles = [
    "create_video_analytics_table.sql",
    "update_subscription_analytics.sql",
    "video_analytics_schema.sql",
    "subscription_analytics_schema.sql",
    "documents_schema.sql",
    "documents_enhanced_schema.sql",
    "live_sessions_schema.sql",
    "reviews_schema.sql",
    "phone_verification_schema.sql",
    "auth_logs_schema.sql",
    "user_tokens_schema.sql",
    "add_terms_accepted_column.sql",
    "add_country_column.sql",
    "updates_schema.sql",
    "fix_payments_table.sql",
    "fix_user_subscriptions_table.sql",
    "fix_all_payment_tables.sql",
  ]

  const runMigration = async (endpoint?: string) => {
    if (endpoint) {
      setIsLoading(true)
      try {
        const response = await fetch(endpoint)
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: data.message || "Migration completed successfully",
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Migration failed",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!selectedFile) {
      setStatus("error")
      setMessage("Please select a migration file")
      return
    }

    setStatus("loading")
    setMessage(`Running migration: ${selectedFile}`)

    try {
      const response = await fetch("/api/run-database-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: selectedFile }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Migration completed successfully")
      } else {
        setStatus("error")
        setMessage(data.error || "Migration failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred while running the migration")
      console.error(error)
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-3xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Payment System Fixes
            </CardTitle>
            <CardDescription>Fix payment-related database issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Important</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  If you're experiencing payment verification errors, run these migrations to add all required columns
                  to the payment and subscription tables.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => runMigration("/api/fix-user-subscriptions-table")}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Fixing Table..." : "Fix User Subscriptions Table (Recommended)"}
                </Button>

                <Button
                  onClick={() => runMigration("/api/fix-all-payment-tables")}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Fixing All Tables..." : "Fix All Payment Tables (Comprehensive)"}
                </Button>

                <Button onClick={() => runMigration("/api/fix-payments-table")} disabled={isLoading} className="w-full">
                  {isLoading ? "Fixing Payments Table..." : "Fix Payments Table Only"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Database Migrations
            </CardTitle>
            <CardDescription>Run database migrations to update your database schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button onClick={() => runMigration("/api/ensure-reviews-table")} disabled={isLoading} className="mb-2">
                Ensure Reviews Table Exists
              </Button>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Migration File</label>
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a migration file" />
                  </SelectTrigger>
                  <SelectContent>
                    {migrationFiles.map((file) => (
                      <SelectItem key={file} value={file}>
                        {file}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {status === "success" && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">{message}</AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={runMigration} disabled={status === "loading" || !selectedFile} className="w-full">
              {status === "loading" ? "Running Migration..." : "Run Migration"}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-medium mb-4">Migration Instructions</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            <ol className="list-decimal list-inside space-y-2">
              <li>For payment issues, click the "Fix User Subscriptions Table" button first</li>
              <li>If issues persist, try the "Fix All Payment Tables" button for a comprehensive fix</li>
              <li>For other migrations, select the migration file from the dropdown</li>
              <li>Click the "Run Migration" button to execute the SQL</li>
              <li>Wait for the migration to complete</li>
              <li>Check the status message for success or error details</li>
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
