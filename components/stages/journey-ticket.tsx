"use client"

import { useMemo, useState, useEffect, useRef } from "react"
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
  {
    id: "story",
    title: "Story",
    icon: "📖",
    pixelBg: "from-[#c4a574] to-[#9a7b4f]",
    pixelBorder: "#8b6914",
  },
  {
    id: "bookReview",
    title: "Book Review",
    icon: "📝",
    pixelBg: "from-[#87ceeb] to-[#5bc0de]",
    pixelBorder: "#3a8aa3",
  },
  {
    id: "letter",
    title: "Letter",
    icon: "✉️",
    pixelBg: "from-[#7ec850] to-[#5a9a32]",
    pixelBorder: "#3d8a3d",
  },
  {
    id: "drama",
    title: "Drama",
    icon: "🎭",
    pixelBg: "from-[#e8c547] to-[#c9a82e]",
    pixelBorder: "#a58b3d",
  },
  {
    id: "poetry",
    title: "Poetry",
    icon: "🪶",
    pixelBg: "from-[#dda0dd] to-[#ba55d3]",
    pixelBorder: "#9932cc",
  },
] as const

/** Labels on dark wood ticket panel — light text for contrast */
const TICKET_LABEL = "#f5e6c8"
const TICKET_VALUE = "#fff8ea"
const TICKET_VALUE_MUTED = "rgba(245, 230, 200, 0.82)"
const TICKET_ACCENT = "#b8f07a"

export default function JourneyTicket({
  language = "en",
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
      if (Math.abs(gap) >= 3) {
        return "This looks much easier than your level. Want a bigger challenge?"
      }
      return "This might be a little too easy. Want a bigger challenge?"
    }
    if (gap > 0) {
      if (gap >= 3) {
        return "This looks much harder than your level. You can try, but it may be tough."
      }
      return "This might be a bit challenging. Are you sure you want to try it?"
    }
    return "Great match for your current level."
  }, [difficulty, level])

  const handleStart = () => {
    if (!selectedType || !difficulty) return
    console.log("=== handleStart called ===")
    console.log("Selected type:", selectedType, "Difficulty:", difficulty)
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

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme">
      {/* Pixel art background with sky and grass gradient */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        {/* Pixel clouds */}
        <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-32 left-[40%] w-20 h-10 bg-white opacity-75" style={{
          clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        
        {/* Pixel decorative elements - grass and flowers */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 5 + Math.random() * 2}%`,
                width: "8px",
                height: `${20 + Math.random() * 16}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`flower-${i}`}
              className="absolute bottom-4"
              style={{
                left: `${10 + i * 12}%`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{
                background: ["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4],
                boxShadow: `3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, -3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 -3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}`
              }} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative z-10 min-h-screen px-4 md:px-6 xl:px-14 py-8 md:py-10 xl:py-24 pl-4 md:pl-8 xl:pl-24"
        style={{ paddingTop: "var(--stage-top-padding)", paddingBottom: "var(--stage-bottom-padding)" }}
      >
        {onBack && <BackButton onClick={onBack} variant="purple" aria-label="Back to Map" />}

        {/* Pixel-style title */}
        <div className="mb-8 text-center md:mb-10 xl:mb-12">
          <h1 className="text-4xl md:text-5xl xl:text-7xl font-black mb-4 md:mb-5 pixel-title" style={{
            color: "#8b6914",
            textShadow: "3px 3px 0 #6b5210, 5px 5px 0 rgba(0,0,0,0.2)"
          }}>
            Your Journey Ticket
          </h1>
          <p className="text-base md:text-lg xl:text-2xl pixel-text" style={{ color: "#5a4a2a" }}>
            Drag a journey type onto the ticket, then choose your difficulty.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr] gap-6 md:gap-8 xl:gap-10">
          {/* Left side - Journey type cards with pixel styling */}
          <div className="flex flex-col justify-center lg:justify-start">
            <p className="mb-4 md:mb-5 text-sm md:text-[15px] text-center xl:text-left max-w-[320px] pixel-text" style={{ color: "#5a4a2a" }}>
              Choose a type of article you want to write and drag it to the stamp area on the right ticket.
            </p>
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-4 xl:gap-5">
              {journeyOptions.map((option, idx) => {
                const isSelected = selectedType === option.id
                return (
                  <div
                    key={option.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", option.id)
                      event.dataTransfer.effectAllowed = "move"
                      setIsDragging(true)
                    }}
                    onDragEnd={() => {
                      setIsDragging(false)
                      setDragOver(false)
                    }}
                    onClick={() => setSelectedType(option.id)}
                    className={`relative p-3 md:p-4 xl:p-5 cursor-pointer transition-all duration-200 pixel-btn bg-gradient-to-b ${option.pixelBg}`}
                    style={{
                      borderColor: option.pixelBorder,
                      transform: isSelected ? "translate(-2px, -2px)" : undefined,
                      boxShadow: isSelected 
                        ? `inset -3px -3px 0 0 rgba(0,0,0,0.25), inset 3px 3px 0 0 rgba(255,255,255,0.25), 5px 5px 0 0 rgba(0,0,0,0.35), 0 0 0 4px #7ec850` 
                        : undefined,
                      animation: !isSelected ? `pixel-bounce 2s ease-in-out infinite ${idx * 0.15}s` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2 md:gap-3 xl:gap-4">
                      <span className="text-2xl md:text-3xl xl:text-4xl" style={{ imageRendering: "pixelated" }}>{option.icon}</span>
                      <h3 className="text-sm md:text-base xl:text-xl font-extrabold text-white pixel-text">
                        {option.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side - Pixel-style ticket */}
          <div className="max-w-5xl mx-auto">
            <div className={`relative pixel-panel p-5 md:p-7 xl:p-10 ${isDeparting ? "animate-ticket-tear" : ""}`}>
              {/* Stamp effect */}
              {showStamp && difficulty && (
                <div
                  className="absolute top-5 right-5 md:top-6 md:right-6 xl:top-8 xl:right-8 z-50 pointer-events-none"
                  style={{ animation: "stamp 0.6s ease-out" }}
                >
                  <div className="relative">
                    <Image
                      src="/logo.webp"
                      alt="Stamp"
                      width={120}
                      height={120}
                      className="opacity-90"
                      style={{ filter: 'sepia(100%) saturate(200%) hue-rotate(30deg)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl md:text-2xl xl:text-3xl font-extrabold" style={{ color: "#8b6914" }}>Level {difficulty}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pixel-style boarding pass label */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[10px] md:text-[11px] xl:text-xs uppercase tracking-widest px-3 md:px-4 py-1 pixel-chip" style={{ color: TICKET_LABEL }}>
                BOARDING PASS
              </div>

              {/* Pixel holes on sides */}
              <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ background: "#87ceeb", border: "3px solid #6b5210" }} />
              <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ background: "#87ceeb", border: "3px solid #6b5210" }} />

              {isFireworks && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="ticket-firework" />
                    <div className="ticket-firework ticket-firework-delayed" />
                    <div className="ticket-firework-label">
                      {selectedType ? journeyOptions.find((option) => option.id === selectedType)?.title : "Journey"}
                    </div>
                  </div>
                </div>
              )}

              {/* Pixel airplane */}
              <div className={`absolute -top-5 right-5 md:-top-6 md:right-7 xl:-top-7 xl:right-10 text-3xl md:text-4xl xl:text-5xl ${isDeparting ? "plane-flyaway" : ""}`} style={{ imageRendering: "pixelated" }}>
                ✈️
              </div>

              <div className="grid lg:grid-cols-[1.15fr_0.85fr] xl:grid-cols-[1.2fr_0.8fr] gap-5 md:gap-6">
                <div>
                  {/* Passenger info with pixel styling */}
                  <div className="grid md:grid-cols-3 gap-4 md:gap-5 xl:gap-6 items-center">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest pixel-text font-semibold" style={{ color: TICKET_LABEL }}>Passenger</p>
                      <p className="text-xl md:text-[22px] xl:text-2xl font-bold pixel-text" style={{ color: TICKET_VALUE }}>{userName}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest pixel-text font-semibold" style={{ color: TICKET_LABEL }}>Writing Level</p>
                      <p className="text-xl md:text-[22px] xl:text-2xl font-bold pixel-text" style={{ color: TICKET_ACCENT }}>Level {level}</p>
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <p className="text-xs md:text-sm pixel-text" style={{ color: TICKET_VALUE_MUTED }}>Score: {score}/7</p>
                        {onRetest && (
                          <button
                            type="button"
                            className="px-2.5 py-1 text-[11px] md:text-xs font-bold text-white pixel-btn pixel-btn-blue"
                            onClick={onRetest}
                          >
                            Retest
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest pixel-text font-semibold" style={{ color: TICKET_LABEL }}>Journey</p>
                      <p className="text-xl md:text-[22px] xl:text-2xl font-bold pixel-text" style={{ color: TICKET_VALUE }}>
                        {selectedType ? journeyOptions.find((option) => option.id === selectedType)?.title : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Pixel chips for flight info */}
                  <div className="mt-5 md:mt-6 grid sm:grid-cols-3 gap-3 md:gap-4 text-sm">
                    <div className="pixel-card p-2.5 md:p-3">
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: "#8b6914" }}>Flight</p>
                      <p className="text-base md:text-lg font-bold" style={{ color: "#5a4a2a" }}>YL-2024</p>
                    </div>
                    <div className="pixel-card p-2.5 md:p-3">
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: "#8b6914" }}>Gate</p>
                      <p className="text-base md:text-lg font-bold" style={{ color: "#5a4a2a" }}>LUNA</p>
                    </div>
                    <div className="pixel-card p-2.5 md:p-3">
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: "#8b6914" }}>Seat</p>
                      <p className="text-base md:text-lg font-bold" style={{ color: "#5a4a2a" }}>A1</p>
                    </div>
                  </div>

                  {/* Difficulty selector with pixel buttons */}
                  <div className="mt-6 md:mt-7 xl:mt-8">
                    <p className="text-sm uppercase tracking-widest mb-3 pixel-text font-semibold" style={{ color: TICKET_LABEL }}>Choose Difficulty</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => setDifficulty(value)}
                          className={`px-4 py-1.5 md:px-5 md:py-2 xl:px-6 font-bold text-xs md:text-sm transition-all pixel-btn ${
                            difficulty === value
                              ? "pixel-btn-green pixel-selected"
                              : "pixel-btn-wood"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    {notice && <p className="mt-3 text-xs md:text-sm font-semibold pixel-text" style={{ color: "#ffe9a8" }}>{notice}</p>}
                  </div>
                </div>

                {/* Right column - barcode and drop zone */}
                <div className="relative flex flex-col items-center justify-between gap-5 xl:gap-0">
                  {/* Pixel barcode stub */}
                  <div className="w-full max-w-[220px] md:max-w-[240px] pixel-card p-3 md:p-4 text-center">
                    <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#8b6914" }}>Boarding</p>
                    <div className="h-[44px] md:h-[52px] rounded" style={{
                      background: `repeating-linear-gradient(90deg, #5a4a2a 0px, #5a4a2a 3px, transparent 3px, transparent 6px)`
                    }} />
                    <div className="mt-4 text-xs uppercase tracking-widest" style={{ color: "#8b6914" }}>Code</div>
                    <div className="text-sm font-bold" style={{ color: "#5a4a2a" }}>CW-LUNA</div>
                  </div>

                  {/* Drop zone with pixel styling */}
                  <div className="mt-6 flex flex-col items-center">
                    <p className="text-xs uppercase tracking-widest mb-3 pixel-text font-semibold" style={{ color: TICKET_LABEL }}>Drop Type</p>
                    <div
                      className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-center text-[11px] md:text-xs font-bold transition-all ${
                        dragOver || isDragging
                          ? "pixel-selected"
                          : selectedType
                            ? ""
                            : "pixel-bounce"
                      }`}
                      style={{
                        background: selectedType ? "#7ec850" : "#f5e6c8",
                        border: `4px dashed ${dragOver || isDragging ? "#7ec850" : "#8b6914"}`,
                        boxShadow: dragOver || isDragging 
                          ? "0 0 0 4px rgba(126, 200, 80, 0.4), inset 0 0 10px rgba(126, 200, 80, 0.2)" 
                          : "inset 2px 2px 0 rgba(0,0,0,0.1)",
                        color: selectedType ? "#fff" : "#8b6914",
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = "move"
                        if (!dragOver) setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDragEnter={() => setIsDragging(true)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setIsDragging(false)
                        const id = event.dataTransfer.getData("text/plain") as JourneyType
                        if (id) {
                          handleDropType(id)
                        }
                      }}
                    >
                      {selectedType ? (
                        <div className="text-xs md:text-sm font-bold pixel-text">
                          {journeyOptions.find((option) => option.id === selectedType)?.title}
                        </div>
                      ) : (
                        <div className="pixel-text">Drop Here</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-3 md:mt-4">
              <Button
                onClick={handleStart}
                size="lg"
                disabled={!selectedType || !difficulty}
                className="pixel-btn pixel-btn-green text-base md:text-lg xl:text-2xl font-bold py-4 md:py-[18px] xl:py-5 px-8 md:px-10 xl:px-14 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderRadius: 0,
                  textShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                ✈️ Start
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
