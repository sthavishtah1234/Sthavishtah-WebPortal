import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

async function fetchCourseContent(courseId: string) {
  const supabase = createServerComponentClient({ cookies })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the course details
  const { data: course, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

  if (error || !course) return null

  // Check if user is enrolled in this course
  const { data: userCourse } = await supabase
    .from("user_courses")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!userCourse) return null

  // Fetch course modules
  const { data: modules } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sequence_number", { ascending: true })

  if (!modules) return { course, modules: [] }

  // Fetch content for each module
  const modulesWithContent = await Promise.all(
    modules.map(async (module) => {
      const { data: content } = await supabase
        .from("course_content")
        .select("*")
        .eq("module_id", module.id)
        .order("sequence_number", { ascending: true })

      // Fetch user progress for each content item
      const contentWithProgress = await Promise.all(
        (content || []).map(async (item) => {
          const { data: progress } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("content_id", item.id)
            .single()

          return {
            ...item,
            progress: progress || null,
          }
        }),
      )

      return {
        ...module,
        content: contentWithProgress,
      }
    }),
  )

  return {
    course,
    modules: modulesWithContent,
  }
}

async function CourseContentPage({ courseId }: { courseId: string }) {
  const data = await fetchCourseContent(courseId)

  if (!data) {
    notFound()
  }

  const { course, modules } = data

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-600">{course.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Course Content</h2>

        {modules.length > 0 ? (
          <div className="space-y-8">
            {modules.map((module) => (
              <div key={module.id} className="border-b pb-6 last:border-b-0">
                <h3 className="text-xl font-medium mb-4">{module.title}</h3>
                <p className="text-gray-600 mb-4">{module.description}</p>

                {module.content && module.content.length > 0 ? (
                  <div className="space-y-3">
                    {module.content.map((content) => (
                      <div
                        key={content.id}
                        className={`border rounded-md p-4 ${
                          content.progress?.is_completed ? "bg-green-50 border-green-200" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{content.title}</h4>
                            <p className="text-sm text-gray-500">
                              {content.content_type === "video"
                                ? `Video • ${content.duration_minutes} min`
                                : content.content_type}
                            </p>
                          </div>

                          <div className="flex items-center">
                            {content.progress?.is_completed && <span className="text-green-600 mr-3">✓ Completed</span>}

                            <Link
                              href={`/user/video-player/${content.id}`}
                              className={`px-4 py-2 rounded-md ${
                                content.content_type === "video"
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              }`}
                            >
                              {content.content_type === "video" ? "Watch Video" : "View Content"}
                            </Link>
                          </div>
                        </div>

                        {content.progress &&
                          !content.progress.is_completed &&
                          content.progress.progress_percentage > 0 && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${content.progress.progress_percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {content.progress.progress_percentage}% complete
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No content available for this module.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No modules available for this course yet.</p>
        )}
      </div>
    </div>
  )
}

export default function CourseContentWrapper({ params }: { params: { courseId: string } }) {
  return (
    <Suspense fallback={<div className="container mx-auto p-8">Loading course content...</div>}>
      <CourseContentPage courseId={params.courseId} />
    </Suspense>
  )
}
