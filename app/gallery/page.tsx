"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy stub → canonical student library route */
export default function GalleryRoute() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/library")
  }, [router])

  return <div style={{ padding: 24 }}>Loading…</div>
}
