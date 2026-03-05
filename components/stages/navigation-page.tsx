"use client"

import { useState } from "react"

interface FriendFarm {
  name: string
  available: boolean
}

interface NavigationPageProps {
  onBack?: () => void
}

const ALL_FRIENDS: FriendFarm[] = [
  { name: "Stark", available: true },
  { name: "Banner", available: false },
  { name: "Rogers", available: true },
  { name: "Parker", available: false },
  { name: "Romanoff", available: true },
  { name: "Barton", available: false },
  { name: "Odinson", available: true },
  { name: "Maximoff", available: false },
  { name: "Lang", available: true },
  { name: "Strange", available: false },
  { name: "Fury", available: true },
  { name: "Groot", available: false },
  { name: "Rocket", available: true },
  { name: "Quill", available: false },
  { name: "Drax", available: true },
  { name: "Gamora", available: false },
  { name: "Thanos", available: true },
  { name: "Loki", available: false },
  { name: "halk", available: true },
  { name: "Wayne", available: false },
  { name: "Kent", available: true },
  { name: "Queen", available: false },
  { name: "Allen", available: true },
  { name: "Barbara", available: false },
  { name: "Diana", available: true },
  { name: "Selina", available: false },
  { name: "Lex", available: true },
  { name: "Luthor", available: false },
  // 可以根據需要再添加
]

export default function NavigationPage({ onBack }: NavigationPageProps) {
  const [listOpen, setListOpen] = useState(false)
  const [rectLeft, setRectLeft] = useState(70) // 百分比，0-100
  const [rectTop, setRectTop] = useState(30) // 百分比，0-100
  const [rectWidth, setRectWidth] = useState(26) // 百分比，0-100
  const [rectHeight, setRectHeight] = useState(8) // 百分比，0-100

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/navigation.png)" }}
      data-stage="navigation"
    >
      <div className="relative h-full w-full">
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

        {/* 測試控制面板（左上角） */}
        <div className="absolute left-4 top-16 z-30 w-64 max-w-[70vw] rounded-2xl bg-white/85 p-3 text-xs text-slate-800 shadow-lg border border-slate-200 backdrop-blur">
          <div className="mb-1 font-semibold">Rectangle Test Panel</div>
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

        {/* 右側圓角矩形 + 列表（根據測試參數定位） */}
        <div
          className="absolute z-10 space-y-3"
          style={{
            left: `${rectLeft}%`,
            top: `${rectTop}%`,
            width: `${rectWidth}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* 點擊區域 */}
          <button
            type="button"
            onClick={() => setListOpen((prev) => !prev)}
            className="w-full rounded-full bg-white/85 px-6 py-3 text-center shadow-lg border border-slate-200 font-semibold text-slate-600 text-sm sm:text-base transform transition-all duration-200 hover:scale-105 hover:bg-white"
            style={{
              height: `${rectHeight}%`,
              minHeight: "40px",
            }}
          >
            Click to select a friend's farm
          </button>

          {/* 展開的好友列表 */}
          {listOpen && (
            <div className="max-h-[320px] w-full overflow-y-auto rounded-3xl bg-white/90 p-4 shadow-xl border border-slate-200 backdrop-blur-sm">
              <ul className="space-y-2 text-sm sm:text-base">
                {ALL_FRIENDS.map((friend) => (
                  <li key={friend.name}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-800">{friend.name}</span>
                      <span
                        className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          friend.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
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

