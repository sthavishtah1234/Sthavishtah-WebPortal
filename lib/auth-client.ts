/**
 * 🔐 CLIENT-SIDE AUTHENTICATION UTILITIES
 * Secure authentication functions for both admin and user sessions
 */

/**
 * 🚪 SECURE LOGOUT FUNCTION
 * Completely clears ALL storage and redirects safely
 */
export async function logout() {
  try {
    console.log("🔐 Starting secure logout...")

    // 1. Call server-side logout API
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        console.warn("⚠️ Server logout failed, continuing with client cleanup")
      }
    } catch (apiError) {
      console.warn("⚠️ Logout API error, continuing with client cleanup:", apiError)
    }

    // 2. 🧹 COMPLETE CLIENT-SIDE CLEANUP

    // Clear ALL localStorage (including admin passwords, user data, etc.)
    localStorage.clear()

    // Clear ALL sessionStorage
    sessionStorage.clear()

    // Clear ALL cookies manually
    if (typeof document !== "undefined") {
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.trim().split("=")
        if (name) {
          // Clear for multiple paths and domains
          const clearCommands = [
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/user;`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/admin;`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/instructor;`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/student;`,
          ]
          clearCommands.forEach((cmd) => {
            document.cookie = cmd
          })
        }
      })
    }

    // 3. Clear any cached data
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }

    console.log("✅ Secure logout complete - all data cleared")

    // 4. Redirect to home page
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  } catch (error) {
    console.error("❌ Logout error:", error)
    // Force redirect even if cleanup fails
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }
}

/**
 * 🔍 CHECK USER AUTHENTICATION STATUS
 * Secure way to check if user is logged in
 */
export function isUserLoggedIn(): boolean {
  try {
    if (typeof window === "undefined") return false
    const userId = localStorage.getItem("userId")
    const userAuthenticated = localStorage.getItem("userAuthenticated")
    return !!(userId && userAuthenticated === "true")
  } catch {
    return false
  }
}

/**
 * 🔍 CHECK ADMIN AUTHENTICATION STATUS
 * Secure way to check if admin is logged in - using same method as before
 */
export function isAdminLoggedIn(): boolean {
  try {
    if (typeof window === "undefined") return false
    const adminPassword = localStorage.getItem("adminPassword")
    const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"
    return adminPassword === validPassword
  } catch {
    return false
  }
}

/**
 * 🔍 CHECK INSTRUCTOR AUTHENTICATION STATUS
 * Secure way to check if instructor is logged in
 */
export function isInstructorLoggedIn(): boolean {
  try {
    if (typeof window === "undefined") return false
    const instructorId = localStorage.getItem("instructorId")
    const instructorAuthenticated = localStorage.getItem("instructorAuthenticated")
    return !!(instructorId && instructorAuthenticated === "true")
  } catch {
    return false
  }
}

/**
 * 🔍 CHECK STUDENT AUTHENTICATION STATUS
 * Secure way to check if student is logged in
 */
export function isStudentLoggedIn(): boolean {
  try {
    if (typeof window === "undefined") return false
    const studentId = localStorage.getItem("studentId")
    const studentAuthenticated = localStorage.getItem("studentAuthenticated")
    return !!(studentId && studentAuthenticated === "true")
  } catch {
    return false
  }
}

/**
 * 🎓 GET CURRENT STUDENT ID
 * Returns the current student's ID if logged in
 */
export function getCurrentStudentId(): string | null {
  try {
    if (isStudentLoggedIn()) {
      return localStorage.getItem("studentId")
    }
    return null
  } catch {
    return null
  }
}

/**
 * 🔐 SET STUDENT AUTHENTICATION
 * Securely store student authentication data
 */
export function setStudentAuth(studentId: string, studentData?: any): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("studentId", studentId)
    localStorage.setItem("studentAuthenticated", "true")

    if (studentData) {
      localStorage.setItem("studentData", JSON.stringify(studentData))
    }

    console.log("✅ Student authentication set")
  } catch (error) {
    console.error("❌ Error setting student auth:", error)
  }
}

/**
 * 🧹 CLEAR STUDENT AUTHENTICATION
 * Clear only student-related authentication data
 */
export function clearStudentAuth(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem("studentId")
    localStorage.removeItem("studentAuthenticated")
    localStorage.removeItem("studentData")
    localStorage.removeItem("studentName")
    localStorage.removeItem("studentEmail")
    localStorage.removeItem("studentPhone")
    console.log("✅ Student authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing student auth:", error)
  }
}

/**
 * 🔍 GET STUDENT DATA
 * Get stored student data if available
 */
export function getStudentData(): any | null {
  try {
    if (typeof window === "undefined") return null
    const studentData = localStorage.getItem("studentData")
    return studentData ? JSON.parse(studentData) : null
  } catch {
    return null
  }
}

/**
 * 👤 GET CURRENT USER ID
 * Returns the current user's ID if logged in
 */
export function getCurrentUserId(): string | null {
  try {
    if (isUserLoggedIn()) {
      return localStorage.getItem("userId")
    }
    return null
  } catch {
    return null
  }
}

/**
 * 👨‍🏫 GET CURRENT INSTRUCTOR ID
 * Returns the current instructor's ID if logged in
 */
export function getCurrentInstructorId(): string | null {
  try {
    if (isInstructorLoggedIn()) {
      return localStorage.getItem("instructorId")
    }
    return null
  } catch {
    return null
  }
}

/**
 * 🔐 SET USER AUTHENTICATION
 * Securely store user authentication data
 */
export function setUserAuth(userId: string, userData?: any): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("userId", userId)
    localStorage.setItem("userAuthenticated", "true")

    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData))
    }

    console.log("✅ User authentication set")
  } catch (error) {
    console.error("❌ Error setting user auth:", error)
  }
}

/**
 * 🔐 SET INSTRUCTOR AUTHENTICATION
 * Securely store instructor authentication data
 */
export function setInstructorAuth(instructorId: string, instructorData?: any): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("instructorId", instructorId)
    localStorage.setItem("instructorAuthenticated", "true")

    if (instructorData) {
      localStorage.setItem("instructorData", JSON.stringify(instructorData))
    }

    console.log("✅ Instructor authentication set")
  } catch (error) {
    console.error("❌ Error setting instructor auth:", error)
  }
}

/**
 * 🔐 SET ADMIN AUTHENTICATION
 * Securely store admin authentication data - using same method as before
 */
export function setAdminAuth(password: string): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("adminPassword", password)
    console.log("✅ Admin authentication set")
  } catch (error) {
    console.error("❌ Error setting admin auth:", error)
  }
}

/**
 * 🧹 CLEAR USER AUTHENTICATION
 * Clear only user-related authentication data
 */
export function clearUserAuth(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem("userId")
    localStorage.removeItem("userAuthenticated")
    localStorage.removeItem("userData")
    console.log("✅ User authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing user auth:", error)
  }
}

/**
 * 🧹 CLEAR INSTRUCTOR AUTHENTICATION
 * Clear only instructor-related authentication data
 */
export function clearInstructorAuth(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem("instructorId")
    localStorage.removeItem("instructorAuthenticated")
    localStorage.removeItem("instructorData")
    console.log("✅ Instructor authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing instructor auth:", error)
  }
}

/**
 * 🧹 CLEAR ADMIN AUTHENTICATION
 * Clear only admin-related authentication data
 */
export function clearAdminAuth(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem("adminPassword")
    console.log("✅ Admin authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing admin auth:", error)
  }
}

/**
 * 🏠 SAFE HOME NAVIGATION
 * Navigate to home without logout
 */
export function navigateToHome(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
}

/**
 * 🔄 REDIRECT TO LOGIN
 * Redirect to appropriate login page with return URL
 */
export function redirectToLogin(returnUrl?: string, userType: "user" | "admin" | "instructor" = "user"): void {
  if (typeof window === "undefined") return

  const loginPaths: Record<string, string> = {
    user: "/user/login",
    admin: "/admin/login",
    instructor: "/instructor/login",
    student: "/student/login",
  }

  const loginPath = loginPaths[userType] || "/user/login"
  const redirectUrl = returnUrl ? `${loginPath}?redirect=${encodeURIComponent(returnUrl)}` : loginPath

  window.location.href = redirectUrl
}

/**
 * 🔍 GET USER DATA
 * Get stored user data if available
 */
export function getUserData(): any | null {
  try {
    if (typeof window === "undefined") return null
    const userData = localStorage.getItem("userData")
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

/**
 * 🔍 GET INSTRUCTOR DATA
 * Get stored instructor data if available
 */
export function getInstructorData(): any | null {
  try {
    if (typeof window === "undefined") return null
    const instructorData = localStorage.getItem("instructorData")
    return instructorData ? JSON.parse(instructorData) : null
  } catch {
    return null
  }
}

/**
 * 🔒 CHECK IF ANY USER IS LOGGED IN
 * Check if any type of user (user, admin, instructor) is logged in
 */
export function isAnyUserLoggedIn(): boolean {
  return isUserLoggedIn() || isAdminLoggedIn() || isInstructorLoggedIn() || isStudentLoggedIn()
}

/**
 * 🎯 GET CURRENT USER TYPE
 * Returns the type of currently logged in user
 */
export function getCurrentUserType(): "user" | "admin" | "instructor" | "student" | null {
  if (isAdminLoggedIn()) return "admin"
  if (isInstructorLoggedIn()) return "instructor"
  if (isStudentLoggedIn()) return "student"
  if (isUserLoggedIn()) return "user"
  return null
}

/**
 * 🔄 AUTO-REDIRECT BASED ON AUTH
 * Automatically redirect based on current authentication status
 */
export function autoRedirectBasedOnAuth(currentPath: string): void {
  if (typeof window === "undefined") return

  const userType = getCurrentUserType()

  if (!userType) {
    // Not logged in, redirect to appropriate login
    if (currentPath.startsWith("/admin")) {
      redirectToLogin(currentPath, "admin")
    } else if (currentPath.startsWith("/instructor")) {
      redirectToLogin(currentPath, "instructor")
    } else if (currentPath.startsWith("/student")) {
      redirectToLogin(currentPath, "student")
    } else if (currentPath.startsWith("/user")) {
      redirectToLogin(currentPath, "user")
    }
    return
  }

  // Logged in, check if accessing correct area
  if (userType === "admin" && !currentPath.startsWith("/admin")) {
    window.location.href = "/admin/dashboard"
  } else if (userType === "instructor" && !currentPath.startsWith("/instructor")) {
    window.location.href = "/instructor/dashboard"
  } else if (userType === "student" && !currentPath.startsWith("/student")) {
    window.location.href = "/student/dashboard"
  } else if (userType === "user" && currentPath.startsWith("/admin")) {
    window.location.href = "/user/dashboard"
  }
}
