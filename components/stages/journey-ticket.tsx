"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

export type JourneyType = "story" | "bookReview" | "letter" | "drama" | "poetry"

interface JourneyTicketProps {
  language?: Language
  userName: string
  level: number
  score: number
  mapImageStatus?: "idle" | "loading" | "ready" | "error"
  onStart: (selection: { type: JourneyType; difficulty: number }) => void
  onBack?: () => void
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
  mapImageStatus = "idle",
  onStart,
  onBack,
}: JourneyTicketProps) {
  const [selectedType, setSelectedType] = useState<JourneyType | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [isDeparting, setIsDeparting] = useState(false)

  const notice = useMemo(() => {
    if (!difficulty) return ""
    if (difficulty < level) {
      return "你确定不要增加一些挑战性吗？"
    }
    if (difficulty > level) {
      return "你确定吗，会有点难哦。"
    }
    return ""
  }, [difficulty, level])

  const handleStart = () => {
    if (!selectedType || !difficulty || mapImageStatus === "loading") return
    setIsDeparting(true)
    window.setTimeout(() => {
      onStart({ type: selectedType, difficulty })
    }, 900)
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
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold"
            >
              ← Back
            </Button>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Your Journey Ticket
          </h1>
          <p className="text-lg md:text-xl text-gray-600">Choose a journey and set your challenge level.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {journeyOptions.map((option) => {
            const isSelected = selectedType === option.id
            return (
              <button
                key={option.id}
                onClick={() => setSelectedType(option.id)}
                className={`relative text-left rounded-3xl border-2 ${option.border} bg-gradient-to-br ${option.bg} p-6 shadow-xl transition-all duration-300 ${
                  isSelected ? "scale-[1.03] ring-4 ring-purple-200" : "hover:scale-[1.02]"
                }`}
              >
                <div className={`absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 ${isSelected ? "opacity-20" : ""}`}>
                  <div className={`w-full h-full bg-gradient-to-r ${option.gradient} rounded-3xl`}></div>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-4xl mb-3">{option.icon}</p>
                    <h3 className={`text-2xl font-bold bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent`}>
                      {option.title}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600 font-semibold px-3 py-1 rounded-full bg-white/70">
                    Ticket
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="max-w-5xl mx-auto">
          <div className={`relative rounded-3xl border-2 border-dashed border-purple-200 bg-white/90 backdrop-blur-lg p-8 shadow-2xl ${isDeparting ? "animate-ticket-tear" : ""}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-xs text-gray-400 bg-white px-4 py-1 rounded-full border">
              Boarding Pass
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-gray-500">Passenger</p>
                <p className="text-2xl font-bold text-gray-800">{userName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-gray-500">Writing Level</p>
                <p className="text-2xl font-bold text-purple-600">Level {level}</p>
                <p className="text-sm text-gray-500">Score: {score}/7</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-gray-500">Journey</p>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedType ? journeyOptions.find((option) => option.id === selectedType)?.title : "—"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">Choose Difficulty</p>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value)}
                    className={`rounded-2xl border-2 px-4 py-3 font-bold transition-all ${
                      difficulty === value
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {notice && <p className="mt-3 text-sm text-orange-600 font-semibold">{notice}</p>}
            </div>
          </div>
        </div>

        <div className="text-center mt-10 space-y-3">
          {mapImageStatus === "loading" && (
            <p className="text-sm text-gray-500">地图生成中，请稍等…</p>
          )}
          {mapImageStatus === "error" && (
            <p className="text-sm text-red-500">地图生成失败，请稍后重试。</p>
          )}
          <Button
            onClick={handleStart}
            size="lg"
            disabled={!selectedType || !difficulty || mapImageStatus !== "ready"}
            className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-90 text-white border-0 shadow-2xl py-6 px-14 text-xl md:text-2xl font-bold hover:scale-105 transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✈️ 启程
          </Button>
        </div>
      </div>
    </div>
  )
}
