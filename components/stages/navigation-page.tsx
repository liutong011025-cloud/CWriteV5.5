"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BackButton } from "@/components/ui/back-button"

interface FriendFarm {
  name: string
}

interface NavigationPageProps {
  onBack?: () => void
  onSelectFarm?: (friendName: string) => void
  currentUsername?: string
}

const FRIEND_NAMES = [
  "Stark",
  "Banner",
  "Rogers",
  "Parker",
  "Romanoff",
  "Barton",
  "Odinson",
  "Maximoff",
  "Lang",
  "Strange",
  "Fury",
  "Groot",
  "Rocket",
  "Quill",
  "Drax",
  "Gamora",
  "Thanos",
  "Loki",
  "halk",
  "Wayne",
  "Kent",
  "Queen",
  "Allen",
  "Barbara",
  "Diana",
  "Selina",
  "Lex",
  "Luthor",
]

/** 與 object-cover 背景對齊的 overlay 矩形（px） */
interface CoverOverlayRect {
  width: number
  height: number
  left: number
  top: number
}

export default function NavigationPage({ onBack, onSelectFarm, currentUsername }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [coverOverlayRect, setCoverOverlayRect] = useState<CoverOverlayRect | null>(null)

  const updateCoverOverlayRect = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const s = Math.max(cw / iw, ch / ih)
    setCoverOverlayRect({
      width: s * iw,
      height: s * ih,
      left: -(s * iw - cw) / 2,
      top: -(s * ih - ch) / 2,
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!img || !container) return
    if (img.complete && img.naturalWidth) updateCoverOverlayRect()
    img.addEventListener("load", updateCoverOverlayRect)
    window.addEventListener("resize", updateCoverOverlayRect)
    const ro = new ResizeObserver(updateCoverOverlayRect)
    ro.observe(container)
    return () => {
      img.removeEventListener("load", updateCoverOverlayRect)
      window.removeEventListener("resize", updateCoverOverlayRect)
      ro.disconnect()
    }
  }, [updateCoverOverlayRect])

  // 固定為你提供的最終位置（相對背景圖的 %）
  const rectLeft = 74.5 // 百分比，0-100
  const rectTop = 32.0 // 百分比，0-100
  const rectWidth = 38.5 // 百分比，0-100
  const listOffset = 4 // 文本下方展開列表的間距（px）
  const listWidthPercent = 41 // 列表寬度相對於外層容器（百分比）

  // 所有好友均可访问，但不包含當前用戶名（如有）
  const friends: FriendFarm[] = useMemo(() => {
    const lowerCurrent = currentUsername?.toLowerCase().trim()
    return FRIEND_NAMES
      .filter((name) => !lowerCurrent || name.toLowerCase() !== lowerCurrent)
      .map((name) => ({ name }))
  }, [currentUsername])

  return (
    <div className="min-h-screen w-full" data-stage="navigation">
      <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden">
        <img
          ref={imgRef}
          src="/navigation.png"
          alt="Navigation"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* 與 object-cover 背景同尺度、同裁切，內層 % 即為背景圖上的相對位置與大小 */}
        <div
          className="absolute"
          style={
            coverOverlayRect
              ? {
                  width: coverOverlayRect.width,
                  height: coverOverlayRect.height,
                  left: coverOverlayRect.left,
                  top: coverOverlayRect.top,
                }
              : { left: 0, top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
          }
        >
          {/* 返回按鈕：相對背景圖的 % */}
          {onBack && (
            <div className="absolute z-20 -translate-y-1/2" style={{ left: "2%", top: "50%" }}>
              <BackButton onClick={onBack} variant="slate" noFixed />
            </div>
          )}

          {/* 右側標題文字 + 列表（相對背景圖的 %） */}
          <div
            className="absolute z-10 space-y-3"
            style={{
              left: `${rectLeft}%`,
              top: `${rectTop}%`,
              width: `${rectWidth}%`,
              transform: "translateX(-50%)",
            }}
          >
          {/* 點擊文字（不再有圓角矩形框） */}
          <p
            className="w-full cursor-pointer text-center text-base sm:text-lg font-black text-slate-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.98)] tracking-wide transition-transform hover:scale-105"
            onClick={() => setListOpen((prev) => !prev)}
          >
            Click to select a friend's farm
          </p>

          {/* 展開的好友列表 */}
          {listOpen && (
            <div
              className="max-h-[320px] mx-auto overflow-y-auto rounded-b-3xl bg-white/60 p-4 shadow-xl border border-slate-200 border-t border-t-slate-200 rounded-t-none"
              style={{ marginTop: `${listOffset}px`, width: `${listWidthPercent}%` }}
            >
              <ul className="space-y-2 text-sm sm:text-base">
                {friends.map((friend) => (
                  <li key={friend.name}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => {
                        onSelectFarm?.(friend.name)
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 border border-amber-200">
                          {friend.name.charAt(0)}
                        </span>
                        <span className="font-semibold text-slate-800">{friend.name}</span>
                      </span>
                      <span className="ml-3 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700">
                        Visit
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

