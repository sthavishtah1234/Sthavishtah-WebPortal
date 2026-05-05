import { UserLayout } from "@/components/user-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function SubscribeLoading() {
  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-8 w-64 mb-6" />

          <div className="border rounded-lg overflow-hidden mb-6">
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="text-center">
            <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
