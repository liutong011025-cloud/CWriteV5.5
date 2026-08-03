"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/teacher/dashboard-v2"
import { clearStoredUser, getStoredUser, type ClientAuthUser } from "@/lib/client-auth"

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<ClientAuthUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700 font-semibold">
        Loading…
      </div>
    )
  }

  return (
    <main data-stage="dashboard">
      <Dashboard
        user={user}
        onBack={() => {
          clearStoredUser()
          router.replace("/")
        }}
      />
    </main>
  )
}
