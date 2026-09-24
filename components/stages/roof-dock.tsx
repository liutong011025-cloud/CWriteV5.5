"use client"

import { useState } from "react"
import {
  DEFAULT_ROOF_LAYOUT,
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
  onLayoutChange: (layout: RoofLayout) => void
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
  onLayoutChange,
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
  const [showTuner, setShowTuner] = useState(true)
  const [copied, setCopied] = useState(false)
  const height = roofHeightFromWidth(layout.roofWidth)
  const levelLabel = level ? `Level ${level}` : "Test"

  const updatePin = (id: RoofPinId, patch: Partial<RoofLayout["pins"][RoofPinId]>) => {
    onLayoutChange({
      ...layout,
      pins: { ...layout.pins, [id]: { ...layout.pins[id], ...patch } },
    })
  }

  const copyLayout = async () => {
    const text = JSON.stringify(layout, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy these roof layout parameters:", text)
    }
  }

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

      <div className="pointer-events-auto fixed left-4 top-24 z-[90] w-[min(92vw,340px)] rounded-2xl border border-white/40 bg-black/75 p-3 text-xs text-white shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-bold">Roof layout tuner</p>
          <button type="button" className="rounded-full bg-white/15 px-2 py-1" onClick={() => setShowTuner((open) => !open)}>
            {showTuner ? "Hide" : "Show"}
          </button>
        </div>
        {showTuner && (
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            <TunerRow label="roof width" min={80} max={980} value={layout.roofWidth} onChange={(roofWidth) => onLayoutChange({ ...layout, roofWidth })} />
            <TunerRow label="roof right" min={-500} max={800} value={layout.roofRight} onChange={(roofRight) => onLayoutChange({ ...layout, roofRight })} />
            <TunerRow label="roof bottom" min={-500} max={800} value={layout.roofBottom} onChange={(roofBottom) => onLayoutChange({ ...layout, roofBottom })} />
            <TunerRow label="level left %" min={-40} max={140} step={0.1} value={layout.levelLeft} onChange={(levelLeft) => onLayoutChange({ ...layout, levelLeft })} />
            <TunerRow label="level top %" min={-40} max={120} step={0.1} value={layout.levelTop} onChange={(levelTop) => onLayoutChange({ ...layout, levelTop })} />
            <TunerRow label="level font" min={10} max={120} value={layout.levelFont} onChange={(levelFont) => onLayoutChange({ ...layout, levelFont })} />
            {ROOF_PINS.map((pin) => (
              <div key={pin.id} className="rounded-xl bg-white/10 p-2">
                <p className="mb-1 font-semibold">{pin.label}</p>
                <TunerRow label="left %" min={-80} max={120} step={0.1} value={layout.pins[pin.id].left} onChange={(left) => updatePin(pin.id, { left })} />
                <TunerRow label="top %" min={-40} max={140} step={0.1} value={layout.pins[pin.id].top} onChange={(top) => updatePin(pin.id, { top })} />
                <TunerRow label="width %" min={10} max={220} step={0.1} value={layout.pins[pin.id].width} onChange={(width) => updatePin(pin.id, { width })} />
              </div>
            ))}
            <button type="button" onClick={copyLayout} className="w-full rounded-full bg-amber-500 px-3 py-2 font-bold text-black">
              {copied ? "Copied" : "Copy parameters"}
            </button>
            <button type="button" onClick={() => onLayoutChange(DEFAULT_ROOF_LAYOUT)} className="w-full rounded-full bg-white/15 px-3 py-2">
              Reset
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function TunerRow({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-1"
      />
      <input
        type="number"
        value={Number(value.toFixed(1))}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="w-16 rounded bg-white/15 px-1 py-0.5 text-right"
      />
    </label>
  )
}
