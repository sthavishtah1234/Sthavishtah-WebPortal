"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Info, XCircle, Mail } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import * as XLSX from "xlsx"

export default function BulkRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [batchPreference, setBatchPreference] = useState("")
  const [usersData, setUsersData] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [parsedUsers, setParsedUsers] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState<
    Array<{
      name: string
      email: string
      phone_number: string
      user_id: string
      password: string
    }>
  >([])
  const [skippedUsers, setSkippedUsers] = useState<
    Array<{
      name: string
      email: string
      phone_number: string
      reason: string
    }>
  >([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile)
    setError(null)
    setSuccess(null)
    setShowPreview(false)
    setParsedUsers([])
  }

  const parseFile = async () => {
    if (!file) {
      setError("Please upload a file first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "csv") {
        const text = await file.text()
        const rows = text.split("\n")
        const headers = rows[0].split(",").map((h) => h.trim())

        const users = rows
          .slice(1)
          .filter((row) => row.trim() !== "") // Skip empty rows
          .map((row) => {
            const values = row.split(",").map((v) => v.trim())
            const user = {}

            headers.forEach((header, index) => {
              user[header] = values[index] || "" // Use empty string for missing values
            })

            return user
          })

        setParsedUsers(users)
        setUserCount(users.length)
        setShowPreview(true)
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) // Use empty string as default value

        setParsedUsers(jsonData)
        setUserCount(jsonData.length)
        setShowPreview(true)
      }

      setSuccess(`Successfully parsed ${userCount} users from the file.`)
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse file. Please check the format and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setRegisteredUsers([])
    setSkippedUsers([])

    try {
      // Parse the textarea content
      const lines = usersData.trim().split("\n")
      const users = lines.map((line) => {
        const [name = "", email = "", phone = "", whatsapp = ""] = line.split(",").map((item) => item.trim())
        return { name, email, phone_number: phone, whatsapp_number: whatsapp, preferred_batch: batchPreference }
      })

      if (users.length === 0) {
        setError("No valid user data found. Please check the format.")
        setIsLoading(false)
        return
      }

      // Register users with minimal validation
      const supabase = getSupabaseBrowserClient()
      let successCount = 0
      let skippedCount = 0
      const newRegisteredUsers = []
      const newSkippedUsers = []

      for (const user of users) {
        // Extract phone number
        const phoneNumber = user.phone_number || user.phone || ""

        if (!phoneNumber) {
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: "",
            reason: "Missing phone number",
          })
          skippedCount++
          continue
        }

        // Check if phone number already exists
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("phone_number", phoneNumber)
          .single()

        if (!checkError && existingUser) {
          // Phone number already exists, skip this user
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: phoneNumber,
            reason: "Phone number already registered",
          })
          skippedCount++
          continue
        }

        // Generate a random password
        const password = Math.random().toString(36).slice(-8)
        const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`

        // Create user in the database
        const { data, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              user_id: userId,
              name: user.name || "Unknown",
              email: user.email || `user_${Date.now()}@example.com`,
              phone_number: phoneNumber,
              whatsapp_number: user.whatsapp_number || phoneNumber || "",
              password: password, // In a real app, this should be hashed
              preferred_batch: batchPreference,
            },
          ])
          .select()

        if (insertError) {
          console.error("Error inserting user:", insertError)
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: phoneNumber,
            reason: "Database error: " + insertError.message,
          })
          skippedCount++
        } else {
          successCount++
          newRegisteredUsers.push({
            name: user.name || "Unknown",
            email: user.email || `user_${Date.now()}@example.com`,
            phone_number: phoneNumber,
            user_id: userId,
            password: password,
          })
        }
      }

      setRegisteredUsers(newRegisteredUsers)
      setSkippedUsers(newSkippedUsers)

      setSuccess(`Successfully registered ${successCount} users. Skipped ${skippedCount} users.`)

      setUsersData("")
      setBatchPreference("")
    } catch (err) {
      console.error("Error registering users:", err)
      setError("Failed to register users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSubmit = async () => {
    if (parsedUsers.length === 0) {
      setError("No users to register. Please parse the file first.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setRegisteredUsers([])
    setSkippedUsers([])

    try {
      // Register users
      const supabase = getSupabaseBrowserClient()
      let successCount = 0
      let skippedCount = 0
      const newRegisteredUsers = []
      const newSkippedUsers = []

      for (const user of parsedUsers) {
        // Extract phone number correctly based on possible column names
        const phoneNumber = user.phone_number || user.phone_num || user.phone || user.phoneNumber || ""

        if (!phoneNumber) {
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: "",
            reason: "Missing phone number",
          })
          skippedCount++
          continue
        }

        // Check if phone number already exists
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("phone_number", phoneNumber)
          .single()

        if (!checkError && existingUser) {
          // Phone number already exists, skip this user
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: phoneNumber,
            reason: "Phone number already registered",
          })
          skippedCount++
          continue
        }

        // Generate a random password
        const password = Math.random().toString(36).slice(-8)
        const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`

        // Create user in the database with minimal validation
        const { data, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              user_id: userId,
              name: user.name || "Unknown",
              email: user.email || `user_${Date.now()}@example.com`,
              phone_number: phoneNumber,
              whatsapp_number: user.whatsapp_number || user.whatsapp_num || user.whatsapp || phoneNumber || "",
              password: password, // In a real app, this should be hashed
              preferred_batch: user.preferred_batch || batchPreference || null,
            },
          ])
          .select()

        if (insertError) {
          console.error("Error inserting user:", insertError)
          newSkippedUsers.push({
            name: user.name || "Unknown",
            email: user.email || "",
            phone_number: phoneNumber,
            reason: "Database error: " + insertError.message,
          })
          skippedCount++
        } else {
          successCount++
          newRegisteredUsers.push({
            name: user.name || "Unknown",
            email: user.email || `user_${Date.now()}@example.com`,
            phone_number: phoneNumber,
            user_id: userId,
            password: password,
          })
        }
      }

      setRegisteredUsers(newRegisteredUsers)
      setSkippedUsers(newSkippedUsers)

      setSuccess(`Successfully registered ${successCount} users. Skipped ${skippedCount} users.`)

      setFile(null)
      setParsedUsers([])
      setShowPreview(false)
      setBatchPreference("")
    } catch (err) {
      console.error("Error registering users:", err)
      setError("Failed to register users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const exportCredentialsToCSV = () => {
    if (registeredUsers.length === 0) return

    // Create CSV content
    const headers = ["Name", "Email", "Phone", "User ID", "Password"]
    const csvRows = [headers]

    registeredUsers.forEach((user) => {
      csvRows.push([user.name, user.email, user.phone_number, user.user_id, user.password])
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "user_credentials.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportSkippedToCSV = () => {
    if (skippedUsers.length === 0) return

    // Create CSV content
    const headers = ["Name", "Email", "Phone", "Reason"]
    const csvRows = [headers]

    skippedUsers.forEach((user) => {
      csvRows.push([user.name, user.email, user.phone_number, user.reason])
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "skipped_users.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const sendPasswordEmails = async () => {
    if (!registeredUsers.length) return

    try {
      setIsProcessing(true)
      setStatusMessage("Sending password emails...")

      // Get admin password from localStorage
      const adminPassword = localStorage.getItem("adminPassword") || ""

      // Send emails one by one
      let successCount = 0
      let failCount = 0

      for (const user of registeredUsers) {
        try {
          const response = await fetch("/api/send-password-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.user_id,
              adminPassword,
            }),
          })

          const data = await response.json()

          if (data.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`Error sending email to user ${user.user_id}:`, error)
          failCount++
        }
      }

      setStatusMessage(`Emails sent: ${successCount} successful, ${failCount} failed`)
    } catch (error) {
      console.error("Error in bulk sending emails:", error)
      setStatusMessage("Failed to send password emails")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Registration</h1>
          <p className="text-muted-foreground">Register multiple users at once.</p>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Bulk Registration</CardTitle>
                <CardDescription>
                  Enter user details in CSV format: Name, Email, Phone, WhatsApp (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchPreference">Default Batch Preference</Label>
                    <Select value={batchPreference} onValueChange={setBatchPreference}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6:00 AM - 7:00 AM)</SelectItem>
                        <SelectItem value="sunrise">Sunrise (8:00 AM - 9:00 AM)</SelectItem>
                        <SelectItem value="evening">Evening (5:30 PM - 6:30 PM)</SelectItem>
                        <SelectItem value="night">Night (7:00 PM - 8:00 PM)</SelectItem>
                        <SelectItem value="weekend_morning">Weekend Morning (9:00 AM - 10:00 AM)</SelectItem>
                        <SelectItem value="weekend_evening">Weekend Evening (5:00 PM - 6:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usersData">User Data</Label>
                    <Textarea
                      id="usersData"
                      placeholder="John Doe, john@example.com, 9876543210, 9876543210"
                      value={usersData}
                      onChange={(e) => setUsersData(e.target.value)}
                      rows={10}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter one user per line in the format: Name, Email, Phone, WhatsApp (optional)
                    </p>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register Users"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>Upload a CSV or Excel file with user details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>File Format</AlertTitle>
                  <AlertDescription>
                    Your file should have the following columns: name, email, phone_number (or phone_num),
                    whatsapp_number (optional), preferred_batch (optional)
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="batchPreference">Default Batch Preference (if not specified in file)</Label>
                  <Select value={batchPreference} onValueChange={setBatchPreference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (6:00 AM - 7:00 AM)</SelectItem>
                      <SelectItem value="sunrise">Sunrise (8:00 AM - 9:00 AM)</SelectItem>
                      <SelectItem value="evening">Evening (5:30 PM - 6:30 PM)</SelectItem>
                      <SelectItem value="night">Night (7:00 PM - 8:00 PM)</SelectItem>
                      <SelectItem value="weekend_morning">Weekend Morning (9:00 AM - 10:00 AM)</SelectItem>
                      <SelectItem value="weekend_evening">Weekend Evening (5:00 PM - 6:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FileUpload onFileUpload={handleFileUpload} acceptedFileTypes=".csv,.xlsx,.xls" maxSizeMB={10} />

                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={parseFile}
                    disabled={!file || isLoading}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Parse File
                  </Button>
                </div>

                {showPreview && parsedUsers.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Preview ({parsedUsers.length} users)</h3>
                      <Button onClick={handleFileSubmit} disabled={isLoading}>
                        {isLoading ? "Registering..." : "Register Users"}
                      </Button>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(parsedUsers[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {parsedUsers.slice(0, 5).map((user, index) => (
                              <tr key={index}>
                                {Object.values(user).map((value: any, i) => (
                                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedUsers.length > 5 && (
                        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                          Showing 5 of {parsedUsers.length} users
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {registeredUsers.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Registered Users Credentials</CardTitle>
              <CardDescription>
                These are the login credentials for the newly registered users. Make sure to save this information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={exportCredentialsToCSV} className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Credentials as CSV
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Password
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registeredUsers.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {registeredUsers.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" onClick={sendPasswordEmails} disabled={isProcessing}>
              <Mail className="mr-2 h-4 w-4" />
              {isProcessing ? "Sending Emails..." : "Send Password Emails to All"}
            </Button>
          </div>
        )}

        {skippedUsers.length > 0 && (
          <Card className="mt-6 border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 text-amber-500 mr-2" />
                Skipped Users
              </CardTitle>
              <CardDescription>
                These users were not registered due to duplicate phone numbers or other issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={exportSkippedToCSV} variant="outline" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Skipped Users as CSV
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {skippedUsers.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{user.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
