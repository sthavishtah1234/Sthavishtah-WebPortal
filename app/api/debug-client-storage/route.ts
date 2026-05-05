import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Use this in browser console",
    script: `
// Run this in browser console to see ALL storage
console.log("🔍 DEBUGGING CLIENT STORAGE...");

// 1. All cookies
console.log("🍪 ALL COOKIES:", document.cookie);

// 2. Parse cookies into object
const cookies = {};
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name) cookies[name] = value;
});
console.log("🍪 PARSED COOKIES:", cookies);

// 3. localStorage
console.log("💾 LOCAL STORAGE:", {...localStorage});

// 4. sessionStorage  
console.log("🗂️ SESSION STORAGE:", {...sessionStorage});

// 5. Check for specific auth values
console.log("🔐 AUTH CHECK:", {
  userId: cookies.userId || localStorage.getItem('userId') || sessionStorage.getItem('userId'),
  userToken: cookies.userToken || localStorage.getItem('userToken') || sessionStorage.getItem('userToken'),
  authToken: cookies.authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken'),
});

// 6. IndexedDB check
if ('indexedDB' in window) {
  indexedDB.databases().then(dbs => {
    console.log("🗄️ INDEXED DB:", dbs);
  });
}
    `,
  })
}
