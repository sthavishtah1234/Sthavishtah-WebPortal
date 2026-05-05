import { AdminLayout } from "@/components/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function LoadingEditSubscription() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name field */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Price field */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Toggle */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>

            {/* Duration field */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Settings section */}
            <div className="space-y-4 pt-4 border-t">
              <Skeleton className="h-6 w-40" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
