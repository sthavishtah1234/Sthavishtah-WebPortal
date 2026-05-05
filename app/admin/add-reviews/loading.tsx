import { AdminLayout } from "@/components/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function AddReviewsLoading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Random Reviews</h1>
          <p className="text-muted-foreground">Generate and add random reviews to populate your database.</p>
        </div>

        <div className="w-full max-w-3xl mx-auto">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    </AdminLayout>
  )
}
