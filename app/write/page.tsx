"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WriteRoute() {
  const router = useRouter()
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("navigateToWriteTypeSelection"))
    } catch {
      // ignore
    }
    router.replace("/")
  }, [router])

  return <div style={{ padding: 24 }}>Loading…</div>
}

