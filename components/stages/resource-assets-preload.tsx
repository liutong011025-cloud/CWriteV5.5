"use client"

import { useEffect } from "react"

const RESOURCE_IMAGES = [
  "/resources.png",
  "/cefr.png",
  "/Longman.png",
  "/srl.png",
] as const

const HOVER_SOUND = "/bit.mp3"

/**
 * 進站後在背景預載 Resource 相關大圖與懸浮音效，減少首次打開時白屏等待。
 */
export default function ResourceAssetsPreload() {
  useEffect(() => {
    const links: HTMLLinkElement[] = []
    for (const href of RESOURCE_IMAGES) {
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = href
      document.head.appendChild(link)
      links.push(link)
    }

    const audio = new Audio(HOVER_SOUND)
    audio.preload = "auto"
    void audio.load()

    return () => {
      for (const l of links) {
        l.remove()
      }
    }
  }, [])

  return null
}
