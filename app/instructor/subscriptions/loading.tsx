import { InstructorLayout } from "@/components/instructor-layout"
import { Card } from "@/components/ui/card"

export default function SubscriptionsLoading() {
  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24 rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="bg-gray-100 h-16 rounded-b-lg"></div>
            </Card>
          ))}
        </div>
      </div>
    </InstructorLayout>
  )
}
