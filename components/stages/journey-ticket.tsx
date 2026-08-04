"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import type { Language } from "@/app/page"
import Image from "next/image"

export type JourneyType = "story" | "bookReview" | "letter" | "drama" | "poetry"

interface JourneyTicketProps {
  language?: Language
  userName: string
  level: number
  score: number
  onStart: (selection: { type: JourneyType; difficulty: number }) => void
  onBack?: () => void
  onRetest?: () => void
}

const journeyOptions = [
  { id: "story" as const, title: "Story", icon: "📖", accent: "#c4a574", border: "#8b6914" },
  { id: "bookReview" as const, title: "Book Review", icon: "📝", accent: "#87ceeb", border: "#3a8aa3" },
  { id: "letter" as const, title: "Letter", icon: "✉️", accent: "#7ec850", border: "#3d8a3d" },
  { id: "drama" as const, title: "Drama", icon: "🎭", accent: "#e8c547", border: "#a58b3d" },
  { id: "poetry" as const, title: "Poetry", icon: "🪶", accent: "#dda0dd", border: "#9932cc" },
]

const TICKET = {
  paper: "linear-gradient(180deg, #fffdf6 0%, #fff8ea 45%, #f5e6c8 100%)",
  border: "#6b5210",
  label: "#8b6914",
  value: "#5a4a2a",
  muted: "#7a6a4a",
  accent: "#5a9a32",
  perforation: "#c9b896",
  stub: "#f0e4cc",
}

export default function JourneyTicket({
  userName,
  level,
  score,
  onStart,
  onBack,
  onRetest,
}: JourneyTicketProps) {
  const [selectedType, setSelectedType] = useState<JourneyType | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [isDeparting, setIsDeparting] = useState(false)
  const [isFireworks, setIsFireworks] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showStamp, setShowStamp] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const notice = useMemo(() => {
    if (!difficulty) return ""
    const gap = difficulty - level
    if (gap < 0) {
      if (Math.abs(gap) >= 3) return "This looks much easier than your level. Want a bigger challenge?"
      return "This might be a little too easy. Want a bigger challenge?"
    }
    if (gap > 0) {
      if (gap >= 3) return "This looks much harder than your level. You can try, but it may be tough."
      return "This might be a bit challenging. Are you sure you want to try it?"
    }
    return "Great match for your current level."
  }, [difficulty, level])

  const handleStart = () => {
    if (!selectedType || !difficulty) return
    onStart({ type: selectedType, difficulty })
    setShowStamp(true)
    setIsDeparting(true)
  }

  const handleDropType = (type: JourneyType) => {
    setSelectedType(type)
    setDragOver(false)
    setIsFireworks(true)
    window.setTimeout(() => setIsFireworks(false), 1100)
  }

  const selectType = (type: JourneyType) => {
    setSelectedType(type)
    setIsFireworks(true)
    window.setTimeout(() => setIsFireworks(false), 900)
  }

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme">
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #b8e4f9 0%, #87ceeb 28%, #7ec850 68%, #5a9a32 100%)",
        }}
      />

      <div
        className="relative z-10 min-h-screen px-4 md:px-8 xl:px-14 py-8 md:py-10"
        style={{ paddingTop: "var(--stage-top-padding)", paddingBottom: "var(--stage-bottom-padding)" }}
      >
        {onBack && <BackButton onClick={onBack} variant="purple" aria-label="Back to Map" />}

        <div className="mb-5 md:mb-6 text-center max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl xl:text-5xl font-black mb-2 pixel-title"
            style={{ color: "#8b6914", textShadow: "3px 3px 0 #6b5210, 4px 4px 0 rgba(0,0,0,0.15)" }}
          >
            Your Journey Ticket
          </h1>
          <p className="text-sm md:text-base pixel-text" style={{ color: "#5a4a2a" }}>
            Pick a writing type on your boarding pass, set difficulty, then depart.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div
            className={`relative overflow-hidden ${isDeparting ? "animate-ticket-tear" : ""}`}
            style={{
              background: TICKET.paper,
              border: `4px solid ${TICKET.border}`,
              boxShadow:
                "inset -4px -4px 0 0 rgba(201,184,150,0.5), inset 4px 4px 0 0 #fff, 8px 8px 0 0 rgba(0,0,0,0.18)",
            }}
          >
            {/* Header strip */}
            <div
              className="flex items-center justify-between gap-3 px-5 md:px-7 py-3 md:py-3.5 border-b-4"
              style={{ borderColor: TICKET.border, background: "rgba(255,253,246,0.85)" }}
            >
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <span
                  className="text-base md:text-lg uppercase tracking-[0.15em] font-bold px-3 py-1.5 pixel-chip"
                  style={{ color: TICKET.label, background: "#e8d4a8" }}
                >
                  Boarding Pass
                </span>
                <span className="text-base md:text-lg uppercase tracking-widest font-bold pixel-text" style={{ color: TICKET.muted }}>
                  CW · LUNA AIR
                </span>
              </div>
              <span
                className={`text-3xl md:text-4xl xl:text-5xl ${isDeparting ? "plane-flyaway" : ""}`}
                style={{ imageRendering: "pixelated" }}
                aria-hidden
              >
                ✈️
              </span>
            </div>

            {/* Stamp */}
            {showStamp && difficulty && (
              <div
                className="absolute top-14 right-4 md:right-8 z-50 pointer-events-none"
                style={{ animation: "stamp 0.6s ease-out" }}
              >
                <div className="relative">
                  <Image
                    src="/logo.webp"
                    alt=""
                    width={100}
                    height={100}
                    className="opacity-90"
                    style={{ filter: "sepia(100%) saturate(200%) hue-rotate(30deg)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-extrabold pixel-text" style={{ color: TICKET.label }}>
                      Lv {difficulty}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isFireworks && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <div className="relative">
                  <div className="ticket-firework" />
                  <div className="ticket-firework ticket-firework-delayed" />
                  <div className="ticket-firework-label">
                    {selectedType ? journeyOptions.find((o) => o.id === selectedType)?.title : "Journey"}
                  </div>
                </div>
              </div>
            )}

            {/* Unified body */}
            <div className="flex flex-col md:flex-row md:items-stretch">
              {/* Left stub — journey types */}
              <div
                className="md:w-[180px] xl:w-[200px] shrink-0 p-4 md:p-5 flex flex-col gap-3 border-b-4 md:border-b-0 md:border-r-4 border-dashed"
                style={{ background: TICKET.stub, borderColor: TICKET.perforation }}
              >
                <p
                  className="text-lg md:text-xl uppercase tracking-widest font-bold pixel-text text-center"
                  style={{ color: TICKET.label }}
                >
                  Pick Journey
                </p>
                <div className="flex flex-row md:flex-col gap-2 md:gap-2.5 w-full overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                  {journeyOptions.map((option, idx) => {
                    const isSelected = selectedType === option.id
                    return (
                      <div
                        key={option.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", option.id)
                          e.dataTransfer.effectAllowed = "move"
                          setIsDragging(true)
                        }}
                        onDragEnd={() => {
                          setIsDragging(false)
                          setDragOver(false)
                        }}
                        onClick={() => selectType(option.id)}
                        className="flex-1 md:flex-none min-w-[88px] md:min-w-0 cursor-pointer transition-all pixel-btn"
                        style={{
                          background: option.accent,
                          borderColor: option.border,
                          padding: "8px 10px",
                          transform: isSelected ? "translate(-2px, -2px)" : undefined,
                          boxShadow: isSelected
                            ? `inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.35), 4px 4px 0 rgba(0,0,0,0.25), 0 0 0 3px ${TICKET.accent}`
                            : "inset -2px -2px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.25), 3px 3px 0 rgba(0,0,0,0.2)",
                          animation: !isSelected ? `pixel-bounce 2s ease-in-out infinite ${idx * 0.12}s` : undefined,
                        }}
                      >
                        <div className="flex md:flex-col items-center justify-center gap-1 md:gap-1.5">
                          <span className="text-xl md:text-2xl leading-none" style={{ imageRendering: "pixelated" }}>
                            {option.icon}
                          </span>
                          <span className="text-xs md:text-sm font-extrabold text-white pixel-text text-center leading-tight">
                            {option.title}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div
                  className="p-2.5 md:p-3 text-center"
                  style={{
                    background: "#fffdf6",
                    border: `3px dashed ${TICKET.label}`,
                    boxShadow: "inset 2px 2px 0 #fff",
                  }}
                >
                  <p className="text-sm md:text-base font-extrabold pixel-text leading-snug" style={{ color: TICKET.label }}>
                    Drag to stamp →
                  </p>
                  <p className="text-xs md:text-sm font-semibold pixel-text mt-1" style={{ color: TICKET.muted }}>
                    or tap a type
                  </p>
                </div>
              </div>

              {/* Perforation */}
              <div
                className="hidden md:flex flex-col items-center justify-center w-3 shrink-0 relative"
                style={{ background: TICKET.paper }}
                aria-hidden
              >
                <div
                  className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                  style={{ background: "#87ceeb", border: `3px solid ${TICKET.border}` }}
                />
                <div className="h-full w-0 border-l-4 border-dashed" style={{ borderColor: TICKET.perforation }} />
                <div
                  className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                  style={{ background: "#87ceeb", border: `3px solid ${TICKET.border}` }}
                />
              </div>

              {/* Main ticket body */}
              <div className="flex-1 p-5 md:p-6 md:pl-5 min-w-0">
                <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-5">
                  <div>
                    <p className="text-base md:text-lg uppercase tracking-widest font-bold pixel-text mb-1" style={{ color: TICKET.label }}>
                      Passenger
                    </p>
                    <p className="text-2xl md:text-3xl xl:text-4xl font-bold pixel-text truncate leading-tight" style={{ color: TICKET.value }}>
                      {userName}
                    </p>
                  </div>
                  <div>
                    <p className="text-base md:text-lg uppercase tracking-widest font-bold pixel-text mb-1" style={{ color: TICKET.label }}>
                      Writing Level
                    </p>
                    <p className="text-2xl md:text-3xl xl:text-4xl font-bold pixel-text leading-tight" style={{ color: TICKET.accent }}>
                      Level {level}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <p className="text-base md:text-lg pixel-text font-semibold" style={{ color: TICKET.muted }}>
                        Score {score}/7
                      </p>
                      {onRetest && (
                        <button
                          type="button"
                          className="px-4 py-1.5 text-sm md:text-base font-bold text-white pixel-btn pixel-btn-blue"
                          onClick={onRetest}
                        >
                          Retest
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-base md:text-lg uppercase tracking-widest font-bold pixel-text mb-1" style={{ color: TICKET.label }}>
                      Journey
                    </p>
                    <p className="text-2xl md:text-3xl xl:text-4xl font-bold pixel-text leading-tight" style={{ color: TICKET.value }}>
                      {selectedType ? journeyOptions.find((o) => o.id === selectedType)?.title : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
                  {[
                    ["Flight", "YL-2024"],
                    ["Gate", "LUNA"],
                    ["Seat", "A1"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="p-3 md:p-4 text-center"
                      style={{
                        background: "#fffdf6",
                        border: `3px solid ${TICKET.border}`,
                        boxShadow: "inset 2px 2px 0 #fff, 2px 2px 0 rgba(0,0,0,0.08)",
                      }}
                    >
                      <p className="text-sm md:text-base uppercase tracking-widest font-bold mb-1" style={{ color: TICKET.label }}>
                        {label}
                      </p>
                      <p className="text-xl md:text-2xl xl:text-3xl font-bold pixel-text leading-tight" style={{ color: TICKET.value }}>
                        {val}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 lg:items-stretch">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-sm md:text-base uppercase tracking-widest font-bold mb-2.5 pixel-text" style={{ color: TICKET.label }}>
                      Choose Difficulty
                    </p>
                    <div className="flex flex-wrap gap-2.5 md:gap-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDifficulty(value)}
                          className={`min-w-[48px] px-5 py-2.5 md:px-6 md:py-3 font-bold text-base md:text-lg transition-all pixel-btn ${
                            difficulty === value ? "pixel-btn-green pixel-selected" : "pixel-btn-wood"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    {notice && (
                      <p className="mt-2.5 text-sm md:text-base font-semibold pixel-text leading-relaxed" style={{ color: "#a58b3d" }}>
                        {notice}
                      </p>
                    )}

                    <div className="mt-4 md:mt-5 pt-3 border-t-4" style={{ borderColor: TICKET.perforation }}>
                      <Button
                        onClick={handleStart}
                        size="lg"
                        disabled={!selectedType || !difficulty}
                        className="w-full pixel-btn pixel-btn-green text-lg md:text-xl xl:text-2xl font-bold py-4 md:py-5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderRadius: 0, textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
                      >
                        ✈️ Start
                      </Button>
                      {(!selectedType || !difficulty) && (
                        <p className="mt-2 text-center text-sm md:text-base font-semibold pixel-text" style={{ color: TICKET.muted }}>
                          {!selectedType ? "Pick a journey type and stamp it" : "Choose a difficulty level"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tear-off stub: barcode + stamp */}
                  <div
                    className="lg:w-[210px] xl:w-[230px] shrink-0 p-4 md:p-5 flex flex-row lg:flex-col items-center justify-center gap-5"
                    style={{
                      background: TICKET.stub,
                      border: `4px dashed ${TICKET.label}`,
                    }}
                  >
                    <div className="flex-1 lg:flex-none w-full text-center">
                      <p className="text-xs md:text-sm uppercase tracking-widest font-bold mb-2" style={{ color: TICKET.label }}>
                        Boarding
                      </p>
                      <div
                        className="h-11 md:h-12 mx-auto max-w-[180px]"
                        style={{
                          background: `repeating-linear-gradient(90deg, ${TICKET.value} 0px, ${TICKET.value} 3px, transparent 3px, transparent 6px)`,
                        }}
                      />
                      <p className="mt-2 text-xs uppercase tracking-widest font-bold" style={{ color: TICKET.label }}>
                        Code
                      </p>
                      <p className="text-sm md:text-base font-bold pixel-text" style={{ color: TICKET.value }}>
                        CW-LUNA
                      </p>
                    </div>

                    <div className="flex flex-col items-center w-full">
                      <p className="text-sm md:text-base uppercase tracking-widest font-extrabold mb-2.5 pixel-text text-center" style={{ color: TICKET.label }}>
                        Stamp Here
                      </p>
                      <div
                        className={`w-[88px] h-[88px] md:w-24 md:h-24 flex items-center justify-center text-center text-sm md:text-base font-bold transition-all ${
                          dragOver || isDragging ? "pixel-selected" : selectedType ? "" : "pixel-bounce"
                        }`}
                        style={{
                          background: selectedType ? TICKET.accent : "#fffdf6",
                          border: `4px dashed ${dragOver || isDragging ? TICKET.accent : TICKET.label}`,
                          color: selectedType ? "#fff" : TICKET.label,
                          boxShadow: dragOver
                            ? "0 0 0 4px rgba(90,154,50,0.4)"
                            : "inset 2px 2px 0 rgba(255,255,255,0.8)",
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                          if (!dragOver) setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDragEnter={() => setIsDragging(true)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDragging(false)
                          const id = e.dataTransfer.getData("text/plain") as JourneyType
                          if (id) handleDropType(id)
                        }}
                      >
                        {selectedType ? (
                          <span className="pixel-text leading-tight px-2">
                            {journeyOptions.find((o) => o.id === selectedType)?.title}
                          </span>
                        ) : (
                          <span className="pixel-text text-xs md:text-sm leading-snug px-1">Drop journey here</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer tear line */}
            <div
              className="h-2"
              style={{
                background: `repeating-linear-gradient(90deg, ${TICKET.perforation} 0 8px, transparent 8px 16px)`,
                borderTop: `2px dashed ${TICKET.perforation}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
