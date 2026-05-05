"use client"

import { useEffect, useState } from "react"

export default function FaviconTest() {
  const [faviconStatus, setFaviconStatus] = useState<{
    ico: string
    png: string
  }>({
    ico: "checking...",
    png: "checking...",
  })

  useEffect(() => {
    // Test if favicon files exist
    const testFavicon = async (url: string, type: "ico" | "png") => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          setFaviconStatus((prev) => ({
            ...prev,
            [type]: "✅ Found",
          }))
        } else {
          setFaviconStatus((prev) => ({
            ...prev,
            [type]: "❌ Not found",
          }))
        }
      } catch (error) {
        setFaviconStatus((prev) => ({
          ...prev,
          [type]: "❌ Error loading",
        }))
      }
    }

    testFavicon("/favicon.ico", "ico")
    testFavicon("/favicon.png", "png")
  }, [])

  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Favicon Test Page</h1>

          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Favicon Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>favicon.ico:</span>
                  <span className="font-mono">{faviconStatus.ico}</span>
                </div>
                <div className="flex justify-between">
                  <span>favicon.png:</span>
                  <span className="font-mono">{faviconStatus.png}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Current Favicon Links</h2>
              <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                <div>&lt;link rel="icon" href="/favicon.ico" sizes="any" /&gt;</div>
                <div>&lt;link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" /&gt;</div>
                <div>&lt;link rel="shortcut icon" href="/favicon.ico" /&gt;</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Hard refresh this page (Ctrl+F5 or Cmd+Shift+R)</li>
                <li>Clear browser cache completely</li>
                <li>Check if favicon files exist in /public folder</li>
                <li>
                  Try opening favicon directly:{" "}
                  <a href="/favicon.ico" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    /favicon.ico
                  </a>
                </li>
                <li>
                  Try opening favicon directly:{" "}
                  <a href="/favicon.png" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    /favicon.png
                  </a>
                </li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button onClick={refreshPage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Refresh Page
              </button>
              <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
