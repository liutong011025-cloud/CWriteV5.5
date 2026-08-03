/**
 * Next.js 16 breaks when both app/page.tsx and app/(public)/page.tsx map to "/".
 * Vercel uploads sometimes leave the old route group behind — delete it before build.
 */
const fs = require("node:fs")
const path = require("node:path")

const root = process.cwd()
const publicGroup = path.join(root, "app", "(public)")
const rootPage = path.join(root, "app", "page.tsx")

if (!fs.existsSync(rootPage)) {
  console.error("[prebuild] Missing app/page.tsx — root login route is required.")
  process.exit(1)
}

if (fs.existsSync(publicGroup)) {
  fs.rmSync(publicGroup, { recursive: true, force: true })
  console.log("[prebuild] Removed leftover app/(public) to avoid Next.js route-manifest crash.")
} else {
  console.log("[prebuild] OK: no app/(public) route group.")
}
