import { InstructorLayout } from "@/components/instructor-layout"

export default function Loading() {
  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </InstructorLayout>
  )
}
