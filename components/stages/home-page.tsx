"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import type { Language } from "@/app/page"
import { CustomCursor } from "@/components/custom-cursor"

interface HomePageProps {
  language?: Language
  user?: { username: string; role: "teacher" | "student"; noAi?: boolean }
  onStartStory?: () => void
  onStartBookReview?: () => void
  onStartLetter?: () => void
  onStartPlan?: () => void
  onContinuePastJourney?: () => void
  onVisitFarm?: () => void
  onStartWrite?: () => void
  onViewAbout?: () => void
}

// Pixel cloud SVG component
function PixelCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 32" className={className} style={{ imageRendering: "pixelated", ...style }}>
      <rect x="16" y="16" width="8" height="8" fill="white" />
      <rect x="24" y="16" width="8" height="8" fill="white" />
      <rect x="32" y="16" width="8" height="8" fill="white" />
      <rect x="40" y="16" width="8" height="8" fill="white" />
      <rect x="8" y="24" width="8" height="8" fill="white" />
      <rect x="16" y="24" width="8" height="8" fill="white" />
      <rect x="24" y="24" width="8" height="8" fill="white" />
      <rect x="32" y="24" width="8" height="8" fill="white" />
      <rect x="40" y="24" width="8" height="8" fill="white" />
      <rect x="48" y="24" width="8" height="8" fill="white" />
      <rect x="24" y="8" width="8" height="8" fill="white" />
      <rect x="32" y="8" width="8" height="8" fill="white" />
      <rect x="8" y="24" width="8" height="8" fill="rgba(0,0,0,0.1)" />
      <rect x="48" y="24" width="8" height="8" fill="rgba(0,0,0,0.1)" />
    </svg>
  )
}

// Pixel button component
function PixelButton({ 
  children, 
  onClick, 
  color = "#7ec850",
  borderColor = "#5a9a32",
}: { 
  children: React.ReactNode
  onClick?: () => void
  color?: string
  borderColor?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${borderColor} 100%)`,
        border: `4px solid ${borderColor}`,
        boxShadow: `
          inset -4px -4px 0 rgba(0,0,0,0.25), 
          inset 4px 4px 0 rgba(255,255,255,0.3), 
          0 6px 0 ${borderColor},
          0 8px 12px rgba(0,0,0,0.2)
        `,
        padding: "12px 24px",
        imageRendering: "pixelated",
      }}
    >
      <span 
        className="flex items-center gap-2 text-sm md:text-base lg:text-lg font-bold text-white whitespace-nowrap font-sans"
        style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
      >
        {children}
      </span>
    </motion.button>
  )
}

// Genre icon that morphs from book to target icon on scroll
function ScrollMorphIcon({
  genre,
  index,
}: {
  genre: {
    id: string
    title: string
    color: string
    summary: string
    details: string[]
    bookIcon: string
    targetIcon: string
    boxBg: string
    boxBorder: string
  }
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  })

  // Morph and expand progress
  const morphProgress = useTransform(scrollYProgress, [0, 0.6], [0, 1])
  const bookOpacity = useTransform(morphProgress, [0, 0.4], [1, 0])
  const targetOpacity = useTransform(morphProgress, [0.4, 0.8], [0, 1])
  const iconScale = useTransform(morphProgress, [0, 0.5, 1], [1.2, 1.4, 1])
  const iconRotate = useTransform(morphProgress, [0, 1], [0, 360])
  const boxExpand = useTransform(morphProgress, [0.5, 1], [0, 1])
  const boxWidth = useTransform(boxExpand, [0, 1], ["120px", "320px"])
  const boxHeight = useTransform(boxExpand, [0, 1], ["120px", "160px"])
  const textOpacity = useTransform(boxExpand, [0.3, 1], [0, 1])

  return (
    <motion.div
      ref={cardRef}
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        className="relative cursor-pointer overflow-hidden flex flex-col items-center justify-center"
        style={{ 
          width: boxWidth,
          height: boxHeight,
          backgroundColor: genre.boxBg,
          border: `4px solid ${genre.boxBorder}`,
          boxShadow: `
            inset -4px -4px 0 rgba(0,0,0,0.2), 
            inset 4px 4px 0 rgba(255,255,255,0.3),
            0 8px 0 ${genre.boxBorder},
            0 12px 20px rgba(0,0,0,0.15)
          `,
          imageRendering: "pixelated",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -4 }}
      >
        {/* Icon container */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ scale: iconScale }}
        >
          {/* Book icon (fades out) */}
          <motion.span
            className="absolute text-5xl md:text-6xl lg:text-7xl"
            style={{ opacity: bookOpacity, rotate: iconRotate }}
          >
            {genre.bookIcon}
          </motion.span>
          {/* Target icon (fades in) */}
          <motion.span
            className="absolute text-5xl md:text-6xl lg:text-7xl"
            style={{ opacity: targetOpacity, rotate: iconRotate }}
          >
            {genre.targetIcon}
          </motion.span>
        </motion.div>

        {/* Title appears as box expands */}
        <motion.div 
          className="absolute bottom-3 left-0 right-0 text-center"
          style={{ opacity: textOpacity }}
        >
          <span 
            className="text-lg md:text-xl font-bold text-gray-900 font-sans"
            style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}
          >
            {genre.title}
          </span>
        </motion.div>

        {/* Hover tooltip with full details */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 translate-y-full z-50 w-72 p-4"
            style={{
              backgroundColor: "#FFF8E1",
              border: "4px solid #8b6914",
              boxShadow: "0 8px 0 #8b6914, 0 12px 20px rgba(0,0,0,0.2)",
            }}
          >
            <p className="text-sm text-gray-800 font-sans mb-2">{genre.summary}</p>
            <ul className="space-y-1">
              {genre.details.map((detail, i) => (
                <li key={i} className="text-xs text-gray-600 font-sans flex items-start gap-1">
                  <span>-</span> {detail}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

const genreData = [
  {
    id: "story",
    title: "Story",
    color: "#FFD54F",
    summary: "Build worlds, invent characters, and shape unforgettable plots.",
    details: [
      "Designing characters, settings, and conflicts",
      "Organising events into a clear beginning, middle, and end",
      "Using detail to show rather than tell",
    ],
    bookIcon: "\u{1F4D6}", // open book
    targetIcon: "\u{1F3F0}", // castle
    boxBg: "#FFE082",
    boxBorder: "#FFA000",
  },
  {
    id: "review",
    title: "Book Review",
    color: "#F8BBD9",
    summary: "Think deeply, take a stance, and guide readers with your opinion.",
    details: [
      "Stating a clear opinion about a text",
      "Supporting ideas with quotes",
      "Balancing summary with analysis",
    ],
    bookIcon: "\u{1F4D6}",
    targetIcon: "\u{1F50D}", // magnifying glass
    boxBg: "#F8BBD0",
    boxBorder: "#EC407A",
  },
  {
    id: "letter",
    title: "Letter Writing",
    color: "#FFECB3",
    summary: "Write with a real voice to connect hearts across distance.",
    details: [
      "Matching tone to your relationship",
      "Explaining events clearly",
      "Organising real-life details",
    ],
    bookIcon: "\u{1F4D6}",
    targetIcon: "\u{2709}\u{FE0F}", // envelope
    boxBg: "#FFF9C4",
    boxBorder: "#FBC02D",
  },
  {
    id: "drama",
    title: "Drama Script",
    color: "#F48FB1",
    summary: "Turn words into scenes, voices, and action on stage.",
    details: [
      "Writing believable dialogue",
      "Using stage directions",
      "Thinking in scenes and beats",
    ],
    bookIcon: "\u{1F4D6}",
    targetIcon: "\u{1F3AD}", // theater masks
    boxBg: "#CE93D8",
    boxBorder: "#8E24AA",
  },
  {
    id: "poetry",
    title: "Poetry",
    color: "#FCE4EC",
    summary: "Play with rhythm, images, and silence between the lines.",
    details: [
      "Choosing precise, image-rich words",
      "Playing with rhythm and line breaks",
      "Exploring different poetic forms",
    ],
    bookIcon: "\u{1F4D6}",
    targetIcon: "\u{2728}", // sparkles
    boxBg: "#B3E5FC",
    boxBorder: "#0288D1",
  },
]

const translations = {
  en: {
    welcome: "Welcome to",
    subtitleTop: "The Future of Creative Writing",
    subtitleBottom: "in the AI Era",
    tagline: "Unleash Creativity, Empower Expression",
    startButton: "Start a new journey",
    continueButton: "Continue past journey",
    scrollHint: "Scroll down to explore",
  },
  zh: {
    welcome: "Welcome to",
    subtitleTop: "Creative Writing",
    subtitleBottom: "in the AI Era",
    tagline: "Unleash Creativity, Empower Expression",
    startButton: "Start a new journey",
    continueButton: "Continue past journey",
    scrollHint: "Scroll down to explore",
  },
}

export default function HomePage({ language = "en", onStartPlan, onContinuePastJourney, onVisitFarm }: HomePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const startJourneyAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastStartSoundAtRef = useRef(0)
  const t = translations[language] || translations.en

  const { scrollYProgress } = useScroll({ target: containerRef })

  // Mouse position for title glow effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  // Parallax transforms for clouds
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "180%"])
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "120%"])
  const cloud3Y = useTransform(scrollYProgress, [0, 1], ["0%", "220%"])
  const cloud4Y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const cloud5Y = useTransform(scrollYProgress, [0, 1], ["0%", "200%"])

  // Track mouse for title glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  // Preload audio
  useEffect(() => {
    try {
      if (!startJourneyAudioRef.current) {
        startJourneyAudioRef.current = new Audio("/bit.mp3")
        startJourneyAudioRef.current.preload = "auto"
        startJourneyAudioRef.current.volume = 0.252
        startJourneyAudioRef.current.load?.()
      }
    } catch {
      // ignore
    }
  }, [])

  const playStartJourneySound = () => {
    const now = Date.now()
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

  const handleStartJourneyClick = () => {
    playStartJourneySound()
    onStartPlan?.()
  }

  const handleContinuePastJourneyClick = () => {
    playStartJourneySound()
    onContinuePastJourney?.()
  }

  const handleVisitFarmClick = () => {
    playStartJourneySound()
    onVisitFarm?.()
  }

  return (
    <main ref={containerRef} className="relative w-full overflow-x-hidden cursor-none">
      <CustomCursor />

      {/* Pixel Sky Background - Fixed, deeper blue */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #4A90D9 0%, #6BB3F0 25%, #87CEEB 50%, #B0E0E6 75%, #E8F4F8 100%)",
          }}
        />
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)
            `,
            backgroundSize: "8px 8px",
          }}
        />
      </div>

      {/* Parallax Pixel Clouds - Background Layer */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - starts from 30% */}
        <motion.div
          className="absolute"
          style={{ top: "8%", left: "30%", y: cloud1Y }}
          animate={{ x: ["0%", "70vw", "0%"] }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-48 md:w-64 h-auto opacity-95" />
        </motion.div>

        {/* Cloud 2 - starts from 60% */}
        <motion.div
          className="absolute"
          style={{ top: "18%", left: "60%", y: cloud2Y }}
          animate={{ x: ["0%", "-80vw", "0%"] }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear", delay: 10 }}
        >
          <PixelCloud className="w-40 md:w-56 h-auto opacity-85" />
        </motion.div>

        {/* Cloud 3 - starts from 10% */}
        <motion.div
          className="absolute"
          style={{ top: "28%", left: "10%", y: cloud3Y }}
          animate={{ x: ["0%", "90vw", "0%"] }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear", delay: 25 }}
        >
          <PixelCloud className="w-32 md:w-48 h-auto opacity-90" />
        </motion.div>

        {/* Cloud 4 - starts from 75% */}
        <motion.div
          className="absolute"
          style={{ top: "42%", left: "75%", y: cloud4Y }}
          animate={{ x: ["0%", "-60vw", "0%"] }}
          transition={{ duration: 160, repeat: Infinity, ease: "linear", delay: 40 }}
        >
          <PixelCloud className="w-56 md:w-72 h-auto opacity-75" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {/* Foreground cloud 1 - starts from 45% */}
        <motion.div
          className="absolute"
          style={{ top: "38%", left: "45%", y: cloud5Y }}
          animate={{ x: ["0%", "55vw", "0%"] }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear", delay: 5 }}
        >
          <PixelCloud className="w-36 md:w-52 h-auto opacity-98" />
        </motion.div>

        {/* Foreground cloud 2 - starts from 80% */}
        <motion.div
          className="absolute"
          style={{ top: "58%", left: "80%", y: cloud2Y }}
          animate={{ x: ["0%", "-100vw", "0%"] }}
          transition={{ duration: 130, repeat: Infinity, ease: "linear", delay: 20 }}
        >
          <PixelCloud className="w-44 md:w-60 h-auto opacity-95" />
        </motion.div>

        {/* Foreground cloud 3 - starts from 5% */}
        <motion.div
          className="absolute"
          style={{ top: "72%", left: "5%", y: cloud1Y }}
          animate={{ x: ["0%", "95vw", "0%"] }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear", delay: 35 }}
        >
          <PixelCloud className="w-40 md:w-56 h-auto opacity-90" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Section 1: Hero (100vh) */}
        <section ref={heroRef} className="min-h-screen flex flex-col items-center justify-center px-6 pt-24">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Floating animation wrapper */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-700 mb-4 font-sans">
                {t.welcome}
              </p>
              
              {/* CWrite with mouse-reactive glow */}
              <div className="relative">
                <motion.h1 
                  className="text-8xl md:text-9xl lg:text-[14rem] font-bold leading-none tracking-tight font-sans"
                  style={{
                    background: "linear-gradient(135deg, #FF6B9D 0%, #FFD93D 25%, #FF6B9D 50%, #FFD93D 75%, #FF6B9D 100%)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  CWrite
                </motion.h1>
                {/* Mouse-reactive glow overlay */}
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-full blur-3xl"
                  style={{
                    background: "radial-gradient(circle, rgba(255,215,100,0.6) 0%, transparent 70%)",
                    width: 300,
                    height: 300,
                    x: smoothMouseX,
                    y: smoothMouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                    mixBlendMode: "soft-light",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-800 font-sans">
              {t.subtitleTop}
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mt-3 font-sans">
              {t.subtitleBottom}
            </p>
          </motion.div>

          <motion.p
            className="mt-8 text-2xl md:text-3xl lg:text-4xl text-gray-500 font-sans italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {t.tagline}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <span className="text-base md:text-lg font-sans">{t.scrollHint}</span>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </motion.div>
        </section>

        {/* Section 2: The 5 Writing Genres - Scroll morph icons */}
        <section className="py-24 md:py-40 px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 max-w-6xl mx-auto">
            {genreData.map((genre, index) => (
              <ScrollMorphIcon key={genre.id} genre={genre} index={index} />
            ))}
          </div>
        </section>

        {/* Section 3: Bottom Action Buttons - Horizontal Pixel Style */}
        <section className="py-24 md:py-40 px-6">
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Start a new journey */}
            <PixelButton 
              onClick={handleStartJourneyClick}
              color="#7ec850"
              borderColor="#5a9a32"
            >
              Start a new journey
              <span className="text-lg md:text-xl">&#9992;</span>
            </PixelButton>

            {/* Continue past journey */}
            <PixelButton 
              onClick={handleContinuePastJourneyClick}
              color="#64B5F6"
              borderColor="#1976D2"
            >
              Continue past journey
              <span className="text-lg md:text-xl">&#9198;</span>
            </PixelButton>

            {/* Visit my farm */}
            <PixelButton 
              onClick={handleVisitFarmClick}
              color="#FFB74D"
              borderColor="#F57C00"
            >
              Visit my farm
              <span className="text-lg md:text-xl">&#127968;</span>
            </PixelButton>
          </motion.div>

          {/* Bottom spacing */}
          <div className="h-20" />
        </section>
      </div>
    </main>
  )
}
