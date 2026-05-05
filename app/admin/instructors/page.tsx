"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, RefreshCw, User, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Instructor {
  id: number
  instructor_id: string
  name: string
  phone_number: string
  email: string
  dob: string
  specialization: string
  created_at: string
  // Add potential new fields
  status?: string
  experience_years?: number | string
  hourly_rate?: number | string
  qualification?: string
  [key: string]: any // Allow for any additional fields
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteInstructorId, setDeleteInstructorId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInstructors()
  }, [])

  async function fetchInstructors() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/instructors")
      const result = await response.json()

      if (result.success) {
        setInstructors(result.data || [])
      } else {
        setError(result.error || "Failed to fetch instructors")
      }
    } catch (err) {
      setError("An error occurred while fetching instructors")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteInstructor(id: number) {
    try {
      const response = await fetch(`/api/instructors/${id}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        // Remove the deleted instructor from the state
        setInstructors(instructors.filter((instructor) => instructor.id !== id))
        setShowDeleteDialog(false)
      } else {
        setError(result.error || "Failed to delete instructor")
      }
    } catch (err) {
      setError("An error occurred while deleting the instructor")
      console.error(err)
    }
  }

  function confirmDelete(id: number) {
    setDeleteInstructorId(id)
    setShowDeleteDialog(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Instructor Information</h1>
          <div className="flex space-x-2">
            <Button onClick={fetchInstructors} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/instructors/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Instructor
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-10">
                <User className="h-10 w-10 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No instructors found</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/instructors/create">Add Your First Instructor</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map((instructor) => (
                      <TableRow key={instructor.id}>
                        <TableCell className="font-mono">{instructor.instructor_id}</TableCell>
                        <TableCell className="font-medium">{instructor.name}</TableCell>
                        <TableCell>{instructor.phone_number}</TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>{instructor.specialization || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              instructor.status === "active"
                                ? "bg-green-100 text-green-800"
                                : instructor.status === "inactive"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {instructor.status || "Active"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {instructor.experience_years ? `${instructor.experience_years} years` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {instructor.created_at ? format(new Date(instructor.created_at), "dd/MM/yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/instructors/edit/${instructor.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/instructors/assign-subscriptions/${instructor.id}`}>
                                <Settings className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmDelete(instructor.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the instructor and remove their data from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInstructorId && handleDeleteInstructor(deleteInstructorId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
