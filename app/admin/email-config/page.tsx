"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Mail, Save, Database, AlertTriangle, Info } from "lucide-react"

interface EmailConfig {
  host: string
  port: string
  secure: boolean
  email_user: string
  password: string
  admin_password: string
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig>({
    host: "",
    port: "",
    secure: false,
    email_user: "",
    password: "",
    admin_password: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [creatingTable, setCreatingTable] = useState(false)
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | "info"
    message: string
    title?: string
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    // Check if we're in preview mode
    const isPreview =
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("preview")
    setIsPreviewMode(isPreview)

    fetchConfig()
  }, [])

  async function createConfigTable() {
    try {
      setCreatingTable(true)
      setStatus({ type: "info", message: "Creating email configuration table..." })

      // Call the API to create the table
      const response = await fetch("/api/create-email-config-table")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create email configuration table")
      }

      setStatus({ type: "success", message: "Email configuration table created successfully" })
      return true
    } catch (error) {
      console.error("Error creating email config table:", error)
      setStatus({
        type: "error",
        message: `Failed to create email configuration table: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      return false
    } finally {
      setCreatingTable(false)
    }
  }

  async function fetchConfig() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Try to get config from the database first
      // Don't use .single() which requires exactly one row
      const { data: configData, error: configError } = await supabase.from("email_config").select("*").limit(1)

      // If there's an error about the table not existing, create it
      if (configError && configError.message.includes("does not exist")) {
        const tableCreated = await createConfigTable()
        if (!tableCreated) {
          throw new Error("Could not create email configuration table")
        }
        // After creating the table, we don't have any data yet
      } else if (configError) {
        console.error("Error fetching email config:", configError)
      }

      // If we have data and at least one row
      if (configData && configData.length > 0) {
        const firstConfig = configData[0]
        setConfig({
          host: firstConfig.host || "",
          port: firstConfig.port || "",
          secure: firstConfig.secure || false,
          email_user: firstConfig.email_user || "",
          password: firstConfig.password || "",
          admin_password: firstConfig.admin_password || "",
        })
      } else {
        // If no config in database, try to use environment variables
        const adminPassword = localStorage.getItem("adminPassword") || ""

        // Make API call to get environment variables
        const response = await fetch("/api/get-email-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPassword }),
        })

        if (response.ok) {
          const envConfig = await response.json()
          setConfig({
            host: envConfig.EMAIL_HOST || "",
            port: envConfig.EMAIL_PORT || "",
            secure: envConfig.EMAIL_SECURE === "true",
            email_user: envConfig.EMAIL_USER || "",
            password: envConfig.EMAIL_PASSWORD || "",
            admin_password: envConfig.ADMIN_PASSWORD || adminPassword,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching email config:", error)
      setStatus({
        type: "error",
        message: "Failed to load email configuration",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof EmailConfig, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = () => {
    if (!config.host.trim()) {
      setStatus({
        type: "error",
        message: "Please enter an email host",
      })
      return false
    }

    if (!config.port.trim()) {
      setStatus({
        type: "error",
        message: "Please enter a port number",
      })
      return false
    }

    if (!config.email_user.trim()) {
      setStatus({
        type: "error",
        message: "Please enter an email user/address",
      })
      return false
    }

    if (!config.password.trim()) {
      setStatus({
        type: "error",
        message: "Please enter an email password",
      })
      return false
    }

    if (!config.admin_password.trim()) {
      setStatus({
        type: "error",
        message: "Please enter an admin password",
      })
      return false
    }

    return true
  }

  const saveConfig = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      setStatus(null)

      const supabase = getSupabaseBrowserClient()

      try {
        // Check if config exists
        const { data: existingConfig, error: checkError } = await supabase.from("email_config").select("id").limit(1)

        // If table doesn't exist, create it
        if (checkError && checkError.message.includes("does not exist")) {
          const tableCreated = await createConfigTable()
          if (!tableCreated) {
            throw new Error("Could not create email configuration table")
          }
        } else if (checkError) {
          throw checkError
        }

        let result

        if (existingConfig && existingConfig.length > 0) {
          // Update existing config
          result = await supabase
            .from("email_config")
            .update({
              host: config.host,
              port: config.port,
              secure: config.secure,
              email_user: config.email_user,
              password: config.password,
              admin_password: config.admin_password,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingConfig[0].id)
        } else {
          // Insert new config
          result = await supabase.from("email_config").insert({
            host: config.host,
            port: config.port,
            secure: config.secure,
            email_user: config.email_user,
            password: config.password,
            admin_password: config.admin_password,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }

        if (result.error) throw result.error
      } catch (error) {
        console.error("Database error:", error)
        throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      // Store admin password in localStorage
      localStorage.setItem("adminPassword", config.admin_password)

      // In preview mode, we don't need to update environment variables
      if (isPreviewMode) {
        setStatus({
          type: "success",
          title: "Configuration Saved",
          message:
            "Email configuration saved to database successfully. Note: Environment variables cannot be updated in preview mode.",
        })
      } else {
        // Update environment variables via API
        try {
          const updateResponse = await fetch("/api/update-email-config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              config,
              adminPassword: config.admin_password,
            }),
          })

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json()
            throw new Error(errorData.message || "Failed to update environment variables")
          }

          setStatus({
            type: "success",
            title: "Configuration Saved",
            message: "Email configuration saved successfully to both database and environment variables.",
          })
        } catch (error) {
          console.error("Error updating environment variables:", error)
          setStatus({
            type: "warning",
            title: "Partial Success",
            message: `Configuration saved to database, but environment variables could not be updated: ${error instanceof Error ? error.message : "Unknown error"}`,
          })
        }
      }
    } catch (error) {
      console.error("Error saving email config:", error)
      setStatus({
        type: "error",
        title: "Save Failed",
        message: `Failed to save configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setSaving(false)
    }
  }

  const testEmailConfig = async () => {
    if (!validateForm()) return

    try {
      setTesting(true)
      setStatus(null)

      const response = await fetch("/api/test-email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config,
          adminPassword: config.admin_password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.previewMode) {
          setStatus({
            type: "info",
            title: "Configuration Validated",
            message:
              data.message ||
              "Configuration format is valid. Note: Actual email sending is not available in preview mode.",
          })
        } else {
          setStatus({
            type: "success",
            title: "Test Successful",
            message: data.message || "Email configuration test successful! Check your inbox.",
          })
        }
      } else {
        setStatus({
          type: "error",
          title: "Test Failed",
          message: data.message || "Email test failed",
        })
      }
    } catch (error) {
      console.error("Error testing email config:", error)
      setStatus({
        type: "error",
        title: "Test Error",
        message: `An unexpected error occurred during testing: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Configuration</h1>
        </div>

        {isPreviewMode && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Preview Mode Detected</AlertTitle>
            <AlertDescription>
              You are in preview mode. Email sending functionality is limited. Configuration will be saved to the
              database, but actual emails cannot be sent in this environment.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure your email server settings for sending emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading configuration...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP Host</Label>
                    <Input
                      id="host"
                      value={config.host}
                      onChange={(e) => handleChange("host", e.target.value)}
                      placeholder="e.g., smtp.resend.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">SMTP Port</Label>
                    <Input
                      id="port"
                      value={config.port}
                      onChange={(e) => handleChange("port", e.target.value)}
                      placeholder="e.g., 587 or 465"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="secure"
                    checked={config.secure}
                    onCheckedChange={(checked) => handleChange("secure", Boolean(checked))}
                  />
                  <Label htmlFor="secure">Use Secure Connection (TLS/SSL)</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_user">Email User/Address</Label>
                  <Input
                    id="email_user"
                    value={config.email_user}
                    onChange={(e) => handleChange("email_user", e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Email Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={config.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Your email password or app password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    For Gmail, use an App Password. For Resend, use your API key.{" "}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Get Resend API Key
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="admin_password"
                      type={showPassword ? "text" : "password"}
                      value={config.admin_password}
                      onChange={(e) => handleChange("admin_password", e.target.value)}
                      placeholder="Password for admin access"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This password will be used for admin authentication across the application.
                  </p>
                </div>

                {status && (
                  <Alert
                    variant={
                      status.type === "success"
                        ? "default"
                        : status.type === "error"
                          ? "destructive"
                          : status.type === "warning"
                            ? "warning"
                            : "default"
                    }
                  >
                    {status.type === "success" && <Info className="h-4 w-4" />}
                    {status.type === "error" && <AlertTriangle className="h-4 w-4" />}
                    {status.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                    {status.type === "info" && <Info className="h-4 w-4" />}

                    {status.title && <AlertTitle>{status.title}</AlertTitle>}
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button onClick={saveConfig} disabled={saving || loading || creatingTable} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
            <Button
              onClick={testEmailConfig}
              disabled={testing || loading || creatingTable}
              variant="outline"
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {testing ? "Testing..." : isPreviewMode ? "Validate Configuration" : "Test Configuration"}
            </Button>
            <Button
              onClick={createConfigTable}
              disabled={creatingTable || loading}
              variant="outline"
              className="w-full"
            >
              <Database className="mr-2 h-4 w-4" />
              {creatingTable ? "Creating Table..." : "Initialize Database"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
