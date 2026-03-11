"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 主要内容容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 顶部导航栏 */}
        {onBack && (
          <div className="relative z-10 p-6 pt-10">
            <button
              type="button"
              onClick={onBack}
              className="transition-transform duration-200 hover:scale-110"
              aria-label={t.backButton}
            >
              <img src="/back.png" alt={t.backButton} className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
            </button>
          </div>
        )}
        
        {/* 标题区域 */}
        <div className="relative w-full py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-7xl mb-6 animate-bounce-in" style={{ animationDelay: '0.1s' }}>🎭</div>
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg animate-fade-in-up"
              style={{
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
                animationDelay: '0s',
              }}
            >
              {t.title}
            </h1>
            <p 
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 animate-fade-in-up" 
              style={{ animationDelay: '0.2s' }}
            >
              {t.subtitle}
            </p>
            <div 
              className="w-32 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mx-auto mt-8 rounded-full animate-scale-in" 
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
          {/* 介绍段落 */}
          <div className="prose prose-lg max-w-none mb-16 space-y-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
              {t.intro}
            </p>
          </div>

          {/* 功能特点 */}
          <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t.learnTitle}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Create Characters */}
              <div 
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>👤</div>
                <h3 className="text-2xl font-bold mb-4 text-indigo-700 text-center">{t.characterTitle}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t.characterDesc}
                </p>
              </div>

              {/* Design Scenes */}
              <div 
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>🎬</div>
                <h3 className="text-2xl font-bold mb-4 text-purple-700 text-center">{t.sceneTitle}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t.sceneDesc}
                </p>
              </div>

              {/* Write Dialogues */}
              <div 
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-pink-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="text-5xl mb-4 text-center animate-bounce-in" style={{ animationDelay: '0.3s' }}>💬</div>
                <h3 className="text-2xl font-bold mb-4 text-pink-700 text-center">{t.dialogueTitle}</h3>
                <p className="text-gray-700 leading-relaxed">
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
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-2xl py-6 px-12 text-xl font-bold hover:scale-105 transition-transform duration-300 animate-bounce-in"
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
