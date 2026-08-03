export type ClientAuthUser = {
  username: string
  role: "teacher" | "student"
  noAi?: boolean
  isCopywriter?: boolean
}

export const CWRITE_USER_KEY = "cwriteUser"

export function getStoredUser(): ClientAuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CWRITE_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ClientAuthUser
    if (!parsed?.username || (parsed.role !== "teacher" && parsed.role !== "student")) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setStoredUser(user: ClientAuthUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CWRITE_USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CWRITE_USER_KEY)
}

/** Post-login destination by role (copywriting stays in student space). */
export function getPostLoginPath(user: ClientAuthUser): string {
  if (user.username === "copywriting") return "/my-farm"
  if (user.role === "teacher") return "/teacher/dashboard"
  return "/my-farm"
}

export function isStudentUser(user: ClientAuthUser | null): boolean {
  if (!user) return false
  if (user.username === "copywriting") return true
  return user.role === "student"
}

export function isTeacherUser(user: ClientAuthUser | null): boolean {
  if (!user) return false
  if (user.username === "copywriting") return false
  return user.role === "teacher"
}
