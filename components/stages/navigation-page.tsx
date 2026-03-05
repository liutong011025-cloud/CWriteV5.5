"use client"

import { useMemo, useState } from "react"

interface FriendFarm {
  name: string
  available: boolean
}

interface NavigationPageProps {
  onBack?: () => void
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

export default function NavigationPage({ onBack }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  const [rectLeft, setRectLeft] = useState(70) // 百分比，0-100
  const [rectTop, setRectTop] = useState(30) // 百分比，0-100
  const [rectWidth, setRectWidth] = useState(26) // 百分比，0-100
  const [rectHeight, setRectHeight] = useState(8) // 百分比，0-100
  const [listOffset, setListOffset] = useState(12) // 文本下方展開列表的間距（px）

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

        {/* 文字位置測試控制面板（左下角，避免被 Header 蓋住） */}
        <div className="absolute left-4 bottom-4 z-30 w-64 max-w-[70vw] rounded-2xl bg-white/85 p-3 text-xs text-slate-800 shadow-lg border border-slate-200 backdrop-blur">
          <div className="mb-1 font-semibold">Title Position Panel</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between">
                <span>Left (%)</span>
                <span>{rectLeft.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={rectLeft}
                onChange={(e) => setRectLeft(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>Top (%)</span>
                <span>{rectTop.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={rectTop}
                onChange={(e) => setRectTop(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>Width (%)</span>
                <span>{rectWidth.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={0.5}
                value={rectWidth}
                onChange={(e) => setRectWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>Height (%)</span>
                <span>{rectHeight.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                step={0.5}
                value={rectHeight}
                onChange={(e) => setRectHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-1 rounded bg-slate-100 px-2 py-1 font-mono text-[10px] leading-snug">
              {`left: ${rectLeft.toFixed(1)}%, top: ${rectTop.toFixed(1)}%, width: ${rectWidth.toFixed(
                1,
              )}%, height: ${rectHeight.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* 列表間距調整面板（右下角） */}
        <div className="absolute right-4 bottom-4 z-30 w-64 max-w-[70vw] rounded-2xl bg-white/85 p-3 text-xs text-slate-800 shadow-lg border border-slate-200 backdrop-blur">
          <div className="mb-1 font-semibold">List Offset Panel</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between">
                <span>Offset from title (px)</span>
                <span>{listOffset.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={4}
                max={80}
                step={1}
                value={listOffset}
                onChange={(e) => setListOffset(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 右側標題文字 + 列表（根據測試參數定位） */}
        <div
          className="absolute z-10 space-y-3"
          style={{
            left: `${rectLeft}%`,
            top: `${rectTop}%`,
            width: `${rectWidth}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* 點擊文字（不再有圓角矩形框） */}
          <p
            className="w-full cursor-pointer text-center text-sm sm:text-base font-semibold text-slate-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] transition-transform hover:scale-105"
            onClick={() => setListOpen((prev) => !prev)}
          >
            Click to select a friend's farm
          </p>

          {/* 展開的好友列表 */}
          {listOpen && (
            <div
              className="max-h-[320px] w-full overflow-y-auto rounded-3xl bg-white/90 p-4 shadow-xl border border-slate-200 backdrop-blur-sm"
              style={{ marginTop: `${listOffset}px` }}
            >
              <ul className="space-y-2 text-sm sm:text-base">
                {friends.map((friend) => (
                  <li key={friend.name}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-50 transition-colors"
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

