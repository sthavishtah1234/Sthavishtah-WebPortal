"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function InstructorTest() {
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const loadInstructors = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("instructors").select("*")

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setInstructors(data || [])
        setMessage(`Found ${data?.length || 0} instructors`)
      }
    } catch (err) {
      setMessage(`Connection error: ${err}`)
    }
  }

  const createTestInstructor = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("instructors")
        .insert([
          {
            instructor_id: "TEST001",
            name: "Test Instructor",
            mobile: "9999999999",
            password: "test123",
            email: "test@instructor.com",
            specialization: "Yoga",
            experience_years: 5,
            bio: "Test instructor for login testing",
          },
        ])
        .select()

      if (error) {
        setMessage(`Error creating instructor: ${error.message}`)
      } else {
        setMessage("Test instructor created successfully!")
        loadInstructors()
      }
    } catch (err) {
      setMessage(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstructors()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Instructor Database Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="font-semibold mb-2">Current Instructors:</h3>
            {instructors.length === 0 ? (
              <p className="text-gray-500">No instructors found</p>
            ) : (
              <div className="space-y-2">
                {instructors.map((instructor) => (
                  <div key={instructor.id} className="p-2 border rounded">
                    <p>
                      <strong>ID:</strong> {instructor.instructor_id}
                    </p>
                    <p>
                      <strong>Name:</strong> {instructor.name}
                    </p>
                    <p>
                      <strong>Mobile:</strong> {instructor.mobile}
                    </p>
                    <p>
                      <strong>Password:</strong> {instructor.password}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={loadInstructors}>Refresh</Button>
            <Button onClick={createTestInstructor} disabled={loading}>
              {loading ? "Creating..." : "Create Test Instructor"}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Test Login Credentials:</strong>
            </p>
            <p>Instructor ID: TEST001</p>
            <p>Mobile: 9999999999</p>
            <p>Password: test123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
