"use client"

import { useState } from "react"
import {
  ROOF_PINS,
  roofHeightFromWidth,
  type RoofLayout,
  type RoofPinId,
} from "@/lib/roof-layout"

export type LevelScoreCard = {
  grammarFluency: number
  contentCoverage: number
  stageAlignment: number
  lengthDensity: number
}

export type LevelReport = {
  source: "test" | "ai" | "heuristic" | "choice"
  level: number
  sampleCount: number
  scores: LevelScoreCard | null
  reason: string
}

type RoofDockProps = {
  layout: RoofLayout
  showCoach: boolean
  level: number | null
  suggestedLevel: number | null
  report: LevelReport | null
  levelLoading: boolean
  onChangeLevel: (level: number) => void
  onRequestLevelTest: () => void
  onDragPinStart: (id: RoofPinId) => void
  onDragPinEnd?: () => void
}

const SCORE_ROWS: { key: keyof LevelScoreCard; label: string }[] = [
  { key: "grammarFluency", label: "Grammar & Fluency" },
  { key: "contentCoverage", label: "Content Coverage" },
  { key: "stageAlignment", label: "Stage Alignment" },
  { key: "lengthDensity", label: "Length & Information Density" },
]

export default function RoofDock({
  layout,
  showCoach,
  level,
  suggestedLevel,
  report,
  levelLoading,
  onChangeLevel,
  onRequestLevelTest,
  onDragPinStart,
  onDragPinEnd,
}: RoofDockProps) {
  const [showWhy, setShowWhy] = useState(false)
  const height = roofHeightFromWidth(layout.roofWidth)
  const levelLabel = level ? `Level ${level}` : "Test"

  return (
    <>
      <div
        className="pointer-events-none fixed z-[45]"
        style={{ right: layout.roofRight, bottom: layout.roofBottom, width: layout.roofWidth, height }}
      >
        <img src="/roof.webp" alt="" className="absolute inset-0 h-full w-full object-fill" draggable={false} />

        <button
          type="button"
          onClick={() => {
            if (!level) {
              onRequestLevelTest()
              return
            }
            setShowWhy(true)
          }}
          className="pointer-events-auto absolute z-10 -translate-x-1/2 font-hand font-extrabold text-[#5c3317] drop-shadow-[0_1px_0_rgba(255,248,230,0.9)]"
          style={{ left: `${layout.levelLeft}%`, top: `${layout.levelTop}%`, fontSize: layout.levelFont, lineHeight: 1 }}
          aria-label={level ? "Why this level" : "Take the level check"}
        >
          {levelLoading ? "..." : levelLabel}
        </button>

        {ROOF_PINS.map((pin, index) => {
          const spot = layout.pins[pin.id]
          return (
            <button
              key={pin.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", pin.id)
                event.dataTransfer.effectAllowed = "copy"
                onDragPinStart(pin.id)
              }}
              onDragEnd={() => onDragPinEnd?.()}
              className="pointer-events-auto absolute cursor-grab active:cursor-grabbing"
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
                animation: showCoach ? `roof-pin-breathe 1.6s ease-in-out ${index * 0.28}s infinite` : undefined,
              }}
              aria-label={`Drag ${pin.label} pin onto the map`}
            >
              <img src={pin.src} alt={pin.label} className="h-auto w-full select-none" draggable={false} />
            </button>
          )
        })}
      </div>

      {showWhy && (
        <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close level details" onClick={() => setShowWhy(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border-4 border-[#8b6914] bg-[#fff8ea] p-5 shadow-2xl">
            <h2 className="font-hand text-3xl font-extrabold text-[#5c3317]">Why Level {level}</h2>
            <p className="mt-2 text-base leading-relaxed text-[#5a4a2a]">
              {report?.reason || "This level comes from your level check."}
            </p>
            {report?.scores && (
              <ul className="mt-4 space-y-2">
                {SCORE_ROWS.map((row) => (
                  <li key={row.key} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-[#5c3317]">
                    <span>{row.label}</span>
                    <span>{report.scores?.[row.key]}</span>
                  </li>
                ))}
              </ul>
            )}
            {suggestedLevel && level && suggestedLevel !== level && (
              <p className="mt-3 text-sm text-[#7a5a2a]">The system suggested Level {suggestedLevel}. You can keep your own choice.</p>
            )}
            <p className="mt-4 text-sm font-bold text-[#5c3317]">Choose a level</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChangeLevel(n)}
                  className={`h-11 w-11 rounded-full font-hand text-xl font-extrabold ${
                    n === level ? "bg-[#8b6914] text-white" : "bg-white text-[#5c3317] border-2 border-[#c4a574]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {!level && (
              <button type="button" onClick={onRequestLevelTest} className="mt-4 rounded-full bg-[#8b6914] px-4 py-2 font-bold text-white">
                Take the level check
              </button>
            )}
            <button type="button" onClick={() => setShowWhy(false)} className="mt-4 block text-sm font-bold text-[#8b6914]">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
