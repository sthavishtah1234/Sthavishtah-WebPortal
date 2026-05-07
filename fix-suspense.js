// Script to automatically wrap useSearchParams in Suspense boundaries
// Run with: node fix-suspense.js

const fs = require('fs')
const path = require('path')

const filesToFix = [
  'app/user/login/page.tsx',
  'app/verify-phone/page.tsx',
  'app/auto-login/page.tsx',
  'app/user/register/page.tsx',
  'app/user/subscribe/page.tsx',
  'app/user/plans/page.tsx',
  'app/user/access-course/page.tsx',
  'app/user/subscription-categories/[slug]/page.tsx',
  'app/plans/page.tsx',
  'app/events/page.tsx',
  'app/admin/test-pose-live/page.tsx',
  'app/admin/documents/page.tsx',
]

const FALLBACK_JSX = `        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>`

let fixedCount = 0
let errorCount = 0

for (const relPath of filesToFix) {
  const fullPath = path.join(__dirname, relPath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP (not found): ${relPath}`)
    continue
  }

  let content = fs.readFileSync(fullPath, 'utf8')

  // Skip if already fixed
  if (content.includes('<Suspense') || content.includes('Suspense')) {
    console.log(`✅ Already has Suspense: ${relPath}`)
    continue
  }

  // Find the default export function name
  const exportMatch = content.match(/export default function (\w+)/)
  if (!exportMatch) {
    console.log(`⚠️  SKIP (no default export found): ${relPath}`)
    continue
  }
  const originalName = exportMatch[1]
  const innerName = originalName + 'Content'

  // Add Suspense to React import
  content = content.replace(
    /import \{ ([^}]+) \} from "react"/,
    (match, imports) => {
      if (imports.includes('Suspense')) return match
      return `import { ${imports}, Suspense } from "react"`
    }
  )
  // Handle single import like: import { useEffect } from "react"
  // also try single quotes
  content = content.replace(
    /import \{ ([^}]+) \} from 'react'/,
    (match, imports) => {
      if (imports.includes('Suspense')) return match
      return `import { ${imports}, Suspense } from 'react'`
    }
  )

  // If no React import found at all, add one at the top after "use client"
  if (!content.includes(`from "react"`) && !content.includes(`from 'react'`)) {
    content = content.replace(`"use client"`, `"use client"\n\nimport { Suspense } from "react"`)
  }

  // Rename default export to inner content component
  content = content.replace(
    `export default function ${originalName}`,
    `function ${innerName}`
  )

  // Remove trailing newline/whitespace at the end and append wrapper
  content = content.trimEnd()

  const wrapper = `

export default function ${originalName}() {
  return (
    <Suspense
      fallback={
${FALLBACK_JSX}
      }
    >
      <${innerName} />
    </Suspense>
  )
}
`
  content += wrapper

  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`✅ Fixed: ${relPath}`)
  fixedCount++
}

console.log(`\nDone! Fixed ${fixedCount} files, ${errorCount} errors.`)
