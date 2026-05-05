import { InstructorLayout } from "@/components/instructor-layout"

export default function Loading() {
  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>

        <div className="space-y-4">
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    </InstructorLayout>
  )
}
