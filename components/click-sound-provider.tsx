"use client"

import { useEffect, useRef } from "react"

/**
 * 全局點擊音效提供者：
 * - 掛在 root layout 中
 * - 監聽整個 document 的點擊事件
 * - 播放 /click.MP3（放在 public/click.MP3）
 */
export default function ClickSoundProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const audio = new Audio("/click.MP3")
    audio.preload = "auto"
    audio.volume = 0.25
    audioRef.current = audio

    // Check if audio can be loaded
    audio.addEventListener("canplaythrough", () => {
      isLoadedRef.current = true
    })

    audio.addEventListener("error", () => {
      // Audio file not found or not supported - disable sound
      isLoadedRef.current = false
    })

    const handleClick = () => {
      if (!isLoadedRef.current || !audioRef.current) return
      
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Silently ignore play errors (e.g., browser autoplay policy)
      })
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  return null
}
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  return null
}

