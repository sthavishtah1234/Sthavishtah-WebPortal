"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AtSign } from "lucide-react"

export default function AdminContactPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contact Information</h1>
        <p className="text-gray-500 dark:text-gray-400">Use the following information to get in touch with us.</p>

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
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              For any inquiries related to the platform, courses, or technical support, please use the contact
              information above.
            </p>
            <p>
              Our team is available to assist you during business hours and will respond to your queries as soon as
              possible.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
