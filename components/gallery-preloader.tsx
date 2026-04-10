"use client"

import { useEffect } from "react"
import { preloadGalleryData } from "@/lib/use-gallery-data"

// This component preloads gallery data when the app mounts
// It renders nothing but triggers the data fetch early
export default function GalleryPreloader() {
  useEffect(() => {
    // Preload gallery data immediately when app starts
    preloadGalleryData()
  }, [])

  return null
}
