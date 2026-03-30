/**
 * Current writing level (1–5) set by the app after Plan Test.
 * Used by components that call Dify APIs so they can send level in the request.
 * Safe to call during SSR (returns 1 when window is undefined).
 */
export function getCurrentLevel(): number {
  if (typeof window === "undefined") return 1
  try {
    const w = window as unknown as { __cwrite_level?: number }
    const n = w?.__cwrite_level != null ? Number(w.__cwrite_level) : NaN
    return Math.min(5, Math.max(1, Number.isFinite(n) ? n : 1))
  } catch {
    return 1
  }
}
