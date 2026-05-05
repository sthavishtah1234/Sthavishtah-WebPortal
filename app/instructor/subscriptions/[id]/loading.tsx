import { InstructorLayout } from "@/components/instructor-layout"
import { Card } from "@/components/ui/card"

export default function SubscriptionDetailLoading() {
  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-md"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <div className="p-6">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </Card>

          <div className="md:col-span-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded-md mb-4"></div>
            <Card className="animate-pulse">
              <div className="p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </InstructorLayout>
  )
}
