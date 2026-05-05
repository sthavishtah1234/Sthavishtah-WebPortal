import { AdminLayout } from "@/components/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-full max-w-[500px]" />

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>

        <Skeleton className="h-[200px] w-full" />
      </div>
    </AdminLayout>
  )
}
