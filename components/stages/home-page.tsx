"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shader, ChromaFlow, Swirl } from "shaders/react"
import type { Language } from "@/app/page"
import { CustomCursor } from "@/components/custom-cursor"
import { GrainOverlay } from "@/components/grain-overlay"
import { MagneticCards } from "@/components/magnetic-card"
import { GenreDetails } from "@/components/genre-details"
import GlassSurface from "@/components/glass-surface"

interface HomePageProps {
  language?: Language
  user?: { username: string; role: "teacher" | "student"; noAi?: boolean }
  onStartStory?: () => void
  onStartBookReview?: () => void
  onStartLetter?: () => void
  onStartPlan?: () => void
  onStartWrite?: () => void
  onViewAbout?: () => void
}

const genreCards = [
  { id: "story", title: "Story", color: "#FFD54F" },
  { id: "review", title: "Book Review", color: "#F8BBD9" },
  { id: "letter", title: "Letter", color: "#FFECB3" },
  { id: "drama", title: "Drama", color: "#F48FB1" },
  { id: "poetry", title: "Poetry", color: "#FCE4EC" },
]

const translations = {
  en: {
    welcome: "Welcome to",
    subtitleTop: "The Future of Creative Writing",
    subtitleBottom: "in the AI Era",
    tagline: "Unleash Creativity, Empower Expression",
    startButton: "Start Your Journey",
  },
  zh: {
    welcome: "歡迎來到",
    subtitleTop: "創意寫作的未來",
    subtitleBottom: "在 AI 時代",
    tagline: "釋放創意，賦能表達",
    startButton: "開始你的旅程",
  },
}

export default function HomePage({ language = "en", onStartPlan }: HomePageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [isPixelating, setIsPixelating] = useState(false)
  const [pixelOrigin, setPixelOrigin] = useState({ x: 0, y: 0 })
  const shaderContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const t = translations[language] || translations.en

  useEffect(() => {
    const checkShaderReady = () => {
      if (!shaderContainerRef.current) return false
      const canvas = shaderContainerRef.current.querySelector("canvas")
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    if (checkShaderReady()) return

    const intervalId = setInterval(() => {
      if (checkShaderReady()) {
        clearInterval(intervalId)
      }
    }, 100)

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true)
    }, 1500)

    return () => {
      clearInterval(intervalId)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleCardClick = (id: string) => {
    setActiveGenre(activeGenre === id ? null : id)
  }

  const handleBack = () => {
    setActiveGenre(null)
  }

  const handleStartJourney = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPixelOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
    setIsPixelating(true)
    
    // After the pixelation animation completes, trigger the actual navigation
    setTimeout(() => {
      onStartPlan?.()
    }, 1200)
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-background cursor-none">
      <CustomCursor />
      <GrainOverlay />
      
      {/* Pixel transition overlay */}
      <AnimatePresence>
        {isPixelating && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Radial pixel effect expanding from button */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${pixelOrigin.x}px ${pixelOrigin.y}px, 
                  transparent 0%, 
                  transparent var(--radius), 
                  rgba(126, 200, 80, 0.3) var(--radius), 
                  rgba(126, 200, 80, 0.6) calc(var(--radius) + 50px),
                  rgba(139, 105, 20, 0.8) calc(var(--radius) + 100px),
                  #5a9a32 calc(var(--radius) + 200px))`,
                // @ts-ignore
                "--radius": "0px",
              }}
              animate={{
                // @ts-ignore
                "--radius": ["0px", "2000px"],
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            
            {/* Pixel grid overlay with stepped animation */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(139, 105, 20, 0.4) 2px, transparent 2px),
                  linear-gradient(90deg, rgba(139, 105, 20, 0.4) 2px, transparent 2px)
                `,
                backgroundSize: "16px 16px",
                imageRendering: "pixelated",
              }}
              initial={{ opacity: 0, scale: 4 }}
              animate={{ 
                opacity: [0, 0.3, 0.6, 0.9, 1],
                scale: [4, 2, 1.5, 1, 1],
              }}
              transition={{ 
                duration: 0.8, 
                times: [0, 0.2, 0.4, 0.6, 1],
                ease: "steps(5)"
              }}
            />
            
            {/* Low frame-rate pixelation effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(0px)",
              }}
              animate={{
                backdropFilter: ["blur(0px)", "blur(2px)", "blur(4px)", "blur(2px)", "blur(0px)"],
              }}
              transition={{ 
                duration: 0.6,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: "steps(4)"
              }}
            />
            
            {/* Final pixel-style fill */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, 
                  #b8e4f9 0%, 
                  #87ceeb 25%, 
                  #7ec850 65%, 
                  #5a9a32 100%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0, 0.5, 1] }}
              transition={{ 
                duration: 1,
                times: [0, 0.3, 0.6, 0.8, 1],
                ease: "steps(5)"
              }}
            />
            
            {/* Pixel decorative elements appearing */}
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 1, times: [0, 0.7, 1] }}
            >
              {/* Pixel clouds */}
              <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
                clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
              }} />
              <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
                clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
              }} />
              
              {/* Pixel grass at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-20">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={`pixel-grass-${i}`}
                    className="absolute bottom-0"
                    style={{
                      left: `${i * 3.3}%`,
                      width: "8px",
                      height: `${16 + (i % 3) * 8}px`,
                      background: i % 2 === 0 ? "#5a9a32" : "#7ec850",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={shaderContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ contain: "strict" }}
      >
        <Shader className="h-full w-full">
          <Swirl
            colorA="#F48FB1"
            colorB="#64B5F6"
            speed={0.9}
            detail={0.7}
            blend={60}
            coarseX={35}
            coarseY={35}
            mediumX={45}
            mediumY={45}
            fineX={35}
            fineY={35}
          />
          <ChromaFlow
            baseColor="#F8BBD9"
            upColor="#64B5F6"
            downColor="#FFAB91"
            leftColor="#F48FB1"
            rightColor="#90CAF9"
            intensity={0.9}
            radius={2.0}
            momentum={30}
            maskType="alpha"
            opacity={0.95}
          />
        </Shader>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col pt-32 md:pt-36 pb-16 md:pb-24 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 md:px-12 lg:flex-row lg:gap-12 lg:px-16">
          <div className="flex flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mb-6"
            >
              <p className="font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">{t.welcome}</p>
              <h1 className="bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400 bg-clip-text font-baloo text-8xl font-bold leading-none tracking-tight text-transparent md:text-9xl lg:text-[16rem]">
                CWrite
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="mb-8"
            >
              <p className="font-sans text-3xl font-medium text-foreground/90 md:text-4xl lg:text-5xl">{t.subtitleTop}</p>
              <p className="mt-2 font-sans text-xl text-foreground/70 md:text-2xl lg:text-3xl">{t.subtitleBottom}</p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 2.1 }}
              className="font-caveat text-4xl font-bold md:text-5xl lg:text-6xl"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.3)" }}
            >
              <span className="text-white">{t.tagline}</span>
            </motion.p>
          </div>

          <div className="flex flex-col items-center lg:w-1/2">
            <div className="mb-16 w-full">
              <MagneticCards
                cards={genreCards}
                activeCard={activeGenre}
                onCardClick={handleCardClick}
                animationDuration={0.8}
                staggerDelay={0.15}
                delayStart={1}
              />
            </div>

            <AnimatePresence>
              {activeGenre && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-8 w-full overflow-hidden"
                >
                  <GenreDetails activeGenre={activeGenre} onBack={handleBack} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.5 }}
            >
              <button 
                ref={buttonRef}
                onClick={handleStartJourney} 
                disabled={isPixelating}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed">
                <GlassSurface width="auto" height="auto" borderRadius={50} borderWidth={0.08} brightness={55} opacity={0.85} blur={12} displace={0.3}>
                  <span className="flex items-center gap-3 px-12 py-5 text-xl font-bold whitespace-nowrap text-white md:px-16 md:py-6 md:text-2xl lg:text-3xl">
                    {t.startButton}
                    <span className="text-2xl md:text-3xl lg:text-4xl">&#9992;</span>
                  </span>
                </GlassSurface>
              </button>
            </motion.div>
          </div>
        </section>

      </div>
    </main>
  )
}
