import { AdminLayout } from "@/components/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function SubscriptionDashboardLoading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Subscription Overview Card skeleton */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-8 w-48 bg-white bg-opacity-20" />
                <Skeleton className="h-4 w-32 mt-2 bg-white bg-opacity-20" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-20 bg-white bg-opacity-20" />
                <Skeleton className="h-6 w-20 bg-white bg-opacity-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-4">
            <div className="flex flex-wrap gap-2 w-full">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardFooter>
        </Card>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-[600px]" />

          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
                <CardFooter className="pt-0">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
