"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Flag, Wand2, Home } from "lucide-react"
import Image from "next/image"
import type { Language, StoryState, BookReviewState, LetterState } from "@/app/page"
import type { JourneyType } from "@/components/stages/journey-ticket"
import Antigravity from "@/components/effects/antigravity"
import ShapeBlur from "@/components/effects/shape-blur"

export interface DramaProgress {
  hasDramaBook: boolean
}

export interface PoetryProgress {
  hasForm: boolean
  hasTopic: boolean
  hasLines: boolean
  phase: "choose-form" | "setup-topic" | "editor" | "review"
}

interface JourneyMapProps {
  language?: Language
  type: JourneyType
  mapImageUrl?: string
  mapFlags?: MapFlag[]
  pin?: { x: number; y: number } | null
  onPinChange?: (pin: { x: number; y: number } | null) => void
  storyState: StoryState
  bookReviewState: BookReviewState
  letterState: LetterState
  dramaProgress?: DramaProgress
  poetryProgress?: PoetryProgress
  noAi?: boolean
  onNavigate: (stage: string) => void
  onBack?: () => void
  onGoProfile?: () => void
  overlayTitle?: string | null
  hidePins?: boolean
}

interface MapFlag {
  id: string
  x: number
  y: number
  title: string
}

export default function JourneyMap({
  language = "en",
  type,
  mapImageUrl,
  mapFlags,
  pin,
  onPinChange,
  onNavigate,
  onBack,
  onGoProfile,
  overlayTitle,
  hidePins = false,
}: JourneyMapProps) {
  const [internalPin, setInternalPin] = useState<{ x: number; y: number } | null>(pin ?? null)
  // 是否已在地圖上放置起點旗幟（還沒開始寫作）
  const [isPlacingPin, setIsPlacingPin] = useState(false)
  // 是否當前手上正「拿著」圖釘，準備放置
  const [isHoldingPin, setIsHoldingPin] = useState(false)
  const [isHoveringBox, setIsHoveringBox] = useState(false)
  const [flags] = useState<MapFlag[]>(mapFlags ?? [])

  const pinPosition = pin ?? internalPin
  const effectiveMapImageUrl = mapImageUrl || "/firstmap.png"

  // 设置data-no-header属性，隐藏header
  useEffect(() => {
    const container = document.querySelector('main')
    if (container) {
      container.setAttribute('data-no-header', 'true')
      container.setAttribute('data-stage', 'journeyMap')
    }
    return () => {
      if (container) {
        container.removeAttribute('data-no-header')
        container.removeAttribute('data-stage')
      }
    }
  }, [])

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 只有在手上拿著圖釘時，才能在地圖上放置起點
    if (!isHoldingPin) return
    const rect = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100
    const nextPin = { x: xPercent, y: yPercent }
    if (onPinChange) onPinChange(nextPin)
    else setInternalPin(nextPin)

    // 放下圖釘之後，變成「已放置但還沒開始寫作」狀態
    setIsHoldingPin(false)
    setIsPlacingPin(true)
  }

  const handleStartJourney = () => {
    if (!pinPosition) return
    setIsPlacingPin(false)
    // 根據當前旅程類型，進入對應寫作流程的第一步
    if (type === "story") {
      onNavigate("welcome")
    } else if (type === "bookReview") {
      onNavigate("bookReviewWelcome")
    } else if (type === "letter") {
      onNavigate("letterAdventure")
    } else if (type === "drama") {
      onNavigate("dramaWriting")
    } else if (type === "poetry") {
      onNavigate("poetryWriting")
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-0">
      <img
        src={effectiveMapImageUrl}
        alt="Journey Map"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: "high-quality",
        }}
      />
      <div className="absolute inset-0 opacity-60">
        <Antigravity
          count={300}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#f9f566"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="p-6 pt-6 flex items-center justify-between gap-3">
          <div>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="bg-white/80 backdrop-blur-lg border-2 border-gray-200 hover:bg-gray-50 text-gray-700 shadow-lg w-12 h-12 p-0"
                title="Back"
              >
                <ArrowLeft size={18} />
              </Button>
            )}
          </div>
          {onGoProfile && (
            <Button
              onClick={onGoProfile}
              variant="outline"
              className="bg-white/85 backdrop-blur-lg border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 shadow-lg rounded-full px-4 h-11 gap-2"
              title="Home"
            >
              <Home size={18} />
              <span className="text-xs font-semibold">My Forest</span>
            </Button>
          )}
        </div>

        <div className="pt-4 pb-2 text-center">
          <h1 className="font-hand text-4xl md:text-5xl font-extrabold text-purple-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]">
            Your Writing Atlas
          </h1>
          {overlayTitle && (
            <p className="mt-2 font-hand text-lg md:text-xl font-bold text-emerald-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {overlayTitle}
            </p>
          )}
        </div>

        <div className="relative w-full h-[calc(100vh-120px)] flex">
          {/* 左上角：My Farm 房子按鈕 */}
          {onGoProfile && (
            <button
              type="button"
              onClick={onGoProfile}
              className="absolute left-10 top-6 z-20 rounded-2xl bg-white/0 hover:bg-white/10 transition-transform duration-200"
              aria-label="Go to My Farm"
            >
              <img
                src="/myfarm.png"
                alt="My Farm"
                className="w-40 h-auto object-contain drop-shadow-lg transition-transform duration-200 hover:scale-110"
                draggable={false}
              />
            </button>
          )}

          {/* 右下角：圖釘盒 box，點擊後拿起圖釘 */}
          <div className="absolute right-6 bottom-6 z-20 flex flex-col items-center gap-1 motion-safe:animate-bounce">
            <p className="mb-1 text-lg md:text-xl font-hand font-extrabold text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.98)]">
              {Array.from("Drop a pin on the map to start a new adventure!").map((ch, idx) => {
                const palette = ["#ec4899", "#8b5cf6", "#22c55e", "#f97316", "#0ea5e9", "#eab308"]
                const color = ch === " " ? "#4c1d95" : palette[idx % palette.length]
                return (
                  <span key={idx} style={{ color }}>
                    {ch}
                  </span>
                )
              })}
            </p>
            <button
              type="button"
              onMouseEnter={() => setIsHoveringBox(true)}
              onMouseLeave={() => setIsHoveringBox(false)}
              onClick={() => {
                setIsHoldingPin(true)
              }}
              className="relative rounded-2xl bg-white/0 hover:bg-white/10 transition-transform duration-200"
              aria-label="Pick up pin"
            >
              <img
                src="/box.png"
                alt="Pin box"
                className="w-36 h-auto object-contain drop-shadow-lg transition-transform duration-200 hover:scale-110 motion-safe:animate-bounce"
                draggable={false}
              />
            </button>
            {isHoveringBox && (
              <div className="absolute right-full mr-3 bottom-1/2 translate-y-1/2 rounded-xl border border-purple-200 bg-white/95 px-3 py-2 text-xs font-hand text-purple-800 shadow-lg max-w-xs">
                Drag and place the pin to mark the starting point of your journey!
              </div>
            )}
          </div>

          <div
            className="relative flex-1 h-full cursor-crosshair"
            onClick={handleMapClick}
            style={{
              cursor: isHoldingPin ? 'url("/pin.png") 16 32, pointer' : "default",
            }}
          >
            {pinPosition && !hidePins && (
              <button
                type="button"
                onClick={handleStartJourney}
                className="absolute -translate-x-1/2 -translate-y-full group"
                style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                aria-label="Start writing from here"
              >
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/pin.png"
                    alt="Writing start pin"
                    width={40}
                    height={40}
                    className="drop-shadow-lg group-hover:scale-110 transition-transform"
                    unoptimized
                  />
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-purple-700 shadow">
                    <Flag className="w-3 h-3 text-purple-500" />
                    Start
                  </span>
                  {isPlacingPin && (
                    <span className="mt-1 text-[11px] text-white bg-purple-500/80 rounded-full px-3 py-0.5 shadow">
                      Click the START flag to begin!
                    </span>
                  )}
                </div>
              </button>
            )}

            {!hidePins &&
              flags.map((flag) => (
              <div
                key={flag.id}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ left: `${flag.x}%`, top: `${flag.y}%` }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Flag className="text-emerald-500 drop-shadow-lg" size={32} />
                  <span className="max-w-[120px] truncate rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow">
                    {flag.title}
                  </span>
                </div>
              </div>
              ))}

            {/* 完成後：在最後一次圖釘位置顯示可點擊的故事標題框 */}
            {pinPosition && hidePins && overlayTitle && (
              <button
                type="button"
                onClick={() => onNavigate("review")}
                className="absolute -translate-x-1/2 -translate-y-full group"
                style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                aria-label="Open full story"
              >
                <div className="rounded-2xl bg-white/92 border-2 border-purple-300 px-4 py-2 shadow-xl flex items-center gap-2 group-hover:bg-purple-50 transition-colors">
                  <Flag className="w-4 h-4 text-purple-500" />
                  <span className="font-hand text-sm font-bold text-purple-800 whitespace-nowrap">
                    {overlayTitle}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* 右側原說明面板已移除，保留空間以後可放其它內容 */}
        </div>
      </div>
    </div>
  )
}
