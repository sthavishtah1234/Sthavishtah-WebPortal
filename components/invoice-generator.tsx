"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Printer } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"

interface InvoiceProps {
  paymentId: string
  onClose?: () => void
}

interface PaymentDetails {
  id: string
  user_id: string
  subscription_id: string
  amount: number
  payment_id: string
  status: string
  payment_date: string
  user: {
    name: string
    email: string
    phone: string
  }
  subscription: {
    name: string
    description: string
    price: number
    duration_days: number
  }
}

export function InvoiceGenerator({ paymentId, onClose }: InvoiceProps) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const invoiceNumber = `INV-${paymentId?.substring(0, 8).toUpperCase()}`
  const invoiceDate = payment?.payment_date ? new Date(payment.payment_date) : new Date()

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!paymentId) return

      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("payments")
          .select(`
            id, 
            user_id, 
            subscription_id, 
            amount, 
            payment_id, 
            status, 
            payment_date,
            user:users(name, email, phone),
            subscription:subscriptions(name, description, price, duration_days)
          `)
          .eq("payment_id", paymentId)
          .single()

        if (error) throw error

        if (data) {
          setPayment(data as PaymentDetails)
        } else {
          setError("Payment not found")
        }
      } catch (err) {
        console.error("Error fetching payment details:", err)
        setError("Failed to load invoice details")
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just trigger the print dialog which can save as PDF
    window.print()
  }

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <p className="text-center mt-4">Loading invoice...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !payment) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-red-500">{error || "Failed to load invoice"}</p>
          {onClose && (
            <div className="flex justify-center mt-4">
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto print:shadow-none" id="invoice-printable">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Invoice</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Receipt for your subscription payment</p>
        </div>
        <div className="print:hidden flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between">
          <div>
            <h3 className="font-semibold">Sthavishtah Yoga</h3>
            <p className="text-sm text-muted-foreground">123 Yoga Street</p>
            <p className="text-sm text-muted-foreground">Wellness City, WC 12345</p>
            <p className="text-sm text-muted-foreground">contact@sthavishtahyoga.com</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Invoice #: {invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">Date: {format(invoiceDate, "dd MMM yyyy")}</p>
            <p className="text-sm text-muted-foreground">Payment ID: {payment.payment_id}</p>
            <p className="text-sm font-medium text-green-600">Status: {payment.status.toUpperCase()}</p>
          </div>
        </div>

        <Separator />

        {/* Customer Information */}
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <p>{payment.user.name}</p>
          <p className="text-sm text-muted-foreground">{payment.user.email}</p>
          <p className="text-sm text-muted-foreground">{payment.user.phone}</p>
        </div>

        <Separator />

        {/* Invoice Items */}
        <div>
          <div className="grid grid-cols-12 font-medium py-2">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Duration</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          <Separator />

          <div className="grid grid-cols-12 py-4">
            <div className="col-span-6">
              <p>{payment.subscription.name}</p>
              <p className="text-sm text-muted-foreground">{payment.subscription.description}</p>
            </div>
            <div className="col-span-2 text-right">{payment.subscription.duration_days} days</div>
            <div className="col-span-2 text-right">{formatCurrency(payment.subscription.price)}</div>
            <div className="col-span-2 text-right">{formatCurrency(payment.amount)}</div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-1/3">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Tax:</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-1 font-bold">
                <span>Total:</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start">
        <p className="text-sm text-muted-foreground">
          Thank you for your business! If you have any questions about this invoice, please contact our customer
          support.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          This is an automatically generated invoice and is valid without a signature.
        </p>
      </CardFooter>
    </Card>
  )
}
