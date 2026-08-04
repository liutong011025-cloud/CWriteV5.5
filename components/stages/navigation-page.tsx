"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BackButton } from "@/components/ui/back-button"

interface FriendFarm {
  name: string
  avatarUrl: string | null
  avatarEmoji: string | null
  grade: string | null
  totalWorks: number
  latestActiveAt: string | null
}

interface NavigationPageProps {
  onBack?: () => void
  onSelectFarm?: (friendName: string) => void
  currentUsername?: string
}

interface DashboardClassUser {
  id: string
  username: string
  avatarUrl: string | null
  avatarEmoji: string | null
  grade: string | null
  totalWorks: number
  latestActiveAt: string | null
}

interface DashboardPayload {
  classGroups?: Array<{
    users?: DashboardClassUser[]
  }>
}

/** 與 object-cover 背景對齊的 overlay 矩形（px） */
interface CoverOverlayRect {
  width: number
  height: number
  left: number
  top: number
}

export default function NavigationPage({ onBack, onSelectFarm, currentUsername }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  const [preferFullImage, setPreferFullImage] = useState(false)
  const [friends, setFriends] = useState<FriendFarm[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [friendsError, setFriendsError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [coverOverlayRect, setCoverOverlayRect] = useState<CoverOverlayRect | null>(null)

  const refreshFriends = useCallback(async () => {
    setLoadingFriends(true)
    try {
      const response = await fetch("/api/teacher/dashboard", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const payload = (await response.json()) as DashboardPayload
      const lowerCurrent = currentUsername?.toLowerCase().trim()
      const liveFriends = (payload.classGroups?.[0]?.users ?? [])
        .filter((item) => {
          const username = item.username?.trim()
          return username && (!lowerCurrent || username.toLowerCase() !== lowerCurrent)
        })
        .map((item) => ({
          name: item.username.trim(),
          avatarUrl: item.avatarUrl,
          avatarEmoji: item.avatarEmoji,
          grade: item.grade,
          totalWorks: item.totalWorks,
          latestActiveAt: item.latestActiveAt,
        }))
      setFriends(liveFriends)
      setFriendsError(null)
    } catch (error) {
      console.error("[navigation] failed to refresh users:", error)
      setFriendsError("Could not refresh live user list.")
    } finally {
      setLoadingFriends(false)
    }
  }, [currentUsername])

  const updateCoverOverlayRect = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const s = preferFullImage ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih)
    setCoverOverlayRect({
      width: s * iw,
      height: s * ih,
      left: -(s * iw - cw) / 2,
      top: -(s * ih - ch) / 2,
    })
  }, [preferFullImage])

  useEffect(() => {
    const updateFitMode = () => {
      setPreferFullImage(window.innerWidth <= 1180)
    }
    updateFitMode()
    window.addEventListener("resize", updateFitMode)
    return () => window.removeEventListener("resize", updateFitMode)
  }, [])

  useEffect(() => {
    void refreshFriends()
  }, [refreshFriends])

  useEffect(() => {
    if (listOpen) void refreshFriends()
  }, [listOpen, refreshFriends])

  useEffect(() => {
    const refreshOnFocus = () => void refreshFriends()
    window.addEventListener("focus", refreshOnFocus)
    const intervalId = window.setInterval(refreshOnFocus, 15000)
    return () => {
      window.removeEventListener("focus", refreshOnFocus)
      window.clearInterval(intervalId)
    }
  }, [refreshFriends])

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

  const latestUpdatedLabel = useMemo(() => {
    const latest = friends
      .map((friend) => (friend.latestActiveAt ? new Date(friend.latestActiveAt).getTime() : 0))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a)[0]
    if (!latest) return "Live class list"
    return `Latest activity ${new Date(latest).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }, [friends])

  return (
    <div className="min-h-screen w-full" data-stage="navigation">
      <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden bg-[#9fc9da]">
        <img
          ref={imgRef}
          src="/navigation.webp"
          alt="Navigation"
          className="absolute inset-0 w-full h-full object-center"
          style={{ objectFit: preferFullImage ? "contain" : "cover" }}
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
          <p className="text-center text-[11px] font-semibold text-slate-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.95)]">
            {loadingFriends ? "Refreshing users..." : latestUpdatedLabel}
          </p>

          {/* 展開的好友列表 */}
          {listOpen && (
            <div
              className="max-h-[320px] mx-auto overflow-y-auto rounded-b-3xl bg-white/60 p-4 shadow-xl border border-slate-200 border-t border-t-slate-200 rounded-t-none"
              style={{ marginTop: `${listOffset}px`, width: `${listWidthPercent}%` }}
            >
              {friendsError ? (
                <p className="px-3 py-2 text-center text-xs font-semibold text-rose-700">{friendsError}</p>
              ) : friends.length === 0 && !loadingFriends ? (
                <p className="px-3 py-2 text-center text-xs font-semibold text-slate-600">No classmates found yet.</p>
              ) : (
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
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xs font-bold text-amber-700 border border-amber-200">
                            {friend.avatarUrl ? (
                              <img src={friend.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              friend.avatarEmoji || friend.name.charAt(0)
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">{friend.name}</span>
                            <span className="block truncate text-[11px] font-semibold text-slate-500">
                              {friend.grade ? `Grade ${friend.grade} · ` : ""}
                              {friend.totalWorks} saved {friend.totalWorks === 1 ? "piece" : "pieces"}
                            </span>
                          </span>
                        </span>
                        <span className="ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700">
                          Visit
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

