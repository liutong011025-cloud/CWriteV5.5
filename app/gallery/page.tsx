"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GalleryRoute() {
  const router = useRouter()
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("navigateToGallery"))
    } catch {
      // ignore
    }
    router.replace("/")
  }, [router])

  return <div style={{ padding: 24 }}>Loading…</div>
}

