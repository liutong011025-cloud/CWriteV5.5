"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import type { Language } from "@/app/page"
import PixelPage from "@/components/pixel/pixel-page"

interface DramaWelcomeProps {
  language?: Language
  onStartDrama?: () => void
  onBack?: () => void
}

const translations = {
  en: {
    title: "Drama Writing",
    subtitle: "Create amazing dramas with characters, scenes, and dialogues",
    intro: "Learn to write engaging dramas with AI assistance. Our platform helps you create characters, design scenes, write dialogues, and bring your stories to life through visual storytelling.",
    learnTitle: "What You'll Learn",
    characterTitle: "Create Characters",
    characterDesc: "Design unique characters with names, species, and appearance. Watch them come to life with AI-generated images.",
    sceneTitle: "Design Scenes",
    sceneDesc: "Build dramatic scenes with backgrounds and settings. Add multiple scenes to tell your complete story.",
    dialogueTitle: "Write Dialogues",
    dialogueDesc: "Express characters' thoughts and words through dialogue bubbles and thought bubbles. Make your characters speak!",
    startButton: "🎭 Start Creating Drama",
    backButton: "Back to Home",
  },
  zh: {
    title: "戲劇寫作",
    subtitle: "創造包含角色、場景和對話的精彩戲劇",
    intro: "在AI協助下學習寫出引人入勝的戲劇。我們的平台幫助你創造角色、設計場景、撰寫對話，並通過視覺敘事讓你的故事栩栩如生。",
    learnTitle: "你會學到",
    characterTitle: "創造角色",
    characterDesc: "設計具有名字、物種和外貌的獨特角色。看著它們通過AI生成的圖像變得栩栩如生。",
    sceneTitle: "設計場景",
    sceneDesc: "用背景和設定構建戲劇性場景。添加多個場景來講述你的完整故事。",
    dialogueTitle: "撰寫對話",
    dialogueDesc: "通過對話氣泡和思考氣泡表達角色的想法和話語。讓你的角色說話！",
    startButton: "🎭 開始創作戲劇",
    backButton: "返回首頁",
  },
}

export default function DramaWelcome({ 
  language = "en",
  onStartDrama, 
  onBack 
}: DramaWelcomeProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const t = translations[language] || translations.en

  return (
    <PixelPage style={{ paddingTop: "120px", paddingBottom: "120px" }}>
      {/* 主要内容容器 */}
      <div className="min-h-screen flex flex-col">
        {onBack && <BackButton onClick={onBack} variant="indigo" aria-label={t.backButton} />}
        
        {/* 标题区域 */}
        <div className="relative w-full py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-7xl mb-6 animate-bounce-in" style={{ animationDelay: '0.1s' }}>🎭</div>
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
              {/* Create Characters */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>👤</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#3a8aa3" }}>{t.characterTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.characterDesc}
                </p>
              </div>

              {/* Design Scenes */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>🎬</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#3d5a1f" }}>{t.sceneTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.sceneDesc}
                </p>
              </div>

              {/* Write Dialogues */}
              <div 
                className="pixel-card p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.3s' }}>💬</div>
                <h3 className="text-2xl font-bold mb-4 text-center pixel-text" style={{ color: "#2a5a7a" }}>{t.dialogueTitle}</h3>
                <p className="leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.dialogueDesc}
                </p>
              </div>
            </div>
          </div>

          {/* 行动按钮区域 */}
          <div className="text-center mt-16 mb-12 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="flex flex-wrap justify-center gap-6">
              {onStartDrama && (
                <Button
                  onClick={onStartDrama}
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
    </PixelPage>
  )
}
