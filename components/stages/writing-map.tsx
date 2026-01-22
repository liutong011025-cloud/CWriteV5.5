"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

type WriteType = "story" | "bookReview" | "letter"
type FavoriteCategory = "movie" | "book" | "game"

export interface MapStep {
  id: string
  label: string
  stage: string
  status: "locked" | "available" | "done"
}

interface WritingMapProps {
  language: Language
  writeType: WriteType
  level: number
  favorite: { category: FavoriteCategory; title: string }
  steps: MapStep[]
  mapImageUrl: string | null
  onGenerateImage: (url: string | null) => void
  onSelectStage: (stage: string) => void
  onBack: () => void
  userId?: string
}

const translations = {
  en: {
    title: "Choose Your Quest",
    subtitle: "Pick a task to start or continue.",
    levelTag: "Guidance Level",
    loading: "Summoning your map...",
    regenerate: "Regenerate Map",
    back: "Back",
  },
  zh: {
    title: "选择你的关卡",
    subtitle: "选择一个任务开始或继续。",
    levelTag: "引导等级",
    loading: "正在生成你的地图...",
    regenerate: "重新生成地图",
    back: "返回",
  },
}

const getPrompt = (writeType: WriteType, favorite: { category: FavoriteCategory; title: string }) => {
  const categoryText =
    favorite.category === "movie" ? "movie" : favorite.category === "book" ? "book" : "game"
  const typeText = writeType === "story" ? "story" : writeType === "bookReview" ? "book review" : "letter"
  return `A whimsical fantasy adventure map with a winding road in the center, inspired by the ${categoryText} "${favorite.title}" and a ${typeText} writing quest. Rich details, colorful landmarks, soft lighting, suitable for kids.`
}

export default function WritingMap({
  language,
  writeType,
  level,
  favorite,
  steps,
  mapImageUrl,
  onGenerateImage,
  onSelectStage,
  onBack,
  userId,
}: WritingMapProps) {
  const t = translations[language] || translations.en
  const [isLoading, setIsLoading] = useState(false)
  const prompt = useMemo(() => getPrompt(writeType, favorite), [writeType, favorite])

  useEffect(() => {
    if (mapImageUrl) return
    const generate = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            aspect_ratio: "16:9",
            user_id: userId,
            stage: "map",
          }),
        })
        const data = await response.json()
        if (data?.imageUrl) {
          onGenerateImage(data.imageUrl)
        }
      } catch (error) {
        console.error("Error generating map image:", error)
      } finally {
        setIsLoading(false)
      }
    }
    generate()
  }, [mapImageUrl, onGenerateImage, prompt, userId])

  return (
    <div className="min-h-screen bg-slate-900 px-4 pt-24 pb-10">
      <div className="max-w-6xl mx-auto text-white mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">{t.title}</h2>
          <p className="text-sm text-slate-200">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide bg-white/10 px-3 py-2 rounded-full">
            {t.levelTag}: Level {level}
          </span>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/30 text-white hover:bg-white/10"
          >
            {t.back}
          </Button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="aspect-[16/9] bg-slate-800 flex items-center justify-center">
          {mapImageUrl ? (
            <img src={mapImageUrl} alt="Adventure map" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-200">
              {isLoading ? t.loading : t.loading}
            </div>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full">
            {steps.map((step, index) => {
              const leftPercent = 15 + index * (70 / Math.max(steps.length - 1, 1))
              const topPercent = 50 + (index % 2 === 0 ? -10 : 10)
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => step.status !== "locked" && onSelectStage(step.stage)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-xl pointer-events-auto transition-all ${
                    step.status === "done"
                      ? "bg-emerald-400 text-slate-900"
                      : step.status === "available"
                      ? "bg-yellow-300 text-slate-900 hover:scale-105"
                      : "bg-slate-500 text-slate-200 opacity-60 cursor-not-allowed"
                  }`}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                >
                  {step.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            if (mapImageUrl) {
              onGenerateImage(null)
            }
          }}
          className="border-white/30 text-white hover:bg-white/10"
        >
          {t.regenerate}
        </Button>
      </div>
    </div>
  )
}
