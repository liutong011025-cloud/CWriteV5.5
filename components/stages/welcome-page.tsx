"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

interface WelcomePageProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onStart: () => void
  onBack?: () => void
  userId?: string
}

const translations = {
  en: {
    welcomeBack: "Welcome Back!",
    question: "Would you like to start a new writing project or continue with your previous work?",
    startNew: "Start New Writing Project",
    continueWork: "Continue Your Previous Work",
    title: "Story",
    subtitle: "Create magical stories with help from your AI mentor",
    startButton: "Start Creating",
    features: [
      { icon: "scroll", title: "Create Characters", desc: "Design unique story characters" },
      { icon: "star", title: "Brainstorm Ideas", desc: "Develop your plot with AI help" },
      { icon: "book", title: "Write Stories", desc: "Bring your imagination to life" },
    ]
  },
  zh: {
    welcomeBack: "欢迎回来！",
    question: "您想开始新的写作项目还是继续之前的作品？",
    startNew: "开始新写作",
    continueWork: "继续之前的作品",
    title: "故事",
    subtitle: "在AI導師的幫助下創造魔法故事",
    startButton: "開始創作",
    features: [
      { icon: "scroll", title: "創造角色", desc: "設計獨特的故事角色" },
      { icon: "star", title: "頭腦風暴", desc: "在AI幫助下開發你的情節" },
      { icon: "book", title: "編寫故事", desc: "讓你的想象力成真" },
    ]
  }
}

// Pixel art icons as inline SVG components
const PixelIcons = {
  scroll: (
    <svg width="48" height="48" viewBox="0 0 16 16" className="mx-auto">
      <rect x="3" y="2" width="10" height="12" fill="#f5e6c8"/>
      <rect x="3" y="2" width="10" height="2" fill="#c4a020"/>
      <rect x="3" y="12" width="10" height="2" fill="#c4a020"/>
      <rect x="5" y="5" width="6" height="1" fill="#5a4a2a"/>
      <rect x="5" y="7" width="6" height="1" fill="#5a4a2a"/>
      <rect x="5" y="9" width="4" height="1" fill="#5a4a2a"/>
    </svg>
  ),
  star: (
    <svg width="48" height="48" viewBox="0 0 16 16" className="mx-auto">
      <polygon points="8,1 10,6 15,6 11,9 13,15 8,11 3,15 5,9 1,6 6,6" fill="#e8c547"/>
      <polygon points="8,3 9,6 12,6 10,8 11,12 8,10 5,12 6,8 4,6 7,6" fill="#f5d75a"/>
    </svg>
  ),
  book: (
    <svg width="48" height="48" viewBox="0 0 16 16" className="mx-auto">
      <rect x="2" y="2" width="12" height="12" fill="#8b6914"/>
      <rect x="3" y="3" width="10" height="10" fill="#f5e6c8"/>
      <rect x="7" y="3" width="2" height="10" fill="#c4a020"/>
      <rect x="4" y="5" width="2" height="1" fill="#5a4a2a"/>
      <rect x="4" y="7" width="2" height="1" fill="#5a4a2a"/>
      <rect x="10" y="5" width="2" height="1" fill="#5a4a2a"/>
      <rect x="10" y="7" width="2" height="1" fill="#5a4a2a"/>
    </svg>
  ),
  potion: (
    <svg width="32" height="32" viewBox="0 0 16 16" className="inline-block">
      <rect x="6" y="1" width="4" height="3" fill="#8b6914"/>
      <rect x="5" y="4" width="6" height="2" fill="#5bc0de"/>
      <rect x="4" y="6" width="8" height="8" fill="#87ceeb"/>
      <rect x="5" y="7" width="2" height="2" fill="#b8e4f9"/>
    </svg>
  ),
  coin: (
    <svg width="24" height="24" viewBox="0 0 16 16" className="inline-block">
      <circle cx="8" cy="8" r="6" fill="#e8c547"/>
      <circle cx="8" cy="8" r="4" fill="#f5d75a"/>
      <rect x="7" y="5" width="2" height="6" fill="#c4a020"/>
    </svg>
  ),
}

export default function WelcomePage({ language, onLanguageChange, onStart, onBack, userId }: WelcomePageProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [currentAction, setCurrentAction] = useState<string>("")
  const validLanguage = (language && language in translations) ? language : "en"
  const t = translations[validLanguage as keyof typeof translations]
  const features = t?.features || []

  const handleStart = () => {
    setCurrentAction("Clicked Start Creating button")
    onStart()
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden pixel-theme" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* Pixel art background */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        {/* Pixel clouds */}
        <div className="absolute top-16 left-[10%] w-32 h-16 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-40 h-18 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-40 left-[45%] w-24 h-12 bg-white opacity-75" style={{
          clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        
        {/* Pixel sun */}
        <div className="absolute top-20 right-[8%] w-16 h-16" style={{
          background: "#f5d75a",
          boxShadow: "0 0 20px #e8c547, 0 0 40px rgba(232, 197, 71, 0.5)"
        }} />
        
        {/* Pixel trees at bottom */}
        <div className="absolute bottom-0 left-[5%]">
          <div style={{ width: "16px", height: "40px", background: "#5a3d1a", marginLeft: "12px" }} />
          <div style={{ width: "40px", height: "20px", background: "#3d8a3d", marginTop: "-50px" }} />
          <div style={{ width: "32px", height: "16px", background: "#5a9a32", marginTop: "-8px", marginLeft: "4px" }} />
          <div style={{ width: "24px", height: "12px", background: "#7ec850", marginTop: "-4px", marginLeft: "8px" }} />
        </div>
        <div className="absolute bottom-0 right-[8%]">
          <div style={{ width: "16px", height: "48px", background: "#5a3d1a", marginLeft: "16px" }} />
          <div style={{ width: "48px", height: "24px", background: "#3d8a3d", marginTop: "-60px" }} />
          <div style={{ width: "40px", height: "20px", background: "#5a9a32", marginTop: "-10px", marginLeft: "4px" }} />
          <div style={{ width: "32px", height: "16px", background: "#7ec850", marginTop: "-6px", marginLeft: "8px" }} />
        </div>
        
        {/* Pixel grass at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 3.5}%`,
                width: "8px",
                height: `${16 + (i % 3) * 8}px`,
                background: i % 3 === 0 ? "#5a9a32" : i % 3 === 1 ? "#7ec850" : "#3d8a3d",
              }}
            />
          ))}
        </div>

        {/* Decorative pixel elements */}
        <div className="absolute top-[30%] left-[5%] animate-bounce" style={{ animationDuration: "2s" }}>
          {PixelIcons.potion}
        </div>
        <div className="absolute top-[40%] right-[10%] animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}>
          {PixelIcons.coin}
        </div>
        <div className="absolute top-[50%] left-[15%] animate-bounce" style={{ animationDuration: "3s", animationDelay: "1s" }}>
          {PixelIcons.coin}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="max-w-4xl w-full text-center">
          
          {/* Main pixel panel - Welcome Back */}
          <div className="pixel-panel p-8 mb-8 mx-auto max-w-2xl" style={{ background: "#f5e6c8" }}>
            {/* Pixel star decoration */}
            <div className="mb-4">
              {PixelIcons.star}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ 
              color: "#5a4a2a",
              textShadow: "3px 3px 0 #8b6914, -1px -1px 0 #d9c9a6"
            }}>
              {t.welcomeBack}
            </h1>
            
            {/* Question */}
            <p className="text-lg md:text-xl mb-8 font-bold" style={{ color: "#6b5210" }}>
              {t.question}
            </p>

            {/* Buttons - Pixel style like PLAY/OPTION buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Start New - Green PLAY style button */}
              <Button
                onClick={handleStart}
                size="lg"
                className="px-8 py-6 text-lg font-extrabold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)",
                  border: "4px solid #3d8a3d",
                  boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.2), inset 3px 3px 0 rgba(255,255,255,0.2), 4px 4px 0 rgba(0,0,0,0.3)",
                  color: "#fff",
                  textShadow: "2px 2px 0 #3d5a1f",
                  borderRadius: "0"
                }}
              >
                {t.startNew}
              </Button>
              
              {/* Continue - Orange OPTION style button */}
              <Button
                onClick={onBack}
                size="lg"
                className="px-8 py-6 text-lg font-extrabold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(180deg, #e8a847 0%, #c4862a 100%)",
                  border: "4px solid #8b5a1a",
                  boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.2), inset 3px 3px 0 rgba(255,255,255,0.2), 4px 4px 0 rgba(0,0,0,0.3)",
                  color: "#fff",
                  textShadow: "2px 2px 0 #5a3d1a",
                  borderRadius: "0"
                }}
              >
                {t.continueWork}
              </Button>
            </div>
          </div>

          {/* Feature cards - Pixel panel style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {features.map((feature, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`pixel-panel p-6 transition-all duration-300 ${
                  hoveredIndex === i ? "transform -translate-y-2" : ""
                }`}
                style={{ 
                  background: "#f5e6c8",
                  cursor: "pointer"
                }}
              >
                {/* Icon */}
                <div className="mb-4">
                  {PixelIcons[feature.icon as keyof typeof PixelIcons]}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-extrabold mb-2" style={{ 
                  color: "#5a4a2a",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.2)"
                }}>
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="font-bold" style={{ color: "#6b5210" }}>
                  {feature.desc}
                </p>
                
                {/* Pixel progress bar decoration */}
                <div className="mt-4 h-3" style={{
                  background: "#d9c9a6",
                  border: "2px solid #8b6914"
                }}>
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: hoveredIndex === i ? "100%" : "60%",
                      background: i === 0 ? "#7ec850" : i === 1 ? "#e8c547" : "#87ceeb"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
