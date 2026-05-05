import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      {/* Back Button Skeleton */}
      <Skeleton className="h-10 w-32 mb-6" />

      {/* Hero Section Skeleton */}
      <Skeleton className="h-64 md:h-80 w-full rounded-lg mb-8" />

      {/* Introduction Skeleton */}
      <div className="text-center max-w-4xl mx-auto mb-8">
        <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3 mx-auto" />
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-6 w-6 mx-auto mb-3" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        ))}
      </div>

      {/* Content Sections Skeleton */}
      <div className="mb-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-1/3 mx-auto mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Plans Skeleton */}
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-1/3 mx-auto mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <Skeleton className="h-2 w-full" />
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
