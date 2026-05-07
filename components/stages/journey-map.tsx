"use client"

import { useEffect, useState, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Flag, PencilLine } from "lucide-react"
import Image from "next/image"
import type { Language, StoryState, BookReviewState, LetterState, MapFlagItem, MapWorkType } from "@/app/page"
import type { JourneyType } from "@/components/stages/journey-ticket"
import Antigravity from "@/components/effects/antigravity"
import ShapeBlur from "@/components/effects/shape-blur"
import Particles from "@/components/effects/Particles"

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
  type?: JourneyType
  mapImageUrl?: string
  mapFlags?: MapFlagItem[]
  pin?: { x: number; y: number } | null
  onPinChange?: (pin: { x: number; y: number } | null) => void
  chapterIndex?: number
  onPrevChapter?: (() => void) | undefined
  onNextChapter?: (() => void) | undefined
  canMoveToNextChapter?: boolean
  storyState: StoryState
  bookReviewState: BookReviewState
  letterState: LetterState
  dramaProgress?: DramaProgress
  poetryProgress?: PoetryProgress
  noAi?: boolean
  onStartJourney?: () => void
  onNavigate: (stage: string) => void
  onBack?: () => void
  onGoProfile?: () => void
  onFlagUpdate?: (flagId: string, updates: { title?: string; content?: string }) => void
}

export default function JourneyMap({
  language = "en",
  type,
  mapImageUrl,
  mapFlags,
  pin,
  onPinChange,
  chapterIndex = 0,
  onPrevChapter,
  onNextChapter,
  canMoveToNextChapter = false,
  onNavigate,
  onBack,
  onGoProfile,
  onFlagUpdate,
  onStartJourney,
}: JourneyMapProps) {
  const [internalPin, setInternalPin] = useState<{ x: number; y: number } | null>(pin ?? null)
  const [isPlacingPin, setIsPlacingPin] = useState(false)
  const [isHoldingPin, setIsHoldingPin] = useState(false)
  const [isHoveringBox, setIsHoveringBox] = useState(false)
  const [pinBoxHidden, setPinBoxHidden] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<MapFlagItem | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [isEditingFlag, setIsEditingFlag] = useState(false)
  const flags = mapFlags ?? []

  const pinPosition = pin ?? internalPin
  const effectiveMapImageUrl = mapImageUrl || (chapterIndex > 0 ? "/secondmap.png" : "/firstmap.png")

  // 设置data-no-header属性，隐藏header
  useEffect(() => {
    const container = document.querySelector('main')
    window.scrollTo({ top: 0, behavior: "auto" })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    if (container instanceof HTMLElement) {
      container.scrollTop = 0
    }
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

  // 切换章节时关闭弹窗，避免显示上一章节的内容。
  useEffect(() => {
    setSelectedFlag(null)
    setEditContent("")
    setEditTitle("")
    setIsEditingFlag(false)
  }, [chapterIndex])

  const getWorkTypeLabel = (workType?: MapWorkType) => {
    if (workType === "review") return "Book Review"
    if (workType === "letter") return "Letter"
    if (workType === "drama") return "Drama"
    if (workType === "poetry") return "Poetry"
    return "Story"
  }

  useEffect(() => {
    if (pin) {
      setInternalPin(pin)
      setPinBoxHidden(true)
      setIsPlacingPin(true)
      return
    }
    setInternalPin(null)
    setPinBoxHidden(false)
    setIsPlacingPin(false)
  }, [pin])

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
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
    if (onStartJourney) {
      onStartJourney()
      return
    }
    onNavigate("planTest")
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden pt-[96px]"
      style={{
        cursor: isHoldingPin
          ? 'url("/pin.png") 16 32, pointer'
          : "default",
      }}
    >
      <img
        src={effectiveMapImageUrl}
        alt="Journey Map"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: "auto" as const,
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
      <div className="absolute inset-0 opacity-100 pointer-events-none">
        <Particles
          particleColors={["#fff7bd", "#ffe78a", "#ffd8a8", "#ffc7d8", "#ffb7cf", "#ffd1f0"]}
          particleCount={360}
          particleSpread={9.5}
          speed={0.12}
          particleBaseSize={105}
          moveParticlesOnHover
          alphaParticles={true}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {onBack && (
          <BackButton onClick={onBack} variant="amber" />
        )}
        <div className="p-6 pt-6 flex items-center justify-between gap-3">
          <div />
          <div />
        </div>

        <div className="-mt-20 pb-1 text-center flex items-center justify-center gap-4">
          {onPrevChapter && chapterIndex > 0 && (
            <button
              type="button"
              onClick={onPrevChapter}
              className="rounded-2xl border-2 border-amber-100/90 bg-gradient-to-r from-[#c4a574] via-[#a87f52] to-[#8b6914] px-6 py-3 text-base md:text-lg font-hand font-extrabold text-white shadow-2xl hover:scale-105 hover:brightness-110 transition-all drop-shadow-[0_3px_4px_rgba(0,0,0,0.45)]"
            >
              ← Move to Last Chapter
            </button>
          )}
          <h1 className="font-hand text-4xl md:text-5xl font-extrabold text-purple-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]">
            Writing Map
          </h1>
        </div>

        <div className="relative w-full h-[calc(100vh-120px)] flex">
          {/* 左上角：My Farm 房子按鈕 */}
          {onGoProfile && (
            <button
              type="button"
              onClick={onGoProfile}
              className="absolute left-10 top-6 z-20 rounded-2xl bg-white/0 hover:bg-white/10 transition-transform duration-200 text-center"
              aria-label="Go to My Farm"
            >
              <img
                src="/myfarm.png"
                alt="My Farm"
                className="w-32 h-auto object-contain drop-shadow-lg transition-transform duration-200 hover:scale-105"
                draggable={false}
              />
              <div className="mt-1 text-lg md:text-xl font-hand font-extrabold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                My Farm
              </div>
            </button>
          )}

          {onNextChapter && canMoveToNextChapter && (
            <Button
              type="button"
              variant="ghost"
              onClick={onNextChapter}
              className="absolute right-8 top-6 z-20 rounded-2xl border-2 border-yellow-200/90 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-5 py-4 text-sm font-extrabold text-white shadow-2xl animate-pulse hover:scale-105 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600"
            >
              ✨ Move to Next Chapter →
            </Button>
          )}

          {/* 右下角：圖釘盒 box，點擊後拿起圖釘 */}
          {!pinBoxHidden && (
            <div className="absolute right-5 bottom-12 z-20 flex flex-col items-center gap-2">
              <p className="mb-2 max-w-[980px] text-[20px] md:text-2xl leading-tight font-hand font-extrabold text-center text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] atlas-jitter-sm">
                Drop a pin on the map to start your writing adventure!
              </p>
              <button
                type="button"
                onMouseEnter={() => setIsHoveringBox(true)}
                onMouseLeave={() => setIsHoveringBox(false)}
                onClick={() => {
                  setIsHoldingPin(true)
                  setPinBoxHidden(true)
                }}
                className="relative rounded-2xl bg-white/0 hover:bg-white/10 transition-transform duration-200 atlas-jitter-sm"
                aria-label="Pick up pin"
              >
                <img
                  src="/box.png"
                  alt="Pin box"
                  className="w-28 h-auto object-contain drop-shadow-lg transition-transform duration-200 hover:scale-105"
                  draggable={false}
                />
              </button>
              {isHoveringBox && (
                <div className="absolute bottom-full right-0 z-30 mb-3 w-[min(92vw,560px)] rounded-xl border border-purple-200 bg-white/95 px-4 py-3 text-center text-base md:text-lg font-hand leading-relaxed text-purple-800 shadow-lg break-words">
                  Click the pin box to pick up a pin, then click the area on the map where you want to start exploring and writing.
                </div>
              )}
            </div>
          )}

          <div
            className="relative flex-1 h-full"
            onClick={handleMapClick}
          >
            {pinPosition && (
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
                    width={52}
                    height={52}
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

            {flags.map((flag, idx) => {
              const colors = [
                "from-pink-100 to-pink-200 border-pink-300 text-pink-800",
                "from-purple-100 to-purple-200 border-purple-300 text-purple-800",
                "from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-800",
                "from-sky-100 to-sky-200 border-sky-300 text-sky-800",
                "from-amber-100 to-amber-200 border-amber-300 text-amber-800",
              ]
              const colorClass = colors[idx % colors.length]
              return (
                <button
                  key={flag.id}
                  type="button"
                  onClick={() => {
                    if (onFlagUpdate) {
                      setSelectedFlag(flag)
                      setEditTitle(flag.title)
                      setEditContent(flag.content ?? "")
                      setIsEditingFlag(false)
                    } else {
                      onNavigate("review")
                    }
                  }}
                  className="absolute -translate-x-1/2 -translate-y-full group"
                  style={{ left: `${flag.x}%`, top: `${flag.y}%` }}
                  aria-label={flag.title}
                >
                  <div
                    className={`max-w-[160px] rounded-2xl bg-gradient-to-r ${colorClass} px-3 py-1.5 shadow-xl flex items-center gap-2 group-hover:brightness-110 transition`}
                  >
                    <Flag className="h-3.5 w-3.5 shrink-0 text-slate-800 drop-shadow" />
                    <span className="font-hand text-xs font-extrabold leading-tight text-slate-900 break-words [overflow-wrap:anywhere] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                      {flag.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 右側原說明面板已移除，保留空間以後可放其它內容 */}
        </div>
      </div>

      {/* Article detail modal: click flag → show full text, edit and save */}
      {selectedFlag && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedFlag(null)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border-2 border-purple-200 bg-white shadow-2xl"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-purple-200 bg-purple-50/80 px-4 py-3">
              <div className="min-w-0">
                <h2 id="article-dialog-title" className="text-lg font-bold text-purple-900">
                  {isEditingFlag ? "Edit Article" : "Article"}
                </h2>
                <p className="text-xs font-semibold text-purple-600">
                  {getWorkTypeLabel(selectedFlag.workType)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingFlag((prev: boolean) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  aria-label={isEditingFlag ? "Stop editing article" : "Edit article"}
                >
                  <PencilLine className="h-4 w-4" />
                  {isEditingFlag ? "Preview" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFlag(null)}
                  className="rounded-full p-2 text-purple-700 hover:bg-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(90vh-8rem)]">
              {isEditingFlag ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-purple-800">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-purple-800">Full article</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={14}
                      className="w-full resize-y rounded-lg border border-purple-200 px-3 py-2 text-purple-900 whitespace-pre-wrap break-words [overflow-wrap:anywhere] focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="No content stored for this article."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Title</p>
                    <h3 className="mt-1 text-xl font-bold text-purple-950 break-words [overflow-wrap:anywhere]">
                      {editTitle || selectedFlag.title}
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-purple-200 bg-white px-4 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-600">Full article</p>
                    <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-purple-900 [overflow-wrap:anywhere]">
                      {editContent?.trim() ? editContent : "No content stored for this article yet."}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-purple-200 bg-purple-50/50 px-4 py-3">
              <Button
                variant="outline"
                onClick={() => setSelectedFlag(null)}
                className="border-purple-300 text-purple-800"
              >
                {isEditingFlag ? "Cancel" : "Close"}
              </Button>
              {isEditingFlag && (
                <Button
                  onClick={() => {
                    if (onFlagUpdate && selectedFlag) {
                      onFlagUpdate(selectedFlag.id, { title: editTitle.trim() || selectedFlag.title, content: editContent })
                      setSelectedFlag(null)
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes atlas-jitter-sm {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(-1px, 1px, 0) rotate(-0.6deg); }
          50% { transform: translate3d(1px, -1px, 0) rotate(0.4deg); }
          75% { transform: translate3d(-1px, -1px, 0) rotate(-0.3deg); }
        }
        .atlas-jitter-sm {
          animation: atlas-jitter-sm 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
