import { Skeleton } from "@/components/ui/skeleton"

export default function BrochureLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <Skeleton className="h-20 w-full bg-green-800/20" />
        <div className="p-8">
          <Skeleton className="h-32 w-32 rounded-full mx-auto mb-6 bg-green-100" />
          <Skeleton className="h-12 w-3/4 mx-auto mb-4 bg-green-100" />
          <Skeleton className="h-6 w-1/2 mx-auto mb-8 bg-green-100" />
          <Skeleton className="h-24 w-full mx-auto mb-8 bg-gray-100" />
          <Skeleton className="h-12 w-48 mx-auto rounded-full bg-green-100" />
        </div>
      </div>
    </div>
  )
}
