"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
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
    back: "Back",
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
    title: "Choose Your Writing Adventure",
    subtitle: "Pick the type of writing that excites you most!",
    bottomTip: "Each writing type helps you practice different skills. Choose the one that sounds most fun to you!",
    back: "Back",
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
}

// Pixel art colors for each writing type
const pixelColors = {
  story: { bg: "#9b59b6", border: "#7b3f96", text: "#fff" },
  bookReview: { bg: "#3498db", border: "#2378b8", text: "#fff" },
  letter: { bg: "#2ecc71", border: "#1ea651", text: "#fff" },
  drama: { bg: "#e67e22", border: "#c56510", text: "#fff" },
  poetry: { bg: "#e74c3c", border: "#c73c2c", text: "#fff" },
}

const getWritingTypes = (language: Language = "en") => {
  const t = translations[language] || translations.en
  return [
    {
      id: "story",
      title: t.storyTitle,
      icon: "📖",
      description: t.storyDesc,
      features: t.storyFeatures,
      prompt: t.storyPrompt,
      colors: pixelColors.story
    },
    {
      id: "bookReview",
      title: t.bookTitle,
      icon: "📝",
      description: t.bookDesc,
      features: t.bookFeatures,
      prompt: t.bookPrompt,
      colors: pixelColors.bookReview
    },
    {
      id: "letter",
      title: t.letterTitle,
      icon: "✉️",
      description: t.letterDesc,
      features: t.letterFeatures,
      prompt: t.letterPrompt,
      colors: pixelColors.letter
    },
    {
      id: "drama",
      title: t.dramaTitle,
      icon: "🎭",
      description: t.dramaDesc,
      features: t.dramaFeatures,
      prompt: t.dramaPrompt,
      colors: pixelColors.drama
    },
    {
      id: "poetry",
      title: t.poetryTitle,
      icon: "📜",
      description: t.poetryDesc,
      features: t.poetryFeatures,
      prompt: t.poetryPrompt,
      colors: pixelColors.poetry
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
    <div className="min-h-screen relative overflow-hidden pixel-theme">
      {/* Pixel art background */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        {/* Pixel clouds */}
        <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-32 left-[40%] w-20 h-10 bg-white opacity-75" style={{
          clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-20 left-[60%] w-28 h-12 bg-white opacity-65" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        
        {/* Pixel grass at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 4 + Math.random() * 2}%`,
                width: "8px",
                height: `${20 + Math.random() * 16}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen px-8 lg:px-14 py-10 lg:py-14 pl-16 lg:pl-20" style={{ paddingTop: '128px', paddingBottom: '120px' }}>
        {onBack && <BackButton onClick={onBack} variant="purple" />}

        {/* Title */}
        <div className="text-center mb-10">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4"
            style={{ 
              color: "#5a4a2a", 
              textShadow: "3px 3px 0 rgba(0,0,0,0.2), -1px -1px 0 rgba(255,255,255,0.3)",
              fontFamily: "var(--font-patrick-hand), cursive"
            }}
          >
            {t.title}
          </h1>
          <p className="text-2xl md:text-3xl font-extrabold" style={{ color: "#3d5a1f", textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}>
            {t.subtitle}
          </p>
        </div>

        {/* Five writing type cards in pixel style */}
        <div className="max-w-[92rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-7 mb-10">
          {writingTypes.map((type, index) => {
            const isHovered = hoveredCard === type.id
            return (
              <div
                key={type.id}
                onMouseEnter={() => setHoveredCard(type.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleSelect(type.id)}
                className="pixel-panel p-8 cursor-pointer transition-all duration-300 min-h-[520px] flex"
                style={{ 
                  transform: isHovered ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                  boxShadow: isHovered ? '6px 6px 0 rgba(0,0,0,0.3)' : '4px 4px 0 rgba(0,0,0,0.2)',
                }}
              >
                <div className="text-center w-full flex flex-col justify-between">
                  {/* Icon */}
                  <div 
                    className="text-8xl mb-5 transition-all duration-300"
                    style={{
                      transform: isHovered ? "scale(1.15) rotate(5deg)" : "scale(1)",
                    }}
                  >
                    {type.icon}
                  </div>
                  
                  {/* Title */}
                  <h2 
                    className="text-3xl font-extrabold mb-4 transition-all duration-300"
                    style={{ 
                      color: type.colors.bg,
                      textShadow: "1px 1px 0 rgba(0,0,0,0.2)"
                    }}
                  >
                    {type.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-lg font-bold leading-relaxed mb-5" style={{ color: "#5a4a2a" }}>
                    {type.description}
                  </p>
                  
                  {/* Features list */}
                  <div className="space-y-2.5 mb-5">
                    {type.features.map((feature, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-center gap-2 text-base font-bold"
                        style={{ color: "#6b5210" }}
                      >
                        <span style={{ color: "#e8c547" }}>*</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Prompt quote */}
                  <div 
                    className="p-4 mt-auto"
                    style={{ 
                      background: "#d4e8b4", 
                      border: "3px solid #5a9a32",
                    }}
                  >
                    <p className="text-base font-bold italic" style={{ color: "#3d5a1f" }}>
                      "{type.prompt}"
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom tip */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="pixel-panel p-5 inline-block">
            <p className="text-lg font-bold" style={{ color: "#5a4a2a" }}>
              {t.bottomTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
