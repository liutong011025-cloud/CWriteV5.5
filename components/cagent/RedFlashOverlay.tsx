"use client"

import { useEffect, useState } from "react"

interface RedFlashOverlayProps {
  /** When true, show red flash animation on screen edges */
  active: boolean
  /** Duration in ms to show the flash before fading */
  duration?: number
}

export default function RedFlashOverlay({ active, duration = 2000 }: RedFlashOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(t)
  }, [active, duration])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[199] animate-cagent-red-flash"
      aria-hidden
    />
  )
}
