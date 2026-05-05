/**
 * Debug logout with comprehensive logging
 */
export async function debugLogout() {
  try {
    console.log("🔍 STARTING DEBUG LOGOUT...")

    // 1. Check what's stored BEFORE logout
    console.log("📊 BEFORE LOGOUT:")
    console.log("🍪 Cookies:", document.cookie)
    console.log("💾 localStorage:", { ...localStorage })
    console.log("🗂️ sessionStorage:", { ...sessionStorage })

    // 2. Call force clear API
    const clearResponse = await fetch("/api/force-clear-cookies", {
      method: "POST",
      credentials: "include",
    })
    const clearData = await clearResponse.json()
    console.log("🔥 Force clear response:", clearData)

    // 3. Manual client-side clearing
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      if (name) {
        // Clear for multiple paths and domains
        const clearCommands = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sthavishtah.com;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/user;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/admin;`,
        ]
        clearCommands.forEach((cmd) => {
          document.cookie = cmd
        })
      }
    })

    // 4. Clear other storage
    localStorage.clear()
    sessionStorage.clear()

    // 5. Check what's stored AFTER logout
    console.log("📊 AFTER LOGOUT:")
    console.log("🍪 Cookies:", document.cookie)
    console.log("💾 localStorage:", { ...localStorage })
    console.log("🗂️ sessionStorage:", { ...sessionStorage })

    // 6. Wait a bit and check again
    setTimeout(() => {
      console.log("📊 AFTER 1 SECOND:")
      console.log("🍪 Cookies:", document.cookie)
    }, 1000)

    console.log("✅ Debug logout complete")
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Debug logout error:", error)
    window.location.reload()
  }
}
