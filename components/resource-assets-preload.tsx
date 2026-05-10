"use client"

import { useEffect } from "react"

const RESOURCE_IMAGES = [
  "/resources.png",
  "/cefr.png",
  "/Longman.png",
  "/srl.png",
] as const

const RESOURCE_AUDIO = [
  "/soundreality-finger-snap-179180.mp3",
  "/yoshiyuki_tatsuya-pixel-hearts-foreverwav-427383.mp3",
] as const

/**
 * 進站後在背景預載 Resource 相關大圖與音效，減少首次打開時白屏等待。
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

    for (const src of RESOURCE_AUDIO) {
      const a = new Audio(src)
      a.preload = "auto"
      void a.load()
    }

    return () => {
      for (const l of links) {
        l.remove()
      }
    }
  }, [])

  return null
}
