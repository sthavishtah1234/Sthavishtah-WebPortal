import AdminLayout from "@/components/admin-layout"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </div>
    </AdminLayout>
  )
}
