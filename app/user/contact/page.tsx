"use client"

import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AtSign } from "lucide-react"

export default function UserContactPage() {
  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Have questions or need assistance? Reach out to us using the information below.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:sthavishtah2024@gmail.com" className="text-blue-600 hover:underline">
                sthavishtah2024@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <AtSign className="mr-2 h-5 w-5" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>@sthavishtah</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How We Can Help</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Our team is here to assist you with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Questions about courses and sessions</li>
              <li>Subscription and payment inquiries</li>
              <li>Technical support</li>
              <li>Feedback and suggestions</li>
            </ul>
            <p className="mt-4">We aim to respond to all inquiries within 24-48 hours.</p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
