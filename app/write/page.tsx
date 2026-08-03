"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy stub → canonical student writing route */
export default function WriteRoute() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/writing")
  }, [router])

  return <div style={{ padding: 24 }}>Loading…</div>
}
