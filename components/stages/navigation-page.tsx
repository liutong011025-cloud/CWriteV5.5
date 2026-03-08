"use client"

import { useMemo, useState } from "react"

interface FriendFarm {
  name: string
  available: boolean
}

interface NavigationPageProps {
  onBack?: () => void
  onSelectFarm?: (friendName: string) => void
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

export default function NavigationPage({ onBack, onSelectFarm }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  // 固定為你提供的最終位置
  const rectLeft = 74.5 // 百分比，0-100
  const rectTop = 32.0 // 百分比，0-100
  const rectWidth = 38.5 // 百分比，0-100
  const listOffset = 4 // 文本下方展開列表的間距（px）
  const listWidthPercent = 41 // 列表寬度相對於外層容器（百分比）

  // 隨機決定哪些好友可訪問，避免固定規律；每次刷新頁面會重新隨機
  const friends: FriendFarm[] = useMemo(() => {
    const result: FriendFarm[] = FRIEND_NAMES.map((name) => ({
      name,
      available: Math.random() > 0.4,
    }))
    // 確保不是全部都可訪問或全部都不可訪問
    const anyAvailable = result.some((f) => f.available)
    const anyUnavailable = result.some((f) => !f.available)
    if (!anyAvailable) {
      result[0].available = true
    } else if (!anyUnavailable && result.length > 1) {
      result[result.length - 1].available = false
    }
    return result
  }, [])

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/navigation.png)" }}
      data-stage="navigation"
    >
      {/* 這個容器必須有具體高度，top 的百分比才會生效 */}
      <div className="relative w-full min-h-screen">
        {/* 可選：左上角返回按鈕 */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-4 top-4 rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-slate-700 shadow hover:bg-white"
          >
            Back to Farm
          </button>
        )}

        {/* 右側標題文字 + 列表（根據測試參數定位） */}
        <div
          className="absolute z-10 space-y-3"
          style={{
            left: `${rectLeft}%`,
            top: `${rectTop}%`,
            width: `${rectWidth}%`,
            // 僅水平居中，垂直位置完全由 top 控制，避免展開列表時把文字頂上去
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
                        if (friend.available) onSelectFarm?.(friend.name)
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 border border-amber-200">
                          {friend.name.charAt(0)}
                        </span>
                        <span className="font-semibold text-slate-800">{friend.name}</span>
                      </span>
                      <span
                        className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          friend.available
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {friend.available ? "Available" : "Unavailable"}
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
  )
}

