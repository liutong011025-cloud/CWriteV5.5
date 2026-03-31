"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import type { Language } from "@/app/page"

interface BookReviewWelcomeProps {
  language?: Language
  onStartBookReview?: () => void
  onBack?: () => void
}

const translations = {
  en: {
    title: "Book Review Writing",
    subtitle: "Share your thoughts and insights about books",
    intro: "Learn to write thoughtful and engaging book reviews with AI assistance. Our platform helps you analyze books, express your opinions, and develop critical thinking skills.",
    learnTitle: "What You'll Learn",
    analyzeTitle: "Analyze Books",
    analyzeDesc: "Learn to identify key themes, characters, and plot elements in the books you read. Develop your analytical thinking skills.",
    expressTitle: "Express Opinions",
    expressDesc: "Practice sharing your thoughts and feelings about books in a clear and engaging way. Build confidence in expressing your ideas.",
    criticalTitle: "Critical Thinking",
    criticalDesc: "Develop your ability to evaluate books, compare different works, and form well-reasoned judgments about what you read.",
    startButton: "📝 Start Writing Book Review",
    backButton: "Back to Home",
  },
  zh: {
    title: "書評寫作",
    subtitle: "分享你對書籍的想法與見解",
    intro: "在AI協助下學習寫出深思熟慮與引人入勝的書評。我們的平台幫助你分析書籍、表達意見，並發展批判性思維技能。",
    learnTitle: "你會學到",
    analyzeTitle: "分析書籍",
    analyzeDesc: "學習識別你閱讀書籍中的關鍵主題、角色與情節元素。發展你的分析思維技能。",
    expressTitle: "表達意見",
    expressDesc: "練習以清晰與引人入勝的方式分享你對書籍的想法與感受。建立表達想法的信心。",
    criticalTitle: "批判性思維",
    criticalDesc: "發展你評估書籍、比較不同作品，並對你閱讀內容形成合理判斷的能力。",
    startButton: "📝 開始寫書評",
    backButton: "返回首頁",
  },
}

export default function BookReviewWelcome({ 
  language = "en",
  onStartBookReview, 
  onBack 
}: BookReviewWelcomeProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const t = translations[language] || translations.en

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* Pixel art background */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(22)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 4 + Math.random() * 2}%`,
                width: "8px",
                height: `${18 + Math.random() * 18}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
        </div>
      </div>

      {/* 主要内容容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {onBack && <BackButton onClick={onBack} variant="teal" aria-label={t.backButton} />}
        
        {/* 标题区域 */}
        <div className="relative w-full py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-7xl mb-6 animate-bounce-in" style={{ animationDelay: '0.1s' }}>📚</div>
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 pixel-title animate-fade-in-up"
              style={{
                color: "#6b5210",
                textShadow: "3px 3px 0 #5a9a32, 6px 6px 0 rgba(0,0,0,0.2)",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                animationDelay: '0s',
              }}
            >
              {t.title}
            </h1>
            <p 
              className="text-2xl md:text-3xl font-bold mb-4 animate-fade-in-up pixel-text" 
              style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(255,255,255,0.5)", animationDelay: '0.2s' }}
            >
              {t.subtitle}
            </p>
            <div 
              className="w-32 h-1 mx-auto mt-8 animate-scale-in" 
              style={{ background: "#e8c547", border: "3px solid #8b6914", animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
          {/* 介绍段落 */}
          <div className="prose prose-lg max-w-none mb-16 space-y-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-lg md:text-xl leading-relaxed text-center pixel-text" style={{ color: "#5a4a2a" }}>
              {t.intro}
            </p>
          </div>

          {/* 功能特点 */}
          <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 pixel-title" style={{ color: "#6b5210", textShadow: "2px 2px 0 rgba(0,0,0,0.15)" }}>
              {t.learnTitle}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Analyze Books */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>🔍</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#2a5a7a" }}>{t.analyzeTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.analyzeDesc}
                </p>
              </div>

              {/* Express Opinions */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>💭</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#3a8aa3" }}>{t.expressTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.expressDesc}
                </p>
              </div>

              {/* Critical Thinking */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.3s' }}>🧠</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#3d5a1f" }}>{t.criticalTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.criticalDesc}
                </p>
              </div>
            </div>
          </div>

          {/* 行动按钮区域 */}
          <div className="text-center mt-16 mb-12 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="flex flex-wrap justify-center gap-6">
              {onStartBookReview && (
                <Button
                  onClick={onStartBookReview}
                  size="lg"
                  className="pixel-btn pixel-btn-green shadow-2xl py-6 px-12 text-xl font-bold hover:scale-105 transition-transform duration-300 animate-bounce-in"
                  style={{ animationDelay: '1.1s' }}
                >
                  {t.startButton}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
