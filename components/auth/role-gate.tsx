"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  getPostLoginPath,
  getStoredUser,
  isStudentUser,
  isTeacherUser,
  type ClientAuthUser,
} from "@/lib/client-auth"

type RoleGateProps = {
  allow: "student" | "teacher"
  children: ReactNode
}

export default function RoleGate({ allow, children }: RoleGateProps) {
  const router = useRouter()
  const [user, setUser] = useState<ClientAuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = getStoredUser()
    if (!stored) {
      router.replace("/")
      return
    }

    if (allow === "student" && !isStudentUser(stored)) {
      router.replace(getPostLoginPath(stored))
      return
    }

    if (allow === "teacher" && !isTeacherUser(stored)) {
      router.replace(getPostLoginPath(stored))
      return
    }

    setUser(stored)
    setReady(true)
  }, [allow, router])

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700 font-semibold">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
