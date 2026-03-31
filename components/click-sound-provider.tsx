"use client"

import { useEffect } from "react"

/**
 * 全局點擊音效提供者：
 * - 掛在 root layout 中
 * - 監聽整個 document 的點擊事件
 * - 播放 /click.MP3（放在 public/click.MP3）
 */
export default function ClickSoundProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const audio = new Audio("/click.MP3")
    audio.preload = "auto"
    audio.volume = 0.25

    const handleClick = (event: MouseEvent) => {
      // Allow specific buttons to override global click sound.
      const target = event.target as HTMLElement | null
      if (target?.closest?.('[data-click-sound="start-journey"]')) return
      if (target?.closest?.('[data-click-sound="visit-farm"]')) return
      try {
        audio.currentTime = 0
        void audio.play()
      } catch {
        // 忽略播放錯誤（例如瀏覽器還未允許音訊）
      }
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  return null
}

