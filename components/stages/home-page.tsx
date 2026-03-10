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
  const shaderContainerRef = useRef<HTMLDivElement>(null)
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

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-background cursor-none">
      <CustomCursor />
      <GrainOverlay />

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

      <div className={`relative z-10 flex min-h-screen flex-col pt-28 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
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
              <button onClick={() => onStartPlan?.()} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
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
