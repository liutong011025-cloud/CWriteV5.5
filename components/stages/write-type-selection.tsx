"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

interface WriteTypeSelectionProps {
  language?: Language
  onSelectStory?: () => void
  onSelectBookReview?: () => void
  onSelectLetter?: () => void
  onSelectDrama?: () => void
  onSelectPoetry?: () => void
  onBack?: () => void
}

const translations = {
  en: {
    title: "Choose Your Writing Adventure",
    subtitle: "Pick the type of writing that excites you most!",
    bottomTip: "Each writing type helps you practice different skills. Choose the one that sounds most fun to you!",
    back: "← Back",
    storyTitle: "Story Writing",
    storyDesc: "Create magical stories with help from your AI mentor",
    storyFeatures: [
      "Create unique characters",
      "Build exciting plots",
      "Write amazing adventures",
      "Share your imagination"
    ],
    storyPrompt: "Once upon a time...",
    bookTitle: "Book Review",
    bookDesc: "Write thoughtful book reviews with AI assistance",
    bookFeatures: [
      "Share your opinions",
      "Give reasons and examples",
      "Help others find great books",
      "Practice critical thinking"
    ],
    bookPrompt: "This book is great because...",
    letterTitle: "Letter Writing",
    letterDesc: "Compose letters with creative writing support",
    letterFeatures: [
      "Express your feelings",
      "Share real experiences",
      "Connect with friends",
      "Practice friendly tone"
    ],
    letterPrompt: "Hi! Guess what I did today?",
    dramaTitle: "Drama Writing",
    dramaDesc: "Create drama with characters, scenes and dialogue",
    dramaFeatures: [
      "Create unique characters",
      "Design drama scenes",
      "Write dialogue and thoughts",
      "Visual storytelling"
    ],
    dramaPrompt: "Let's create a drama!",
    poetryTitle: "Poetry Writing",
    poetryDesc: "Write poems in different forms with rhyme and rhetoric help",
    poetryFeatures: [
      "Choose poem forms",
      "Rhyme and syllable tools",
      "Word inspiration",
      "AI feedback"
    ],
    poetryPrompt: "Let's write a poem!"
  },
  zh: {
    title: "選擇你的寫作冒險",
    subtitle: "選擇最令你興奮的寫作類型！",
    bottomTip: "每種寫作類型都幫助你練習不同技能。選擇最有趣的一個！",
    back: "← 返回",
    storyTitle: "故事寫作",
    storyDesc: "在AI導師的幫助下創造魔法故事",
    storyFeatures: [
      "創造獨特角色",
      "構建精彩情節",
      "寫出精彩冒險",
      "分享你的想像"
    ],
    storyPrompt: "從前...",
    bookTitle: "書評",
    bookDesc: "在AI協助下寫出深思熟慮的書評",
    bookFeatures: [
      "分享你的意見",
      "提供理由與例子",
      "幫助其他人找到好書",
      "練習批判性思維"
    ],
    bookPrompt: "這本書好棒因為...",
    letterTitle: "書信寫作",
    letterDesc: "在創意寫作支援下撰寫書信",
    letterFeatures: [
      "表達你的感受",
      "分享真實經歷",
      "與朋友聯繫",
      "練習友好語氣"
    ],
    letterPrompt: "你好！猜猜我今日做了什麼？",
    dramaTitle: "戲劇寫作",
    dramaDesc: "創造包含角色、場景和對話的精彩戲劇",
    dramaFeatures: [
      "創造獨特角色",
      "設計戲劇場景",
      "撰寫對話和思考",
      "視覺敘事"
    ],
    dramaPrompt: "讓我們創作一個戲劇吧！",
    poetryTitle: "詩歌寫作",
    poetryDesc: "用不同詩體寫詩，獲得押韻與修辭建議",
    poetryFeatures: [
      "多種詩體選擇",
      "押韻與音節輔助",
      "修辭與靈感",
      "AI 反饋"
    ],
    poetryPrompt: "一起寫一首詩吧！"
  },
}

const getWritingTypes = (language: Language = "en") => {
  const t = translations[language] || translations.en
  return [
    {
      id: "story",
      title: t.storyTitle,
      icon: "📖",
      description: t.storyDesc,
      gradient: "from-purple-600 via-pink-600 to-orange-600",
      hoverGradient: "from-purple-700 via-pink-700 to-orange-700",
      borderColor: "border-purple-200",
      features: t.storyFeatures,
      prompt: t.storyPrompt
    },
    {
      id: "bookReview",
      title: t.bookTitle,
      icon: "📝",
      description: t.bookDesc,
      gradient: "from-blue-600 to-cyan-600",
      hoverGradient: "from-blue-700 to-cyan-700",
      borderColor: "border-blue-200",
      features: t.bookFeatures,
      prompt: t.bookPrompt
    },
    {
      id: "letter",
      title: t.letterTitle,
      icon: "✉️",
      description: t.letterDesc,
      gradient: "from-green-600 to-emerald-600",
      hoverGradient: "from-green-700 to-emerald-700",
      borderColor: "border-green-200",
      features: t.letterFeatures,
      prompt: t.letterPrompt
    },
    {
      id: "drama",
      title: t.dramaTitle,
      icon: "🎭",
      description: t.dramaDesc,
      gradient: "from-indigo-600 to-purple-600",
      hoverGradient: "from-indigo-700 to-purple-700",
      borderColor: "border-indigo-200",
      features: t.dramaFeatures,
      prompt: t.dramaPrompt
    },
    {
      id: "poetry",
      title: t.poetryTitle,
      icon: "📜",
      description: t.poetryDesc,
      gradient: "from-amber-600 to-rose-600",
      hoverGradient: "from-amber-700 to-rose-700",
      borderColor: "border-amber-200",
      features: t.poetryFeatures,
      prompt: t.poetryPrompt
    }
  ]
}

export default function WriteTypeSelection({ 
  language = "en",
  onSelectStory, 
  onSelectBookReview, 
  onSelectLetter,
  onSelectDrama,
  onSelectPoetry,
  onBack 
}: WriteTypeSelectionProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const t = translations[language] || translations.en
  const writingTypes = getWritingTypes(language)

  const handleSelect = (type: string) => {
    if (type === "story") {
      onSelectStory?.()
    } else if (type === "bookReview") {
      onSelectBookReview?.()
    } else if (type === "letter") {
      onSelectLetter?.()
    } else if (type === "drama") {
      onSelectDrama?.()
    } else if (type === "poetry") {
      onSelectPoetry?.()
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#fffbeb' }}>
      {/* Neo-brutalist subtle pattern background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.03
      }}></div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: '128px', paddingBottom: '120px' }}>
        {/* 返回按钮 - Neo-brutalist */}
        {onBack && (
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#1a1a1a] bg-white hover:bg-[#fef3c7] text-[#1a1a1a] font-bold rounded-full px-6 py-2 transition-all hover:shadow-[3px_3px_0_0_#1a1a1a]"
            >
              {t.back}
            </Button>
          </div>
        )}

        {/* 标题 - Neo-brutalist hero */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-6 rounded-2xl mb-4" style={{
            background: '#3b82f6',
            border: '3px solid #1a1a1a',
            boxShadow: '6px 6px 0 0 #1a1a1a'
          }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white">
              {t.title}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-[#1a1a1a] font-medium mt-4">
            {t.subtitle}
          </p>
        </div>

        {/* 五种写作类型卡片 - Neo-brutalist style */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {writingTypes.map((type, index) => {
            const isHovered = hoveredCard === type.id
            // Neo-brutalist color mapping
            const cardColors = {
              story: { bg: '#ec4899', text: 'white' },
              bookReview: { bg: '#3b82f6', text: 'white' },
              letter: { bg: '#22c55e', text: 'white' },
              drama: { bg: '#8b5cf6', text: 'white' },
              poetry: { bg: '#f97316', text: 'white' }
            }
            const colors = cardColors[type.id as keyof typeof cardColors] || { bg: '#3b82f6', text: 'white' }
            
            return (
              <div
                key={type.id}
                onMouseEnter={() => setHoveredCard(type.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleSelect(type.id)}
                className="relative bg-white rounded-2xl p-6 transition-all duration-150 cursor-pointer animate-fade-in"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  border: '3px solid #1a1a1a',
                  boxShadow: isHovered ? '6px 6px 0 0 #1a1a1a' : '4px 4px 0 0 #1a1a1a',
                  transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
                }}
              >
                <div className="relative z-10 text-center">
                  {/* 图标 */}
                  <div 
                    className={`text-6xl mb-4 transition-all duration-300 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  >
                    {type.icon}
                  </div>
                  
                  {/* 标题 */}
                  <h2 className="text-xl font-bold mb-3 text-[#1a1a1a]">
                    {type.title}
                  </h2>
                  
                  {/* 描述 */}
                  <p className="text-sm text-[#525252] leading-relaxed mb-4">
                    {type.description}
                  </p>
                  
                  {/* 特性列表 */}
                  <div className="space-y-1.5 mb-4">
                    {type.features.slice(0, 3).map((feature, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-center gap-1.5 text-xs text-[#525252]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.bg }}></span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 提示句 - Neo-brutalist highlight */}
                  <div className="rounded-lg p-3" style={{
                    background: '#facc15',
                    border: '2px solid #1a1a1a'
                  }}>
                    <p className="text-xs text-[#1a1a1a] font-medium">
                      "{type.prompt}"
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部提示 - Neo-brutalist info box */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-6 py-4 rounded-xl" style={{
            background: '#ec4899',
            border: '3px solid #1a1a1a',
            boxShadow: '4px 4px 0 0 #1a1a1a'
          }}>
            <p className="text-base text-white font-medium leading-relaxed">
              {t.bottomTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


