"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"

interface UnrecordedPayment {
  id: string
  payment_id: string
  order_id: string
  amount: number
  email: string
  contact: string
  created_at: string
  status: string
}

export default function PaymentRecoveryPage() {
  const [loading, setLoading] = useState(true)
  const [unrecordedPayments, setUnrecordedPayments] = useState<UnrecordedPayment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUnrecordedPayments()
  }, [])

  async function fetchUnrecordedPayments() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/payment-recovery")

      if (!response.ok) {
        throw new Error(`Error fetching unrecorded payments: ${response.statusText}`)
      }

      const data = await response.json()
      setUnrecordedPayments(data.unrecordedPayments || [])
    } catch (err) {
      console.error("Error fetching unrecorded payments:", err)
      setError(err.message || "Failed to fetch unrecorded payments")
    } finally {
      setLoading(false)
    }
  }

  async function syncPayment(paymentId: string) {
    try {
      setSyncStatus((prev) => ({ ...prev, [paymentId]: "syncing" }))

      const response = await fetch(`/api/payment-recovery/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId }),
      })

      if (!response.ok) {
        throw new Error(`Error syncing payment: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSyncStatus((prev) => ({ ...prev, [paymentId]: "success" }))
        // Remove the synced payment from the list
        setUnrecordedPayments((prev) => prev.filter((p) => p.payment_id !== paymentId))
      } else {
        throw new Error(data.error || "Failed to sync payment")
      }
    } catch (err) {
      console.error("Error syncing payment:", err)
      setSyncStatus((prev) => ({ ...prev, [paymentId]: "error" }))
      setError(err.message || "Failed to sync payment")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payment Recovery</h1>
          <Button onClick={fetchUnrecordedPayments} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Unrecorded Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
              </div>
            ) : unrecordedPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No unrecorded payments found.</p>
                <p className="text-sm mt-2">All Razorpay payments have been properly recorded in your database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Payment ID</th>
                      <th className="py-3 px-4 text-left">Order ID</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">Customer</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unrecordedPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{payment.payment_id}</td>
                        <td className="py-3 px-4">{payment.order_id}</td>
                        <td className="py-3 px-4">₹{payment.amount / 100}</td>
                        <td className="py-3 px-4">
                          <div>{payment.email}</div>
                          <div className="text-xs text-gray-500">{payment.contact}</div>
                        </td>
                        <td className="py-3 px-4">{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            onClick={() => syncPayment(payment.payment_id)}
                            disabled={syncStatus[payment.payment_id] === "syncing"}
                            variant={
                              syncStatus[payment.payment_id] === "success"
                                ? "outline"
                                : syncStatus[payment.payment_id] === "error"
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {syncStatus[payment.payment_id] === "syncing" ? (
                              <>
                                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                Syncing...
                              </>
                            ) : syncStatus[payment.payment_id] === "success" ? (
                              "Synced"
                            ) : syncStatus[payment.payment_id] === "error" ? (
                              "Failed"
                            ) : (
                              "Sync"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Payment Recovery Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                This tool helps you recover payments that were successful in Razorpay but weren't recorded in your
                database due to redirect failures or webhook issues.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">1. Fetch Payments</h3>
                  <p className="text-sm text-gray-600">
                    The system fetches all successful payments from Razorpay and compares them with your database.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">2. Identify Missing</h3>
                  <p className="text-sm text-gray-600">
                    Payments that exist in Razorpay but not in your database are displayed in the table above.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">3. Sync Payments</h3>
                  <p className="text-sm text-gray-600">
                    Click "Sync" to add the payment to your database and activate the corresponding subscription.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
