"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

type WriteType = "story" | "bookReview" | "letter"

interface WritingTicketProps {
  language: Language
  recommendedLevel: number
  onContinue: (data: { type: WriteType; level: number }) => void
  onBack: () => void
}

const translations = {
  en: {
    title: "Your Writing Ticket",
    subtitle: "Choose what you want to write and confirm your level.",
    typeTitle: "Pick a writing type",
    levelTitle: "Select your level",
    recommended: "Recommended",
    continue: "Enter the Adventure",
    back: "Back",
    typeLabels: {
      story: "Story",
      bookReview: "Book Review",
      letter: "Letter",
    },
    levelHint: "Level 1 = detailed guidance, Level 5 = light guidance.",
    lowerConfirm: "This level looks easier than your test result. Try a higher level?",
    higherConfirm: "This level looks harder than your test result. Are you sure?",
  },
  zh: {
    title: "你的写作门票",
    subtitle: "选择写作类型并确认 Level。",
    typeTitle: "选择写作类型",
    levelTitle: "选择 Level",
    recommended: "推荐",
    continue: "进入冒险",
    back: "返回",
    typeLabels: {
      story: "故事",
      bookReview: "书评",
      letter: "书信",
    },
    levelHint: "Level 1 = 细致引导，Level 5 = 轻量引导。",
    lowerConfirm: "这个 Level 比测验结果更简单，要不要试试更难的？",
    higherConfirm: "这个 Level 比测验结果更难，你确定这个难度吗？",
  },
}

export default function WritingTicket({ language, recommendedLevel, onContinue, onBack }: WritingTicketProps) {
  const t = translations[language] || translations.en
  const [selectedType, setSelectedType] = useState<WriteType | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number>(recommendedLevel)

  const levels = useMemo(() => [1, 2, 3, 4, 5], [])

  const handleContinue = () => {
    if (!selectedType) return
    if (selectedLevel < recommendedLevel) {
      const shouldContinue = window.confirm(t.lowerConfirm)
      if (!shouldContinue) return
    }
    if (selectedLevel > recommendedLevel) {
      const shouldContinue = window.confirm(t.higherConfirm)
      if (!shouldContinue) return
    }
    onContinue({ type: selectedType, level: selectedLevel })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-6 pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900 mb-3">{t.title}</h2>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <div className="bg-white/90 rounded-2xl p-6 border border-blue-200 shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.typeTitle}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {(["story", "bookReview", "letter"] as WriteType[]).map((type) => {
              const isActive = selectedType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-2xl border px-4 py-6 text-lg font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg"
                      : "bg-white border-gray-200 text-gray-700 hover:border-purple-300"
                  }`}
                >
                  {t.typeLabels[type]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-6 border border-purple-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.levelTitle}</h3>
          <p className="text-sm text-gray-600 mb-4">{t.levelHint}</p>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => {
              const isActive = selectedLevel === level
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`px-6 py-3 rounded-full text-base font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-white border border-purple-200 text-gray-700 hover:border-purple-400"
                  }`}
                >
                  Level {level}
                  {level === recommendedLevel && (
                    <span className="ml-2 text-xs font-bold uppercase tracking-wide">
                      {t.recommended}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-2 border-gray-300 text-gray-700 bg-white/80 px-8 py-3 rounded-full"
          >
            {t.back}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-10 py-3 rounded-full text-lg font-bold disabled:opacity-50"
          >
            {t.continue}
          </Button>
        </div>
      </div>
    </div>
  )
}
