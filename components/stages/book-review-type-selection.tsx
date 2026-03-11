"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Language } from "@/app/page"

interface BookReviewTypeSelectionProps {
  language?: Language
  /**
   * 如果有 bookTitle，表示已經選好書：
   * - 此時本頁使用 Dify 根據書名推薦最適合的書評類型
   * - 並為三種書評類型各生成一條英文引導問題
   * 如果沒有 bookTitle，退回到舊版「三扇門」靜態介紹，主要給 noAi 流程用。
   */
  bookTitle?: string
  onSelectType?: (type: "recommendation" | "critical" | "literary") => void
  onBack?: () => void
}

const translations = {
  en: {
    title: "Choose Your Review Style",
    subtitle: "Pick the door that calls to you! 🚪✨",
    back: "← Back",
    chooseButton: "Choose This Style ✨",
    recommendation: {
      name: "Recommendation Review",
      description: "Share why you love a book and recommend it to others!",
      features: [
        "Tell others why the book is great",
        "Share your favorite parts",
        "Help friends find good books"
      ]
    },
    critical: {
      name: "Critical Review",
      description: "Think deeply about a book and share your honest thoughts!",
      features: [
        "Analyze what works and what doesn't",
        "Share both good and bad points",
        "Think like a real critic"
      ]
    },
    literary: {
      name: "Literary Review",
      description: "Explore the deeper meaning and beauty of literature!",
      features: [
        "Discover hidden themes",
        "Appreciate beautiful writing",
        "Understand the author's message"
      ]
    },
  },
  zh: {
    title: "選擇你的書評風格",
    subtitle: "選擇呼喚你的門！🚪✨",
    back: "← 返回",
    chooseButton: "選擇這個風格 ✨",
    recommendation: {
      name: "推薦書評",
      description: "分享你為什麼喜歡一本書並推薦給其他人！",
      features: [
        "告訴其他人為什麼這本書很棒",
        "分享你最喜歡的部分",
        "幫助朋友找到好書"
      ]
    },
    critical: {
      name: "批判書評",
      description: "深入思考一本書並分享你真誠的想法！",
      features: [
        "分析什麼有效什麼無效",
        "分享優點與缺點",
        "像真正的評論家一樣思考"
      ]
    },
    literary: {
      name: "文學書評",
      description: "探索文學的更深層意義與美感！",
      features: [
        "發現隱藏主題",
        "欣賞優美寫作",
        "理解作者的訊息"
      ]
    },
  },
}

const getReviewTypes = (language: Language = "en") => {
  const t = translations[language] || translations.en
  return [
    {
      id: "recommendation" as const,
      name: t.recommendation.name,
      emoji: "⭐",
      image: "/d1.png",
      description: t.recommendation.description,
      features: t.recommendation.features
    },
    {
      id: "critical" as const,
      name: t.critical.name,
      emoji: "🔍",
      image: "/d2.png",
      description: t.critical.description,
      features: t.critical.features
    },
    {
      id: "literary" as const,
      name: t.literary.name,
      emoji: "📚",
      image: "/d3.png",
      description: t.literary.description,
      features: t.literary.features
    }
  ]
}

type ReviewTypeId = "recommendation" | "critical" | "literary"

interface AiTypeSuggestion {
  recommendedType: ReviewTypeId | null
  questions: Record<ReviewTypeId, string>
}

export default function BookReviewTypeSelection({ language = "en", bookTitle, onSelectType, onBack }: BookReviewTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<ReviewTypeId | null>(null)
  const [expandedType, setExpandedType] = useState<ReviewTypeId | null>(null)
  const [hoveredDoor, setHoveredDoor] = useState<string | null>(null)
  const [aiData, setAiData] = useState<AiTypeSuggestion | null>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const t = translations[language] || translations.en
  const reviewTypes = getReviewTypes(language)

  // 如果有 bookTitle，調用 Dify 拿推薦類型與三條問題（英文）
  useEffect(() => {
    if (!bookTitle) {
      setAiData(null)
      setIsLoadingAi(false)
      setAiError(null)
      return
    }
    let cancelled = false
    const fetchAi = async () => {
      setIsLoadingAi(true)
      setAiError(null)
      try {
        const res = await fetch("/api/dify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "book_review_type",
            bookTitle,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to get AI suggestion")
        }
        if (cancelled) return
        const questions: Record<ReviewTypeId, string> = {
          recommendation: data.questions?.recommendation || `Would you like to write a recommendation review of "${bookTitle}" and tell others why they should read it?`,
          critical: data.questions?.critical || `Would you like to write a critical review of "${bookTitle}" and think about both its strengths and weaknesses?`,
          literary: data.questions?.literary || `Would you like to write a literary review of "${bookTitle}" and explore its deeper themes and writing style?`,
        }
        const recommended: ReviewTypeId =
          data.recommendedType === "critical" || data.recommendedType === "literary"
            ? data.recommendedType
            : "recommendation"
        setAiData({
          recommendedType: recommended,
          questions,
        })
      } catch (e) {
        console.error("book_review_type AI error:", e)
        if (cancelled) return
        setAiError("AI suggestion is unavailable. You can still choose any review style.")
        // 提供保底問題
        const fallbackQuestions: Record<ReviewTypeId, string> = {
          recommendation: `Would you like to write a recommendation review of "${bookTitle}" and tell others why they should read it?`,
          critical: `Would you like to write a critical review of "${bookTitle}" and think about both good and not-so-good parts?`,
          literary: `Would you like to write a literary review of "${bookTitle}" and explore its deeper themes and writing style?`,
        }
        setAiData({
          recommendedType: "recommendation",
          questions: fallbackQuestions,
        })
      } finally {
        if (!cancelled) setIsLoadingAi(false)
      }
    }
    fetchAi()
    return () => {
      cancelled = true
    }
  }, [bookTitle])

  const handleCardClick = (type: ReviewTypeId) => {
    setSelectedType(type)
    setExpandedType(type)
  }

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType?.(selectedType)
    }
  }

  const selectedTypeData = expandedType ? reviewTypes.find(t => t.id === expandedType) : null

  // 如果沒有 bookTitle，保留原來的「三扇門」選類型 UI（主要給 noAi 舊流程）
  if (!bookTitle) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* 裝飾背景 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-10 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>
          <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: "128px", paddingBottom: "120px" }}>
          {onBack && (
            <div className="mb-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold"
              >
                {t.back}
              </Button>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-600">{t.subtitle}</p>
          </div>

          <div className="max-w-7xl mx-auto mb-12 relative overflow-x-auto" style={{ minHeight: "600px" }}>
            <div className="flex items-start justify-center gap-12 relative px-4" style={{ minWidth: "fit-content" }}>
              {reviewTypes.map((type, index) => {
                const isHovered = hoveredDoor === type.id
                const isSelected = selectedType === type.id

                let offsetX = 0
                if (selectedType) {
                  const selectedIndex = reviewTypes.findIndex(t => t.id === selectedType)
                  if (index > selectedIndex) {
                    offsetX = 500
                  }
                }

                return (
                  <div
                    key={type.id}
                    className="relative flex-shrink-0 flex flex-col items-center"
                    style={{
                      width: "400px",
                      transition: "transform 0.7s ease-out",
                      transform: `translateX(${offsetX}px)`,
                    }}
                    onMouseEnter={() => setHoveredDoor(type.id)}
                    onMouseLeave={() => setHoveredDoor(null)}
                  >
                    <div className="mb-4 text-center w-full">
                      <div className="inline-block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl px-6 py-3 shadow-lg w-full min-h-[80px] flex items-center justify-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white whitespace-normal break-words text-center">
                          {type.name.split(" ").map((word, i) => (
                            <span key={i}>
                              {word}
                              {i < type.name.split(" ").length - 1 && <br />}
                            </span>
                          ))}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedType(type.id)
                        onSelectType?.(type.id)
                      }}
                      className="w-full relative cursor-pointer transition-all duration-300 hover:scale-105"
                      style={{ height: "550px" }}
                    >
                      <Image src={type.image} alt={type.name} fill className="object-cover" unoptimized />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 有 bookTitle：新 UI——三個框 + AI 問題 + 高亮推薦類型 + 展開詳情
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: '128px', paddingBottom: '120px' }}>
        {/* 返回按钮 */}
        {onBack && (
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold"
            >
              {t.back}
            </Button>
          </div>
        )}

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            {language === "zh"
              ? `你剛剛選擇的書：${bookTitle}。讓 AI 幫你看看哪一種英文書評最適合這本書吧！`
              : `You chose: "${bookTitle}". Let AI help you find the best review style for this book!`}
          </p>
          {isLoadingAi && (
            <p className="mt-3 text-sm text-indigo-600">
              {language === "zh" ? "Cagent 正在為你思考最適合的書評類型..." : "Cagent is thinking about the best review style for this book..."}
            </p>
          )}
          {aiError && (
            <p className="mt-3 text-sm text-red-600">
              {aiError}
            </p>
          )}
        </div>

        {/* 三個書評框 + AI 生成問題 */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid gap-10 md:grid-cols-3">
            {reviewTypes.map(type => {
              const isRecommended = aiData?.recommendedType === type.id
              const question = aiData?.questions?.[type.id] as string | undefined
              const isExpanded = expandedType === type.id

              return (
                <div
                  key={type.id}
                  className={`relative rounded-[32px] p-7 shadow-2xl bg-white/95 border-2 transition-all duration-300 cursor-pointer hover:shadow-[0_18px_40px_rgba(79,70,229,0.18)] ${
                    isExpanded
                      ? "ring-4 ring-blue-300 border-blue-400 scale-[1.02]"
                      : isRecommended
                      ? "border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-200/80"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => handleCardClick(type.id)}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-xs font-bold text-white shadow-md">
                      {language === "zh" ? "這本書最適合" : "Best fit for this book"}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{type.emoji}</span>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        {type.id === "recommendation"
                          ? "Recommendation Review"
                          : type.id === "critical"
                          ? "Critical Review"
                          : "Literary Review"}
                      </p>
                      <h2 className="text-xl font-extrabold text-gray-800 leading-tight">
                        {type.name}
                      </h2>
                    </div>
                  </div>
                  <p className="text-base md:text-lg text-gray-800 mb-5 leading-relaxed font-hand">
                    {question ||
                      (type.id === "recommendation"
                        ? `Would you like to write a recommendation review of "${bookTitle}" to tell others why they should read it?`
                        : type.id === "critical"
                        ? `Would you like to write a critical review of "${bookTitle}" and think about both its strengths and weaknesses?`
                        : `Would you like to write a literary review of "${bookTitle}" and explore its deeper meanings and writing style?`)}
                  </p>

                  {isExpanded && selectedTypeData && selectedTypeData.id === type.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm md:text-base text-gray-700 mb-3">
                        {selectedTypeData.description}
                      </p>
                      <ul className="space-y-2.5 mb-4">
                        {selectedTypeData.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm md:text-base text-gray-700">
                            <span className="mt-0.5 text-lg">✨</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-3">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedType(type.id)
                            onSelectType?.(type.id)
                          }}
                          size="lg"
                          className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 font-bold rounded-full text-sm md:text-base py-5"
                        >
                          {t.chooseButton}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedType(null)
                          }}
                          size="lg"
                          variant="outline"
                          className="flex-1 rounded-full text-sm md:text-base py-5"
                        >
                          {language === "zh" ? "Back" : "Back"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

