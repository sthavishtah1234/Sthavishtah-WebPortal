"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function InstructorRoot() {
  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem("instructorAuthenticated") === "true"
    if (isAuth) {
      router.replace("/instructor/dashboard")
    } else {
      router.replace("/instructor/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mb-4"></div>
        <p className="text-green-800 font-medium">Loading Instructor Portal...</p>
      </div>
    </div>
  )
}
