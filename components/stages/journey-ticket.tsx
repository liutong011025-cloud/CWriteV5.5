"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
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
    gradient: "from-purple-600 via-pink-600 to-orange-600",
    border: "border-purple-200",
    bg: "from-purple-50 via-pink-50 to-orange-50",
  },
  {
    id: "bookReview",
    title: "Book Review",
    icon: "📝",
    gradient: "from-blue-600 to-cyan-600",
    border: "border-blue-200",
    bg: "from-blue-50 via-cyan-50 to-sky-50",
  },
  {
    id: "letter",
    title: "Letter",
    icon: "✉️",
    gradient: "from-green-600 to-emerald-600",
    border: "border-green-200",
    bg: "from-green-50 via-emerald-50 to-lime-50",
  },
  {
    id: "drama",
    title: "Drama",
    icon: "🎭",
    gradient: "from-rose-600 to-amber-600",
    border: "border-rose-200",
    bg: "from-rose-50 via-amber-50 to-yellow-50",
  },
  {
    id: "poetry",
    title: "Poetry",
    icon: "🪶",
    gradient: "from-indigo-600 to-violet-600",
    border: "border-indigo-200",
    bg: "from-indigo-50 via-violet-50 to-purple-50",
  },
] as const

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
    // 立即触发地图生成（不等待动画）
    console.log("=== handleStart called ===")
    console.log("Selected type:", selectedType, "Difficulty:", difficulty)
    onStart({ type: selectedType, difficulty })
    // 显示动画效果
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 via-orange-50 to-yellow-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: "128px", paddingBottom: "120px" }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-6 top-6 z-20 rounded-full p-0 hover:scale-110 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60"
            aria-label="Back to Map"
          >
            <Image
              src="/back.png"
              alt="Back"
              width={96}
              height={96}
              className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
              priority
              unoptimized
            />
          </button>
        )}

        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Your Journey Ticket
          </h1>
          <p className="text-lg md:text-xl text-gray-600">Drag a journey type onto the ticket, then choose your difficulty.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mb-10">
          {/* BounceCards - 纵向排列在左边 */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex flex-col gap-4">
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
                    className={`relative rounded-3xl border-2 ${option.border} bg-gradient-to-br ${option.bg} p-4 shadow-xl transition-all duration-300 cursor-pointer ${
                      isSelected ? "scale-105 ring-4 ring-purple-200" : "hover:scale-102"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <p className="text-3xl">{option.icon}</p>
                      <h3 className={`text-lg font-bold bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent`}>
                        {option.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className={`relative ticket-pass rounded-[32px] border-2 border-dashed border-purple-200 bg-white/90 backdrop-blur-lg p-8 shadow-2xl ${isDeparting ? "animate-ticket-tear" : ""}`}>
            {/* 盖章特效 */}
            {showStamp && difficulty && (
              <div
                className="absolute top-8 right-8 z-50 pointer-events-none"
                style={{
                  animation: "stamp 0.6s ease-out",
                }}
              >
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Stamp"
                    width={120}
                    height={120}
                    className="opacity-90"
                    style={{
                      filter: 'sepia(100%) saturate(200%) hue-rotate(280deg)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-600">Level {difficulty}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-xs text-gray-400 bg-white px-4 py-1 rounded-full border">
              BOARDING PASS
            </div>
            <div className="ticket-hole ticket-hole-left" aria-hidden="true" />
            <div className="ticket-hole ticket-hole-right" aria-hidden="true" />
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
            <div className={`absolute -top-6 right-10 text-4xl ${isDeparting ? "plane-flyaway" : ""}`}>
              ✈️
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <div>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Passenger</p>
                    <p className="text-2xl font-bold text-gray-800">{userName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Writing Level</p>
                    <p className="text-2xl font-bold text-purple-600">Level {level}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">Score: {score}/7</p>
                      {onRetest && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700"
                          onClick={onRetest}
                        >
                          Retest
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Journey</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {selectedType ? journeyOptions.find((option) => option.id === selectedType)?.title : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="ticket-chip">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Flight</p>
                    <p className="text-lg font-bold text-gray-800">YL-2024</p>
                  </div>
                  <div className="ticket-chip">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Gate</p>
                    <p className="text-lg font-bold text-gray-800">LUNA</p>
                  </div>
                  <div className="ticket-chip">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Seat</p>
                    <p className="text-lg font-bold text-gray-800">A1</p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">Choose Difficulty</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setDifficulty(value)}
                        className={`relative rounded-full px-6 py-2 font-semibold text-sm transition-all ${
                          difficulty === value
                            ? "bg-purple-600 text-white scale-110"
                            : "bg-white text-purple-600 border-2 border-purple-300 hover:border-purple-500"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  {notice && <p className="mt-3 text-sm text-orange-600 font-semibold">{notice}</p>}
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-between">
                <div className="ticket-stub">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">Boarding</p>
                  <div className="ticket-barcode" aria-hidden="true" />
                  <div className="mt-4 text-xs text-gray-400 uppercase tracking-[0.3em]">Code</div>
                  <div className="text-sm font-semibold text-gray-700">CW-LUNA</div>
                </div>

                <div className="mt-6 flex flex-col items-center">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Drop Type</p>
                  <div
                    className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center text-center text-xs font-semibold transition-all ${
                      dragOver || isDragging
                        ? "border-purple-500 bg-purple-50 text-purple-700 scale-105 animate-pulse ring-4 ring-purple-300 ring-opacity-50"
                        : "border-purple-200 text-gray-400"
                    }`}
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
                      <div className="text-sm text-purple-700 font-bold">
                        {journeyOptions.find((option) => option.id === selectedType)?.title}
                      </div>
                    ) : (
                      <div>Drop Here</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="text-center mt-10 space-y-3">
          <Button
            onClick={handleStart}
            size="lg"
            disabled={!selectedType || !difficulty}
            className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-90 text-white border-0 shadow-2xl py-6 px-14 text-xl md:text-2xl font-bold hover:scale-105 transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✈️ Start
          </Button>
        </div>
      </div>
    </div>
  )
}
