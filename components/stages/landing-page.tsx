"use client"

import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

interface LandingPageProps {
  language?: Language
  onStartQuiz?: () => void
}

const translations = {
  en: {
    title: "Welcome to CWrite",
    subtitle: "A creative writing platform powered by AI guidance and student voice",
    highlights: [
      "Personalized writing journeys",
      "Encouraging guidance at every step",
      "Stories, book reviews, and letters",
    ],
    cta: "Let's Write",
  },
  zh: {
    title: "欢迎来到 CWrite",
    subtitle: "一个以 AI 引导与学生表达为核心的创意写作平台",
    highlights: [
      "个性化写作旅程",
      "循序渐进的鼓励式引导",
      "故事、书评与书信创作",
    ],
    cta: "Let's Write",
  },
}

export default function LandingPage({ language = "en", onStartQuiz }: LandingPageProps) {
  const t = translations[language] || translations.en

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
          {t.title}
        </h1>
        <p className="text-lg md:text-2xl text-gray-700 mb-10">
          {t.subtitle}
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {t.highlights.map((item) => (
            <div
              key={item}
              className="bg-white/80 backdrop-blur-lg border border-purple-200 rounded-2xl p-5 text-gray-700 font-semibold shadow-lg"
            >
              {item}
            </div>
          ))}
        </div>

        <Button
          size="lg"
          onClick={onStartQuiz}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-2xl py-7 px-16 text-2xl font-bold rounded-full"
        >
          {t.cta}
        </Button>
      </div>
    </div>
  )
}
