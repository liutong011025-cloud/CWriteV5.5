import PublicLoginEntry from "@/components/auth/public-login-entry"

// Root `/` must live at app/page.tsx (not app/(public)/page.tsx) — Next.js 16
// can fail prerender with missing client-reference-manifest for route-group roots.
export const dynamic = "force-dynamic"

export default function Page() {
  return <PublicLoginEntry />
}
