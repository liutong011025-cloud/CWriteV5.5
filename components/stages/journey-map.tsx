"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Flag, Wand2, Home } from "lucide-react"
import Image from "next/image"
import type { Language, StoryState, BookReviewState, LetterState } from "@/app/page"
import type { JourneyType } from "@/components/stages/journey-ticket"
import Antigravity from "@/components/effects/antigravity"
import ShapeBlur from "@/components/effects/shape-blur"
import SplashCursor from "@/components/effects/splash-cursor"

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
}: JourneyMapProps) {
  const [internalPin, setInternalPin] = useState<{ x: number; y: number } | null>(pin ?? null)
  const [isPlacingPin, setIsPlacingPin] = useState(true)
  const [flags] = useState<MapFlag[]>(mapFlags ?? [])

  const pinPosition = pin ?? internalPin

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
    if (!isPlacingPin) return
    const rect = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100
    const nextPin = { x: xPercent, y: yPercent }
    if (onPinChange) {
      onPinChange(nextPin)
    } else {
      setInternalPin(nextPin)
    }
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
      <SplashCursor />
      {mapImageUrl ? (
        <>
          <img
            src={mapImageUrl}
            alt="Journey Map"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              imageRendering: 'high-quality',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #020617 0%, #020617 35%, #1e293b 70%, #020617 100%)",
          }}
        ></div>
      )}
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

        <div className="relative w-full h-[calc(100vh-120px)] flex">
          <div
            className="relative flex-1 h-full cursor-crosshair"
            onClick={handleMapClick}
          >
            {pinPosition && (
              <div
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/圖釘.png"
                    alt="Writing start pin"
                    width={40}
                    height={40}
                    className="drop-shadow-lg"
                    unoptimized
                  />
                  {isPlacingPin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-purple-700 shadow">
                      <Wand2 className="w-3 h-3" />
                      Tap Continue to start
                    </span>
                  )}
                </div>
              </div>
            )}

            {flags.map((flag) => (
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
          </div>

          <div className="w-full max-w-xs bg-white/90 backdrop-blur-md border-l border-white/60 shadow-2xl p-4 flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Your Writing Map
              </p>
              <h2 className="text-lg font-bold text-gray-900">
                Vocabulary · Detail · Logic
              </h2>
              <p className="text-xs text-gray-600">
                Drop a pin anywhere to start a new writing adventure. When you finish, this map will grow with colorful, sharper scenes.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Vocabulary Richness</span>
                  <span className="text-[11px] text-gray-500">More words → more colors</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full w-2/12 bg-gradient-to-r from-gray-300 via-sky-400 to-emerald-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Descriptive Accuracy</span>
                  <span className="text-[11px] text-gray-500">More detail → clearer map</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full w-2/12 bg-gradient-to-r from-gray-400 via-indigo-400 to-purple-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Logical Coherence</span>
                  <span className="text-[11px] text-gray-500">Better logic → tidy layout</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full w-2/12 bg-gradient-to-r from-slate-400 via-emerald-400 to-emerald-600" />
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <Button
                onClick={handleStartJourney}
                disabled={!pinPosition}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white border-0 shadow-lg"
              >
                {pinPosition ? "Continue" : "Tap map to place a pin"}
              </Button>
              <p className="text-[11px] text-gray-500 text-center">
                Each time you finish a piece, we&apos;ll plant a new flag here and gently upgrade your map art.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
