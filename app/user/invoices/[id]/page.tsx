"use client"

import { useParams } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { InvoiceGenerator } from "@/components/invoice-generator"

export default function InvoicePage() {
  const params = useParams()
  const paymentId = params.id as string

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Invoice</h1>
        <InvoiceGenerator paymentId={paymentId} />
      </div>
    </UserLayout>
  )
}
