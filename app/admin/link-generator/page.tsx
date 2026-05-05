"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Copy, Trash2, LinkIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LinkGeneratorPage() {
  // State for form inputs
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [targetType, setTargetType] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [selectedSubscription, setSelectedSubscription] = useState<string>("")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
  const [showCalendar, setShowCalendar] = useState(false)
  const [hasExpiration, setHasExpiration] = useState(false)
  const [activeTab, setActiveTab] = useState("session")

  // State for data
  const [users, setUsers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [accessRequests, setAccessRequests] = useState<any[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchUsers(), fetchSubscriptions(), fetchLinks(), fetchCourses(), fetchAccessRequests()])
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Fetched subscriptions:", data.subscriptions) // Debug log

      // Log each subscription's WhatsApp link
      data.subscriptions?.forEach((sub) => {
        console.log(`Subscription ${sub.name}:`, {
          id: sub.id,
          whatsappGroupLink: sub.whatsappGroupLink,
          whatsapp_group_link: sub.whatsapp_group_link,
        })
      })

      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch links
  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setLinks(data.links || [])
    } catch (error) {
      console.error("Error fetching links:", error)
      toast({
        title: "Error",
        description: "Failed to fetch links. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to fetch courses. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch("/api/links/access-requests")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setAccessRequests(data.requests || [])
    } catch (error) {
      console.error("Error fetching access requests:", error)
      toast({
        title: "Error",
        description: "Failed to fetch access requests. Please try again.",
        variant: "destructive",
      })
    }
  }

  const approveAccessRequest = async (requestId: string, userId: string, subscriptionId: string) => {
    try {
      const subscription = subscriptions.find((sub) => sub.id.toString() === subscriptionId)
      const whatsappLink = subscription?.whatsappGroupLink || subscription?.whatsapp_group_link

      if (!subscription || !whatsappLink) {
        toast({
          title: "Error",
          description: "Subscription does not have a WhatsApp group link.",
          variant: "destructive",
        })
        return
      }

      const user = users.find((u) => u.id.toString() === userId)

      // Create a new link for this user
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Additional WhatsApp Access for ${user?.name || user?.email || `User ${userId}`}`,
          description: `Admin-approved additional access to WhatsApp group`,
          linkType: "whatsapp",
          targetUrl: whatsappLink,
          targetType: "user",
          targetIds: [userId],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day expiration
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create access link")
      }

      const data = await response.json()

      // Mark the request as approved
      const approveResponse = await fetch(`/api/links/approve-request/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId: data.link.id,
        }),
      })

      if (!approveResponse.ok) {
        throw new Error("Failed to approve request")
      }

      toast({
        title: "Success",
        description: "Access request approved and link created.",
      })

      // Refresh access requests
      fetchAccessRequests()
    } catch (error) {
      console.error("Error approving access request:", error)
      toast({
        title: "Error",
        description: "Failed to approve access request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const denyAccessRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/links/deny-request/${requestId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to deny request")
      }

      toast({
        title: "Success",
        description: "Access request denied.",
      })

      // Refresh access requests
      fetchAccessRequests()
    } catch (error) {
      console.error("Error denying access request:", error)
      toast({
        title: "Error",
        description: "Failed to deny access request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Create link
  const createLink = async () => {
    setCreating(true)
    try {
      // Prepare target IDs based on target type
      let targetIds = null
      if (targetType === "users") {
        targetIds = selectedUsers
      } else if (targetType === "user") {
        targetIds = [selectedUser]
      } else if (targetType === "subscription") {
        targetIds = selectedSubscriptions
      }

      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          linkType: activeTab,
          targetUrl,
          targetType,
          targetIds,
          expiresAt: hasExpiration ? expiresAt : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Link created successfully!",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setTargetUrl("")
      setTargetType("all")
      setSelectedUsers([])
      setSelectedUser("")
      setSelectedSubscriptions([])
      setExpiresAt(undefined)
      setHasExpiration(false)

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error creating link:", error)
      toast({
        title: "Error",
        description: `Failed to create link: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Create course session link
  const createCourseSessionLink = async (courseId: string, courseName: string) => {
    setCreating(true)
    try {
      // Prepare target IDs based on target type
      let targetIds = null
      if (targetType === "users") {
        targetIds = selectedUsers
      } else if (targetType === "user") {
        targetIds = [selectedUser]
      } else if (targetType === "subscription") {
        targetIds = selectedSubscriptions
      }

      const requestBody = {
        title: `Access to ${courseName}`,
        description: `Link to access the course: ${courseName}`,
        linkType: "session",
        targetUrl: `/user/access-course/${courseId}`,
        targetType: targetType,
        targetIds: targetIds,
        expiresAt: hasExpiration ? expiresAt : null,
      }

      console.log("Creating course session link with:", requestBody)

      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Response:", errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `Session link for "${courseName}" created successfully!`,
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error creating course session link:", error)
      toast({
        title: "Error",
        description: `Failed to create course session link: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Create WhatsApp link for subscription
  const createWhatsAppLink = async (subscriptionId: string, subscriptionName: string, whatsappLink: string) => {
    if (!whatsappLink) {
      toast({
        title: "Error",
        description: "This subscription does not have a WhatsApp group link.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `WhatsApp Group for ${subscriptionName}`,
          description: `Link to join the WhatsApp group for ${subscriptionName}`,
          linkType: "whatsapp",
          targetUrl: whatsappLink,
          targetType: targetType,
          targetIds:
            targetType === "users"
              ? selectedUsers
              : targetType === "user"
                ? [selectedUser]
                : targetType === "subscription"
                  ? selectedSubscriptions
                  : null,
          expiresAt: hasExpiration ? expiresAt : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `WhatsApp link for "${subscriptionName}" created successfully!`,
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error creating WhatsApp link:", error)
      toast({
        title: "Error",
        description: `Failed to create WhatsApp link: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Create WhatsApp link for user
  const createUserWhatsAppLink = async (userId: string, userName: string, subscriptionId: string) => {
    const subscription = subscriptions.find((sub) => sub.id === subscriptionId)
    const whatsappLink = subscription?.whatsappGroupLink || subscription?.whatsapp_group_link

    if (!subscription || !whatsappLink) {
      toast({
        title: "Error",
        description: "Selected subscription does not have a WhatsApp group link.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `WhatsApp Group for ${userName}`,
          description: `Personal link for ${userName} to join the WhatsApp group`,
          linkType: "whatsapp",
          targetUrl: whatsappLink,
          targetType: "user",
          targetIds: [userId],
          expiresAt: hasExpiration ? expiresAt : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `WhatsApp link for user "${userName}" created successfully!`,
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error creating user WhatsApp link:", error)
      toast({
        title: "Error",
        description: `Failed to create user WhatsApp link: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Copy link to clipboard
  const copyLink = (token: string) => {
    const linkUrl = `${window.location.origin}/l/${token}`
    navigator.clipboard.writeText(linkUrl)
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    })
  }

  // Copy course link
  const copyCourseLink = (courseId: string, courseName: string) => {
    const courseLink = `${window.location.origin}/user/access-course/${courseId}`
    navigator.clipboard.writeText(courseLink)
    toast({
      title: "Copied!",
      description: `Direct link to "${courseName}" copied to clipboard.`,
    })
  }

  // Copy subscription WhatsApp link
  const copySubscriptionWhatsAppLink = (whatsappLink: string, subscriptionName: string) => {
    navigator.clipboard.writeText(whatsappLink)
    toast({
      title: "Copied!",
      description: `WhatsApp link for "${subscriptionName}" copied to clipboard.`,
    })
  }

  // Delete course link
  const deleteCourseLink = async (courseId: string, courseName: string) => {
    try {
      // Find and delete all links for this course
      const courseLinks = links.filter((link) => link.target_url === `/user/access-course/${courseId}`)

      if (courseLinks.length === 0) {
        toast({
          title: "Info",
          description: `No links found for "${courseName}".`,
        })
        return
      }

      for (const link of courseLinks) {
        const response = await fetch(`/api/links/delete/${link.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to delete link ${link.id}`)
        }
      }

      toast({
        title: "Success",
        description: `All links for "${courseName}" deleted successfully!`,
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error deleting course links:", error)
      toast({
        title: "Error",
        description: `Failed to delete course links: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Delete subscription WhatsApp links
  const deleteSubscriptionWhatsAppLinks = async (subscriptionId: string, subscriptionName: string) => {
    try {
      // Find and delete all WhatsApp links for this subscription
      const subscriptionLinks = links.filter(
        (link) =>
          link.link_type === "whatsapp" &&
          (link.target_ids?.includes(subscriptionId.toString()) || link.target_type === "subscription"),
      )

      if (subscriptionLinks.length === 0) {
        toast({
          title: "Info",
          description: `No WhatsApp links found for "${subscriptionName}".`,
        })
        return
      }

      for (const link of subscriptionLinks) {
        const response = await fetch(`/api/links/delete/${link.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to delete link ${link.id}`)
        }
      }

      toast({
        title: "Success",
        description: `All WhatsApp links for "${subscriptionName}" deleted successfully!`,
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error deleting subscription WhatsApp links:", error)
      toast({
        title: "Error",
        description: `Failed to delete subscription WhatsApp links: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Delete link
  const deleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links/delete/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Link deleted successfully!",
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error deleting link:", error)
      toast({
        title: "Error",
        description: "Failed to delete link. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Deactivate link
  /*const deactivateLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links/deactivate/${id}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Link deactivated successfully!",
      })

      // Refresh links
      fetchLinks()
    } catch (error) {
      console.error("Error deactivating link:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate link. Please try again.",
        variant: "destructive",
      })
    }
  }*/

  // Handle user selection change
  const handleUserSelectionChange = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Link Generator</h1>

        <Tabs defaultValue="session" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="session">Session Links</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Links</TabsTrigger>
          </TabsList>

          <TabsContent value="session">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Session Link</CardTitle>
                  <CardDescription>
                    Generate a link that provides access to a specific course or session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="target-type">Who can use this link?</Label>
                    <RadioGroup value={targetType} onValueChange={setTargetType} className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">All Users</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="users" id="users" />
                        <Label htmlFor="users">Selected Users</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="user" />
                        <Label htmlFor="user">Single User</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subscription" id="subscription" />
                        <Label htmlFor="subscription">Subscription Members</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {targetType === "users" && (
                    <div>
                      <Label>Select Users</Label>
                      <div className="mt-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id.toString())}
                              onCheckedChange={(checked) =>
                                handleUserSelectionChange(user.id.toString(), checked === true)
                              }
                            />
                            <Label htmlFor={`user-${user.id}`}>{user.name || user.email || `User ${user.id}`}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {targetType === "user" && (
                    <div>
                      <Label htmlFor="selected-user">Select User</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger id="selected-user" className="mt-2">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name || user.email || `User ${user.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {targetType === "subscription" && (
                    <div>
                      <Label htmlFor="selected-subscriptions">Select Subscriptions</Label>
                      <div className="mt-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                        {subscriptions.map((subscription) => (
                          <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`subscription-${subscription.id}`}
                              checked={selectedSubscriptions.includes(subscription.id.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubscriptions((prev) => [...prev, subscription.id.toString()])
                                } else {
                                  setSelectedSubscriptions((prev) =>
                                    prev.filter((id) => id !== subscription.id.toString()),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor={`subscription-${subscription.id}`}>{subscription.name}</Label>
                          </div>
                        ))}
                      </div>
                      {selectedSubscriptions.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {selectedSubscriptions.length} subscription(s) selected
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="has-expiration"
                        checked={hasExpiration}
                        onCheckedChange={(checked) => setHasExpiration(checked === true)}
                      />
                      <Label htmlFor="has-expiration">Set Expiration Date</Label>
                    </div>

                    {hasExpiration && (
                      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expiresAt}
                            onSelect={(date) => {
                              setExpiresAt(date)
                              setShowCalendar(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Courses</CardTitle>
                  <CardDescription>Select a course to create a session link for.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading courses...</p>
                  ) : courses.length === 0 ? (
                    <p>No courses available.</p>
                  ) : (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div key={course.id} className="border rounded-md p-4">
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{course.description || "No description"}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              onClick={() => createCourseSessionLink(course.id, course.title)}
                              disabled={
                                creating ||
                                (targetType === "user" && !selectedUser) ||
                                (targetType === "subscription" && selectedSubscriptions.length === 0) ||
                                (targetType === "users" && selectedUsers.length === 0)
                              }
                            >
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Create Link
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => copyCourseLink(course.id, course.title)}>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCourseLink(course.id, course.title)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create WhatsApp Link</CardTitle>
                  <CardDescription>Generate a link that provides access to a WhatsApp group.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="target-type-whatsapp">Who can use this link?</Label>
                    <RadioGroup value={targetType} onValueChange={setTargetType} className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all-whatsapp" />
                        <Label htmlFor="all-whatsapp">All Users</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="users" id="users-whatsapp" />
                        <Label htmlFor="users-whatsapp">Selected Users</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="user-whatsapp" />
                        <Label htmlFor="user-whatsapp">Single User</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subscription" id="subscription-whatsapp" />
                        <Label htmlFor="subscription-whatsapp">Subscription Members</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {targetType === "users" && (
                    <div>
                      <Label>Select Users</Label>
                      <div className="mt-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`user-whatsapp-${user.id}`}
                              checked={selectedUsers.includes(user.id.toString())}
                              onCheckedChange={(checked) =>
                                handleUserSelectionChange(user.id.toString(), checked === true)
                              }
                            />
                            <Label htmlFor={`user-whatsapp-${user.id}`}>
                              {user.name || user.email || `User ${user.id}`}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {targetType === "user" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="selected-user-whatsapp">Select User</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger id="selected-user-whatsapp" className="mt-2">
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name || user.email || `User ${user.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="selected-subscription-for-user">Select Subscription for WhatsApp Link</Label>
                        <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                          <SelectTrigger id="selected-subscription-for-user" className="mt-2">
                            <SelectValue placeholder="Select a subscription" />
                          </SelectTrigger>
                          <SelectContent>
                            {subscriptions
                              .filter((sub) => sub.whatsappGroupLink || sub.whatsapp_group_link)
                              .map((subscription) => (
                                <SelectItem key={subscription.id} value={subscription.id.toString()}>
                                  {subscription.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedUser && selectedSubscription && (
                        <Button
                          onClick={() => {
                            const user = users.find((u) => u.id.toString() === selectedUser)
                            createUserWhatsAppLink(
                              selectedUser,
                              user?.name || user?.email || `User ${selectedUser}`,
                              selectedSubscription,
                            )
                          }}
                          disabled={creating}
                        >
                          Create WhatsApp Link for User
                        </Button>
                      )}
                    </div>
                  )}

                  {targetType === "subscription" && (
                    <div>
                      <Label htmlFor="selected-subscriptions-whatsapp">Select Subscriptions</Label>
                      <div className="mt-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                        {subscriptions.map((subscription) => (
                          <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`subscription-whatsapp-${subscription.id}`}
                              checked={selectedSubscriptions.includes(subscription.id.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubscriptions((prev) => [...prev, subscription.id.toString()])
                                } else {
                                  setSelectedSubscriptions((prev) =>
                                    prev.filter((id) => id !== subscription.id.toString()),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor={`subscription-whatsapp-${subscription.id}`}>{subscription.name}</Label>
                          </div>
                        ))}
                      </div>
                      {selectedSubscriptions.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {selectedSubscriptions.length} subscription(s) selected
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="has-expiration-whatsapp"
                        checked={hasExpiration}
                        onCheckedChange={(checked) => setHasExpiration(checked === true)}
                      />
                      <Label htmlFor="has-expiration-whatsapp">Set Expiration Date</Label>
                    </div>

                    {hasExpiration && (
                      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expiresAt}
                            onSelect={(date) => {
                              setExpiresAt(date)
                              setShowCalendar(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Subscriptions</CardTitle>
                  <CardDescription>Select a subscription to create a WhatsApp group link for.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading subscriptions...</p>
                  ) : subscriptions.length === 0 ? (
                    <p>No subscriptions available.</p>
                  ) : (
                    <div className="space-y-4">
                      {subscriptions.map((subscription) => (
                        <div key={subscription.id} className="border rounded-md p-4">
                          <h3 className="font-medium">{subscription.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {subscription.whatsappGroupLink || subscription.whatsapp_group_link
                              ? "Has WhatsApp group link"
                              : "No WhatsApp group link available"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Link: {subscription.whatsappGroupLink || subscription.whatsapp_group_link || "None"}
                          </p>
                          {(subscription.whatsappGroupLink || subscription.whatsapp_group_link) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                onClick={() =>
                                  createWhatsAppLink(
                                    subscription.id.toString(),
                                    subscription.name,
                                    subscription.whatsappGroupLink || subscription.whatsapp_group_link,
                                  )
                                }
                                disabled={creating || (targetType === "user" && !selectedUser)}
                              >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Create WhatsApp Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copySubscriptionWhatsAppLink(
                                    subscription.whatsappGroupLink || subscription.whatsapp_group_link,
                                    subscription.name,
                                  )
                                }
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  deleteSubscriptionWhatsAppLinks(subscription.id.toString(), subscription.name)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>WhatsApp Access Requests</CardTitle>
                  <CardDescription>Manage user requests for additional WhatsApp group access.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading access requests...</p>
                  ) : accessRequests.length === 0 ? (
                    <p>No pending access requests.</p>
                  ) : (
                    <div className="space-y-4">
                      {accessRequests.map((request) => (
                        <div key={request.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {request.user?.name || request.user?.email || `User ${request.user_id}`}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Requested access to{" "}
                                {request.subscription?.name || `Subscription ${request.subscription_id}`}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Requested on {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() =>
                                  approveAccessRequest(request.id, request.user_id, request.subscription_id)
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => denyAccessRequest(request.id)}
                              >
                                Deny
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Active Links</CardTitle>
            <CardDescription>Manage your active links. Copy or deactivate as needed.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading links...</p>
            ) : links.length === 0 ? (
              <p>No active links available.</p>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{link.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{link.description || "No description"}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Type:</span>{" "}
                          {link.link_type === "session" ? "Session Link" : "WhatsApp Link"}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Target:</span>{" "}
                          {link.target_type === "all"
                            ? "All Users"
                            : link.target_type === "users"
                              ? "Selected Users"
                              : link.target_type === "user"
                                ? "Single User"
                                : "Subscription Members"}
                        </p>
                        {link.expires_at && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Expires:</span>{" "}
                            {new Date(link.expires_at).toLocaleDateString()}
                          </p>
                        )}
                        <div className="mt-2">
                          <code className="text-xs bg-gray-100 p-1 rounded">
                            {`${window.location.origin}/l/${link.token}`}
                          </code>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => copyLink(link.token)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </AdminLayout>
  )
}
