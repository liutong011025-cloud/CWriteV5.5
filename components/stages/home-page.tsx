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

function PixelRevealText({
  text,
  baseClassName,
  pixelClassName,
  pixelStyle,
}: {
  text: string
  baseClassName: string
  pixelClassName?: string
  pixelStyle?: React.CSSProperties
}) {
  // Use letter stepping via steps(N,end) where N is the string length.
  const steps = Math.max(4, text.length)
  return (
    <span className="pixel-reveal">
      <span className={`pixel-reveal__base ${baseClassName}`}>{text}</span>
      <span
        className={`pixel-reveal__pixel ${baseClassName} ${pixelClassName || ""}`.trim()}
        style={{
          ...pixelStyle,
          animationTimingFunction: `steps(${steps}, end)`,
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  )
}

interface HomePageProps {
  language?: Language
  user?: { username: string; role: "teacher" | "student"; noAi?: boolean }
  onStartStory?: () => void
  onStartBookReview?: () => void
  onStartLetter?: () => void
  onStartPlan?: () => void
  onVisitFarm?: () => void
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

export default function HomePage({ language = "en", onStartPlan, onVisitFarm }: HomePageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [isPixelating, setIsPixelating] = useState(false)
  const [pixelPhase, setPixelPhase] = useState(0) // 0=none, 1=transform elements then navigate
  const [pixelOrigin, setPixelOrigin] = useState({ x: 0, y: 0 })
  const [showPixelSky, setShowPixelSky] = useState(false)
  const shaderContainerRef = useRef<HTMLDivElement>(null)
  const pixelRootRef = useRef<HTMLDivElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const farmButtonRef = useRef<HTMLButtonElement>(null)
  const startJourneyAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastStartSoundAtRef = useRef(0)
  const t = translations[language] || translations.en

  // Preload the dedicated Start Journey SFX so it plays immediately on press.
  useEffect(() => {
    try {
      if (!startJourneyAudioRef.current) {
        startJourneyAudioRef.current = new Audio("/bit.mp3")
        startJourneyAudioRef.current.preload = "auto"
        // 10% quieter than 0.28
        startJourneyAudioRef.current.volume = 0.252
        startJourneyAudioRef.current.load?.()
      }
    } catch {
      // ignore
    }
  }, [])

  const playStartJourneySound = () => {
    const now = Date.now()
    // Avoid double-trigger if pointerdown + click both fire.
    if (now - lastStartSoundAtRef.current < 250) return
    lastStartSoundAtRef.current = now
    try {
      if (!startJourneyAudioRef.current) return
      startJourneyAudioRef.current.currentTime = 0
      void startJourneyAudioRef.current.play()
    } catch {
      // ignore
    }
  }

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

  const handlePixelJourney = (originEl: HTMLElement | null, navigate?: () => void) => {
    if (originEl) {
      const rect = originEl.getBoundingClientRect()
      setPixelOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
    setIsPixelating(true)
    
    // Phase 1: Transform elements to pixel style, sequenced by distance to Start button
    setPixelPhase(1)
    setShowPixelSky(true)

    // Distance-based sequencing: nearest items pixelize first
    window.setTimeout(() => {
      const root = pixelRootRef.current
      const btn = originEl
      if (!root || !btn) return

      const btnRect = btn.getBoundingClientRect()
      const origin = { x: btnRect.left + btnRect.width / 2, y: btnRect.top + btnRect.height / 2 }

      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-pixel-item]"))
      const withDist = items
        .map((el) => {
          const r = el.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const dx = cx - origin.x
          const dy = cy - origin.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          return { el, dist }
        })
        .sort((a, b) => a.dist - b.dist)

      const maxDist = Math.max(1, ...withDist.map((x) => x.dist))
      // Keep a near->far sequence, but don't delay navigation too long.
      const baseDelayMs = 60
      const maxDelayMs = 900
      for (const { el, dist } of withDist) {
        const delay = baseDelayMs + Math.round((dist / maxDist) * maxDelayMs)
        el.style.setProperty("--pixel-delay", `${delay}ms`)
      }
      root.classList.add("pixel-farm-transition-active")
    }, 0)
    
    // Navigate directly after pixelation effect completes
    setTimeout(() => {
      navigate?.()
    }, 900)
  }

  const handleStartJourneyClick = () => {
    playStartJourneySound()
    handlePixelJourney(startButtonRef.current, onStartPlan)
  }

  const handleVisitFarmClick = () => {
    playStartJourneySound()
    handlePixelJourney(farmButtonRef.current, onVisitFarm)
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-background cursor-none">
      <CustomCursor />
      <GrainOverlay />
      
      {/* Phase 1: Pixelation effect overlay - transforms existing elements */}
      <AnimatePresence>
        {pixelPhase >= 1 && (
          <motion.div
            className="fixed inset-0 z-[99] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Radial pixelation wave from button center */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${pixelOrigin.x}px ${pixelOrigin.y}px, 
                  transparent 0%, 
                  transparent var(--wave-radius), 
                  rgba(245,230,200,0.2) calc(var(--wave-radius) + 50px),
                  rgba(126,200,80,0.3) calc(var(--wave-radius) + 150px),
                  rgba(90,154,50,0.5) calc(var(--wave-radius) + 300px))`,
                // @ts-ignore
                "--wave-radius": "0px",
              }}
              animate={{
                // @ts-ignore
                "--wave-radius": ["0px", "3000px"],
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            
            {/* Progressive pixel grid - starts large, gets finer */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(139, 105, 20, 0.4) 4px, transparent 4px),
                  linear-gradient(90deg, rgba(139, 105, 20, 0.4) 4px, transparent 4px)
                `,
                backgroundSize: "32px 32px",
                imageRendering: "pixelated",
              }}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.3, 0.5, 0.7, 0.9],
                backgroundSize: ["64px 64px", "48px 48px", "32px 32px", "16px 16px", "8px 8px"],
              }}
              transition={{ 
                duration: 0.7, 
                times: [0, 0.2, 0.4, 0.7, 1],
                ease: "linear"
              }}
            />
            
            {/* Color shift towards Stardew palette */}
            <motion.div
              className="absolute inset-0"
              initial={{ backgroundColor: "rgba(0,0,0,0)" }}
              animate={{ 
                backgroundColor: [
                  "rgba(0,0,0,0)",
                  "rgba(245,230,200,0.1)",
                  "rgba(232,197,71,0.2)",
                  "rgba(126,200,80,0.3)",
                  "rgba(90,154,50,0.5)",
                ]
              }}
              transition={{ duration: 0.8, ease: "easeIn" }}
            />
            
            {/* Scanline effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(0, 0, 0, 0.1) 3px,
                  rgba(0, 0, 0, 0.1) 6px
                )`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0.4, 0.5] }}
              transition={{ duration: 0.6, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pixel sky/grass overlay (dramatic background switch from button outward) */}
      <AnimatePresence>
        {showPixelSky && (
          <motion.div
            className="fixed inset-0 z-[60] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, 
                  #b8e4f9 0%, 
                  #87ceeb 28%, 
                  #7ec850 68%, 
                  #5a9a32 100%)`,
                imageRendering: "pixelated",
                // radial reveal from the Start button
                WebkitMaskImage: `radial-gradient(circle at ${pixelOrigin.x}px ${pixelOrigin.y}px, #000 0%, #000 var(--reveal), transparent calc(var(--reveal) + 140px))`,
                maskImage: `radial-gradient(circle at ${pixelOrigin.x}px ${pixelOrigin.y}px, #000 0%, #000 var(--reveal), transparent calc(var(--reveal) + 140px))`,
                // @ts-ignore
                "--reveal": "0px",
              }}
              animate={{
                // @ts-ignore
                "--reveal": ["0px", "2600px"],
              }}
              transition={{ duration: 0.85, ease: "linear" }}
            >
              {/* pixel clouds */}
              <div className="absolute top-20 left-[10%] w-24 h-12 bg-white/80" style={{
                clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)",
                imageRendering: "pixelated",
              }} />
              <div className="absolute top-28 right-[15%] w-32 h-14 bg-white/70" style={{
                clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)",
                imageRendering: "pixelated",
              }} />

              {/* pixel grass blades */}
              <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
                {[...Array(26)].map((_, i) => (
                  <div
                    key={`pixel-grass-${i}`}
                    className="absolute bottom-0"
                    style={{
                      left: `${i * 4 + Math.random() * 2}%`,
                      width: "8px",
                      height: `${18 + Math.random() * 18}px`,
                      background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
                      imageRendering: "pixelated",
                    }}
                  />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`pixel-flower-${i}`}
                    className="absolute bottom-5"
                    style={{ left: `${8 + i * 9}%` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{
                      background: ["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4],
                      boxShadow: `3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, -3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 -3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}`,
                      imageRendering: "pixelated",
                    }} />
                  </div>
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

      <div
        ref={pixelRootRef}
        className={`pixel-farm-transition relative z-10 flex min-h-screen flex-col pt-32 md:pt-36 pb-16 md:pb-24 transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"} ${pixelPhase >= 1 ? "pixel-transforming" : ""}`}
        style={pixelPhase >= 1 ? { 
          filter: `contrast(${1 + pixelPhase * 0.1}) saturate(${1 + pixelPhase * 0.15})`,
          transition: "filter 0.5s ease"
        } : undefined}>
        <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 md:px-12 lg:flex-row lg:gap-12 lg:px-16">
          <div className="flex flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mb-6"
            >
              <p 
                data-pixel-item
                data-pixel-kind="text"
                className={`font-sans text-5xl font-light tracking-tight md:text-6xl lg:text-7xl transition-all duration-500 ${
                  pixelPhase >= 1 ? "text-[#8b6914]" : "text-foreground"
                }`}
                style={pixelPhase >= 1 ? { textShadow: "3px 3px 0 rgba(0,0,0,0.2)" } : undefined}
              >
                <PixelRevealText
                  text={t.welcome}
                  baseClassName="font-sans"
                  pixelStyle={pixelPhase >= 1 ? { color: "#8b6914" } : undefined}
                />
              </p>
              <h1 
                data-pixel-item
                data-pixel-kind="text"
                className={`font-baloo text-8xl font-bold leading-none tracking-tight md:text-9xl lg:text-[16rem] transition-all duration-500 ${
                  pixelPhase >= 1 
                    ? "text-[#7ec850]" 
                    : "bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400 bg-clip-text text-transparent"
                }`}
                style={pixelPhase >= 1 ? { 
                  textShadow: "6px 6px 0 #5a9a32, 12px 12px 0 rgba(0,0,0,0.2)",
                  WebkitTextStroke: "3px #5a9a32",
                } : undefined}
              >
                {pixelPhase >= 1 ? (
                  <PixelRevealText
                    text="CWrite"
                    // Keep size from the h1; only pixel overlay should apply font.
                    baseClassName=""
                    pixelStyle={{ color: "#7ec850", WebkitTextStroke: "0px transparent" }}
                  />
                ) : (
                  "CWrite"
                )}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="mb-8"
            >
              <p data-pixel-item data-pixel-kind="text" className="font-sans text-3xl font-medium text-foreground/90 md:text-4xl lg:text-5xl">
                <PixelRevealText
                  text={t.subtitleTop}
                  baseClassName="font-sans"
                  pixelStyle={pixelPhase >= 1 ? { color: "rgba(17,24,39,0.9)" } : { color: "rgba(17,24,39,0.9)" }}
                />
              </p>
              <p data-pixel-item data-pixel-kind="text" className="mt-2 font-sans text-xl text-foreground/70 md:text-2xl lg:text-3xl">
                <PixelRevealText
                  text={t.subtitleBottom}
                  baseClassName="font-sans"
                  pixelStyle={pixelPhase >= 1 ? { color: "rgba(17,24,39,0.7)" } : { color: "rgba(17,24,39,0.7)" }}
                />
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 2.1 }}
              data-pixel-item
              data-pixel-kind="text"
              className="font-caveat text-4xl font-bold md:text-5xl lg:text-6xl"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.3)" }}
            >
              <span className="text-white">
                <PixelRevealText
                  text={t.tagline}
                  baseClassName="font-caveat"
                  pixelStyle={{ color: "#ffffff" }}
                />
              </span>
            </motion.p>
          </div>

          <div className="flex flex-col items-center lg:w-1/2">
            <div data-pixel-item data-pixel-kind="panel" className="mb-16 w-full transition-all duration-300">
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
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: pixelPhase >= 1 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.8, delay: 2.5 }}
              className="mt-10"
            >
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                {/* Visit my farm */}
                {pixelPhase >= 1 ? (
                  <motion.button
                    ref={farmButtonRef}
                    disabled
                    className="focus:outline-none disabled:cursor-not-allowed"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.06, 1.03] }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: "linear-gradient(180deg, #d9c9a6 0%, #c4a574 100%)",
                      border: "4px solid #8b6914",
                      boxShadow: "inset -4px -4px 0 rgba(0,0,0,0.25), inset 4px 4px 0 rgba(255,255,255,0.25), 6px 6px 0 rgba(0,0,0,0.3)",
                      padding: "20px 40px",
                      imageRendering: "pixelated",
                    }}
                  >
                    <span className="flex items-center gap-3 text-xl font-bold whitespace-nowrap text-white md:text-2xl lg:text-3xl" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                      Visit my farm
                      <span className="text-2xl md:text-3xl lg:text-4xl">🏠</span>
                    </span>
                  </motion.button>
                ) : (
                  <button
                    ref={farmButtonRef}
                    onPointerDown={playStartJourneySound}
                    onClick={handleVisitFarmClick}
                    disabled={isPixelating}
                    data-pixel-item
                    data-pixel-kind="button"
                    data-click-sound="visit-farm"
                    className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.04] active:scale-[1.0]"
                  >
                    <GlassSurface width="auto" height="auto" borderRadius={50} borderWidth={0.08} brightness={55} opacity={0.85} blur={12} displace={0.3}>
                      <span className="flex items-center gap-3 px-10 py-5 text-xl font-bold whitespace-nowrap text-white md:px-14 md:py-6 md:text-2xl lg:text-3xl transition-all duration-200 group-hover:brightness-110">
                        Visit my farm
                        <span className="text-2xl md:text-3xl lg:text-4xl">🏠</span>
                      </span>
                    </GlassSurface>
                  </button>
                )}

                {/* Start journey */}
                {pixelPhase >= 1 ? (
                  <motion.button
                    ref={startButtonRef}
                    disabled
                    className="focus:outline-none disabled:cursor-not-allowed"
                    initial={{ scale: 1 }}
                    animate={{
                      scale: [1, 1.1, 1.05],
                      boxShadow: [
                        "4px 4px 0 rgba(0,0,0,0.3)",
                        "6px 6px 0 rgba(0,0,0,0.4)",
                        "8px 8px 0 rgba(0,0,0,0.3)",
                      ],
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: "linear-gradient(180deg, #6fcf6f 0%, #4ca84c 100%)",
                      border: "4px solid #3d8a3d",
                      boxShadow: "inset -4px -4px 0 rgba(0,0,0,0.25), inset 4px 4px 0 rgba(255,255,255,0.25), 6px 6px 0 rgba(0,0,0,0.3)",
                      padding: "20px 48px",
                      imageRendering: "pixelated",
                    }}
                  >
                    <span className="flex items-center gap-3 text-xl font-bold whitespace-nowrap text-white md:text-2xl lg:text-3xl" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                      {t.startButton}
                      <span className="text-2xl md:text-3xl lg:text-4xl">&#9992;</span>
                    </span>
                  </motion.button>
                ) : (
                  <button
                    ref={startButtonRef}
                    onPointerDown={playStartJourneySound}
                    onClick={handleStartJourneyClick}
                    disabled={isPixelating}
                    data-pixel-item
                    data-pixel-kind="button"
                    data-click-sound="start-journey"
                    className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.04] active:scale-[1.0]"
                  >
                    <GlassSurface width="auto" height="auto" borderRadius={50} borderWidth={0.08} brightness={55} opacity={0.85} blur={12} displace={0.3}>
                      <span className="flex items-center gap-3 px-12 py-5 text-xl font-bold whitespace-nowrap text-white md:px-16 md:py-6 md:text-2xl lg:text-3xl transition-all duration-200 group-hover:brightness-110">
                        {t.startButton}
                        <span className="text-2xl md:text-3xl lg:text-4xl">&#9992;</span>
                      </span>
                    </GlassSurface>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </main>
  )
}
