"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StudentRoot() {
  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem("studentAuthenticated") === "true"
    if (isAuth) {
      router.replace("/student/dashboard")
    } else {
      router.replace("/student/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
        <p className="font-medium text-emerald-100">Loading Student Portal...</p>
      </div>
    </div>
  )
}
