"use client"

import { useMemo, useState } from "react"

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

export default function NavigationPage({ onBack, onSelectFarm, currentUsername }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  // 固定為你提供的最終位置
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
      {/* 固定視窗鋪滿，背景 object-cover 不露 firstmap，前景用 % 鎖定相對位置 */}
      <div className="fixed inset-0 w-full h-full overflow-hidden">
        <img
          src="/navigation.png"
          alt="Navigation"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0">
          {/* 可選：左上角返回按鈕（用 % 鎖定相對位置） */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute z-20 w-[12%] max-w-28 aspect-square transition-transform duration-200 hover:scale-110"
              style={{ left: "2%", top: "8%" }}
              aria-label="Back"
            >
              <img src="/back.png" alt="Back" className="w-full h-full object-contain" />
            </button>
          )}

          {/* 右側標題文字 + 列表（根據百分比定位） */}
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

