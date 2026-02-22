/**
 * Current writing level (1–5) set by the app after Plan Test.
 * Used by components that call Dify APIs so they can send level in the request.
 */
declare global {
  interface Window {
    __cwrite_level?: number
  }
}

export function getCurrentLevel(): number {
  if (typeof window === "undefined") return 1
  const n = Number(window.__cwrite_level)
  return Math.min(5, Math.max(1, Number.isFinite(n) ? n : 1))
}
