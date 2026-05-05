"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Mail, Search, Paperclip, X, FileText } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
}

interface AttachedFile {
  name: string
  size: number
  type: string
  data: string // base64 encoded
}

export default function EmailPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [targetType, setTargetType] = useState<"users" | "subscriptions">("users")
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
    fetchSubscriptions()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("users")
        .select("id, user_id, name, email, phone_number")
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscriptions() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, name")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const maxSize = 10 * 1024 * 1024 // 10MB limit
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > maxSize) {
        setEmailStatus({
          type: "error",
          message: `File ${file.name} is too large. Maximum size is 10MB.`,
        })
        continue
      }

      if (!allowedTypes.includes(file.type)) {
        setEmailStatus({
          type: "error",
          message: `File type ${file.type} is not allowed.`,
        })
        continue
      }

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(",")[1] // Remove data:type;base64, prefix

        const newAttachment: AttachedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64Data,
        }

        setAttachments((prev) => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    }

    // Clear the input
    event.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateForm = () => {
    if (selectedUsers.length === 0) {
      setEmailStatus({
        type: "error",
        message: "Please select at least one user",
      })
      return false
    }

    if (!subject.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a subject",
      })
      return false
    }

    if (!message.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a message",
      })
      return false
    }

    return true
  }

  const sendEmails = async () => {
    if (targetType === "users" && selectedUsers.length === 0) {
      setEmailStatus({
        type: "error",
        message: "Please select at least one user",
      })
      return
    }

    if (targetType === "subscriptions" && selectedSubscriptions.length === 0) {
      setEmailStatus({
        type: "error",
        message: "Please select at least one subscription",
      })
      return
    }

    if (!subject.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a subject",
      })
      return
    }

    if (!message.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a message",
      })
      return
    }

    try {
      setSending(true)
      setEmailStatus(null)

      // Try multiple password sources
      const adminPassword =
        localStorage.getItem("adminPassword") || localStorage.getItem("adminAuthenticated") === "true"
          ? "admin123"
          : "!@#$%^&*()AjItH"

      console.log("Sending email request with attachments...")

      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          userIds: targetType === "users" ? selectedUsers : undefined,
          subscriptionIds: targetType === "subscriptions" ? selectedSubscriptions : undefined,
          subject,
          message: message.replace(/\n/g, "<br>"),
          attachments: attachments, // Include attachments
          adminPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailStatus({
          type: "success",
          message: data.message,
        })
        // Reset form
        setSubject("")
        setMessage("")
        setSelectedUsers([])
        setAttachments([])
      } else {
        setEmailStatus({
          type: "error",
          message: data.message || "Failed to send emails",
        })
      }
    } catch (error) {
      console.error("Error sending emails:", error)
      setEmailStatus({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose users to send emails to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Label className="mr-4">Target:</Label>
                <RadioGroup value={targetType} onValueChange={setTargetType} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="users" id="target-users" />
                    <Label htmlFor="target-users">Individual Users</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subscriptions" id="target-subscriptions" />
                    <Label htmlFor="target-subscriptions">Subscription Members</Label>
                  </div>
                </RadioGroup>
              </div>

              {targetType === "subscriptions" && (
                <div className="mb-4">
                  <Label>Select Subscriptions</Label>
                  <div className="mt-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="select-all-subscriptions"
                        checked={selectedSubscriptions.length === subscriptions.length && subscriptions.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubscriptions(subscriptions.map((sub) => sub.id.toString()))
                          } else {
                            setSelectedSubscriptions([])
                          }
                        }}
                      />
                      <Label htmlFor="select-all-subscriptions">Select All Subscriptions</Label>
                    </div>
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`subscription-${subscription.id}`}
                          checked={selectedSubscriptions.includes(subscription.id.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubscriptions((prev) => [...prev, subscription.id.toString()])
                            } else {
                              setSelectedSubscriptions((prev) => prev.filter((id) => id !== subscription.id.toString()))
                            }
                          }}
                        />
                        <Label htmlFor={`subscription-${subscription.id}`}>{subscription.name}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedSubscriptions.length} subscription(s) selected
                  </div>
                </div>
              )}

              <div className="flex items-center mb-4">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">Select All ({filteredUsers.length})</Label>
              </div>

              <div className="max-h-[400px] overflow-y-auto border rounded-md">
                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4">
                    {searchQuery ? "No users match your search." : "No users found."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-3 hover:bg-gray-50">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">{selectedUsers.length} users selected</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Create your email message with attachments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("attachments")?.click()}
                    className="flex items-center gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    Add Files
                  </Button>
                  <span className="text-xs text-gray-500">Max 10MB per file</span>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-sm font-medium">Attached Files:</Label>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT. You can attach multiple files.
              </p>

              {emailStatus && (
                <Alert variant={emailStatus.type === "success" ? "default" : "destructive"}>
                  <AlertDescription>{emailStatus.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={sendEmails}
                disabled={
                  sending || (targetType === "users" ? selectedUsers.length === 0 : selectedSubscriptions.length === 0)
                }
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {sending
                  ? "Sending..."
                  : `Send Email${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}` : ""} to ${
                      targetType === "users"
                        ? `${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`
                        : `${selectedSubscriptions.length} Subscription${selectedSubscriptions.length !== 1 ? "s" : ""}`
                    }`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
