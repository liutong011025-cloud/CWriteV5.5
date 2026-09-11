"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import StageHeader from "@/components/stage-header"
import PixelPage from "@/components/pixel/pixel-page"

interface LetterGameNoAiProps {
  recipient: string
  occasion: string
  onComplete: (sections: string[]) => void
  onBack: () => void
  userId?: string
  onDraftChange?: (text: string) => void
}

// 默认的信件结构
const LETTER_SECTIONS = [
  { name: "Greeting", emoji: "👋", placeholder: "Dear [name], Hello! How are you?" },
  { name: "Opening", emoji: "💬", placeholder: "I'm writing to tell you..." },
  { name: "Body", emoji: "📝", placeholder: "Here's what I want to share..." },
  { name: "Closing", emoji: "💝", placeholder: "I hope to hear from you soon!" },
  { name: "Signature", emoji: "✍️", placeholder: "Love, [Your name]" }
]

export default function LetterGameNoAi({
  recipient,
  occasion,
  onComplete,
  onBack,
  userId,
  onDraftChange,
}: LetterGameNoAiProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>({})

  const currentSectionText = sectionTexts[currentSection] || ""

  const handleTextChange = (text: string) => {
    setSectionTexts(prev => ({ ...prev, [currentSection]: text }))
    if (onDraftChange) {
      const merged = { ...sectionTexts, [currentSection]: text }
      const allText = Object.values(merged).join(" ")
      onDraftChange(allText)
    }
  }

  const handleNext = () => {
    if (currentSection < LETTER_SECTIONS.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  const handleFinish = () => {
    const sections = LETTER_SECTIONS.map((_, index) => sectionTexts[index] || "")
    onComplete(sections)
  }

  const canFinish = LETTER_SECTIONS.every((_, index) => {
    const text = sectionTexts[index] || ""
    const testPattern = `test${index + 1}`
    if (text.toLowerCase().trim() === testPattern.toLowerCase()) return true
    return text.trim().length > 0
  })

  const progress = (Object.keys(sectionTexts).filter(key => sectionTexts[Number(key)]?.trim().length > 0).length / LETTER_SECTIONS.length) * 100

  return (
    <PixelPage style={{ paddingTop: "120px", paddingBottom: "120px" }} className="py-6 px-4">
      <div className="max-w-7xl mx-auto relative">
        <StageHeader onBack={onBack} />

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center items-center gap-3">
            <Mail className="w-12 h-12 animate-bounce" style={{ color: "#e8c547" }} />
            <h1 className="text-4xl md:text-5xl font-black pixel-title" style={{ color: "#6b5210", textShadow: "2px 2px 0 rgba(0,0,0,0.15)" }}>
              Write Your Letter
            </h1>
          </div>
          <div className="pixel-card px-6 py-3 inline-block shadow-lg mb-4" style={{ background: "#f5e6c8" }}>
            <p className="text-lg pixel-text" style={{ color: "#5a4a2a" }}>
              To: <span className="font-bold" style={{ color: "#6b5210" }}>{recipient}</span>
            </p>
            <p className="text-sm pixel-text mt-1" style={{ color: "#6b5210" }}>
              💭 {occasion}
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6 pixel-panel p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold pixel-text" style={{ color: "#6b5210" }}>📊 Your Progress</h3>
            <div className="text-2xl font-bold pixel-text" style={{ color: "#5a9a32" }}>{Math.round(progress)}%</div>
          </div>
          <div className="w-full h-4 overflow-hidden" style={{ background: "#d9c9a6", border: "3px solid #8b6914" }}>
            <div
              className="h-4 transition-all duration-500"
              style={{ background: "linear-gradient(90deg, #7ec850, #5a9a32)", width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-4 gap-2">
            {LETTER_SECTIONS.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  currentSection === index
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white scale-105 shadow-lg"
                    : sectionTexts[index]?.trim().length > 0
                    ? "bg-green-100 text-green-700 border-2 border-green-300"
                    : "bg-gray-100 text-gray-600 border-2 border-gray-200"
                }`}
              >
                <div className="text-lg mb-1">{section.emoji}</div>
                <div className="text-xs">{section.name}</div>
                {sectionTexts[index]?.trim().length > 0 && (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 主写作区域 */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* 左侧：写作区 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-4 border-pink-300 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{LETTER_SECTIONS[currentSection].emoji}</span>
                <h2 className="text-2xl font-bold text-pink-700">
                  {LETTER_SECTIONS[currentSection].name}
                </h2>
              </div>
              
              <Textarea
                value={currentSectionText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={LETTER_SECTIONS[currentSection].placeholder.replace('[name]', recipient)}
                className="w-full min-h-[300px] p-4 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-2 focus:ring-pink-300 focus:outline-none resize-y text-base"
                style={{ fontFamily: 'var(--font-comic-neue)' }}
              />
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  {currentSectionText.trim().length} characters
                </p>
                <div className="flex gap-2">
                  {currentSection > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="border-2 border-gray-300"
                    >
                      ← Previous
                    </Button>
                  )}
                  {currentSection < LETTER_SECTIONS.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinish}
                      disabled={!canFinish}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Finish Letter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PixelPage>
  )
}

