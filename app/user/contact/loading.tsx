import { UserLayout } from "@/components/user-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContactLoading() {
  return (
    <UserLayout>
      <div className="space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-full max-w-[500px]" />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-[100px] mb-4" />
            <Skeleton className="h-4 w-[200px]" />
          </div>

          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-[120px] mb-4" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </UserLayout>
  )
}
