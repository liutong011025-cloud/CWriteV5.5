"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
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

// Pixel cloud SVG component - smaller pixels (4x4 instead of 8x8)
function PixelCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 32" className={className} style={{ imageRendering: "pixelated", ...style }}>
      {/* Row 1 - top */}
      <rect x="20" y="4" width="4" height="4" fill="white" />
      <rect x="24" y="4" width="4" height="4" fill="white" />
      <rect x="28" y="4" width="4" height="4" fill="white" />
      <rect x="32" y="4" width="4" height="4" fill="white" />
      {/* Row 2 */}
      <rect x="16" y="8" width="4" height="4" fill="white" />
      <rect x="20" y="8" width="4" height="4" fill="white" />
      <rect x="24" y="8" width="4" height="4" fill="white" />
      <rect x="28" y="8" width="4" height="4" fill="white" />
      <rect x="32" y="8" width="4" height="4" fill="white" />
      <rect x="36" y="8" width="4" height="4" fill="white" />
      <rect x="40" y="8" width="4" height="4" fill="white" />
      {/* Row 3 */}
      <rect x="12" y="12" width="4" height="4" fill="white" />
      <rect x="16" y="12" width="4" height="4" fill="white" />
      <rect x="20" y="12" width="4" height="4" fill="white" />
      <rect x="24" y="12" width="4" height="4" fill="white" />
      <rect x="28" y="12" width="4" height="4" fill="white" />
      <rect x="32" y="12" width="4" height="4" fill="white" />
      <rect x="36" y="12" width="4" height="4" fill="white" />
      <rect x="40" y="12" width="4" height="4" fill="white" />
      <rect x="44" y="12" width="4" height="4" fill="white" />
      {/* Row 4 */}
      <rect x="8" y="16" width="4" height="4" fill="white" />
      <rect x="12" y="16" width="4" height="4" fill="white" />
      <rect x="16" y="16" width="4" height="4" fill="white" />
      <rect x="20" y="16" width="4" height="4" fill="white" />
      <rect x="24" y="16" width="4" height="4" fill="white" />
      <rect x="28" y="16" width="4" height="4" fill="white" />
      <rect x="32" y="16" width="4" height="4" fill="white" />
      <rect x="36" y="16" width="4" height="4" fill="white" />
      <rect x="40" y="16" width="4" height="4" fill="white" />
      <rect x="44" y="16" width="4" height="4" fill="white" />
      <rect x="48" y="16" width="4" height="4" fill="white" />
      {/* Row 5 - bottom */}
      <rect x="8" y="20" width="4" height="4" fill="white" />
      <rect x="12" y="20" width="4" height="4" fill="white" />
      <rect x="16" y="20" width="4" height="4" fill="white" />
      <rect x="20" y="20" width="4" height="4" fill="white" />
      <rect x="24" y="20" width="4" height="4" fill="white" />
      <rect x="28" y="20" width="4" height="4" fill="white" />
      <rect x="32" y="20" width="4" height="4" fill="white" />
      <rect x="36" y="20" width="4" height="4" fill="white" />
      <rect x="40" y="20" width="4" height="4" fill="white" />
      <rect x="44" y="20" width="4" height="4" fill="white" />
      <rect x="48" y="20" width="4" height="4" fill="white" />
      <rect x="52" y="20" width="4" height="4" fill="white" />
      {/* Shadow */}
      <rect x="8" y="24" width="4" height="4" fill="rgba(0,0,0,0.08)" />
      <rect x="52" y="24" width="4" height="4" fill="rgba(0,0,0,0.08)" />
    </svg>
  )
}

// Pixel button component - BIGGER
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
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.98, y: 0 }}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${borderColor} 100%)`,
        border: `5px solid ${borderColor}`,
        boxShadow: `
          inset -5px -5px 0 rgba(0,0,0,0.25), 
          inset 5px 5px 0 rgba(255,255,255,0.3), 
          0 8px 0 ${borderColor},
          0 10px 16px rgba(0,0,0,0.25)
        `,
        padding: "18px 36px",
        imageRendering: "pixelated",
      }}
    >
      <span 
        className="flex items-center gap-3 text-lg md:text-xl lg:text-2xl font-bold text-white whitespace-nowrap font-sans"
        style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.35)" }}
      >
        {children}
      </span>
    </motion.button>
  )
}

// Genre icon that morphs from book to target icon on scroll
// Starts as ONLY emoji, box expands as you scroll
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

  // Morph progress: 0 = just emoji, 1 = full box
  const morphProgress = useTransform(scrollYProgress, [0, 0.7], [0, 1])
  
  // Icon crossfade
  const bookOpacity = useTransform(morphProgress, [0, 0.3, 0.5], [1, 1, 0])
  const bookScale = useTransform(morphProgress, [0.3, 0.5], [1, 0.6])
  const bookRotate = useTransform(morphProgress, [0.3, 0.5], [0, -15])
  
  const targetOpacity = useTransform(morphProgress, [0.4, 0.7], [0, 1])
  const targetScale = useTransform(morphProgress, [0.4, 0.6, 0.75], [0.5, 1.15, 1])
  
  // Box expansion - starts invisible, expands at end
  const boxOpacity = useTransform(morphProgress, [0.5, 0.65], [0, 1])
  const boxScale = useTransform(morphProgress, [0.5, 0.75], [0.3, 1])
  
  // Title appears after box
  const titleOpacity = useTransform(morphProgress, [0.7, 0.9], [0, 1])

  return (
    <motion.div
      ref={cardRef}
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {/* Container for icon + box */}
      <div 
        className="relative flex flex-col items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The pixel box - expands from nothing */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            opacity: boxOpacity,
            scale: boxScale,
            width: 280,
            height: 180,
            marginLeft: -140,
            marginTop: -90,
            left: "50%",
            top: "50%",
            backgroundColor: genre.boxBg,
            border: `5px solid ${genre.boxBorder}`,
            boxShadow: `
              inset -5px -5px 0 rgba(0,0,0,0.2), 
              inset 5px 5px 0 rgba(255,255,255,0.3),
              0 10px 0 ${genre.boxBorder},
              0 14px 24px rgba(0,0,0,0.18)
            `,
            imageRendering: "pixelated",
          }}
        />

        {/* Icon container - always visible */}
        <div className="relative w-[280px] h-[180px] flex items-center justify-center cursor-pointer">
          {/* Book icon (fades out and shrinks) */}
          <motion.span
            className="absolute text-6xl md:text-7xl lg:text-8xl"
            style={{ 
              opacity: bookOpacity, 
              scale: bookScale,
              rotate: bookRotate,
            }}
          >
            {genre.bookIcon}
          </motion.span>
          
          {/* Target icon (fades in with spring) */}
          <motion.span
            className="absolute text-6xl md:text-7xl lg:text-8xl"
            style={{ 
              opacity: targetOpacity, 
              scale: targetScale,
            }}
          >
            {genre.targetIcon}
          </motion.span>

          {/* Title appears below icon after box expands */}
          <motion.div 
            className="absolute bottom-4 left-0 right-0 text-center"
            style={{ opacity: titleOpacity }}
          >
            <span 
              className="text-xl md:text-2xl font-bold text-gray-900 font-sans"
              style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.6)" }}
            >
              {genre.title}
            </span>
          </motion.div>
        </div>

        {/* Hover tooltip with full details */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-4 z-50 w-80 p-5"
              style={{
                backgroundColor: "#FFFBEB",
                border: "5px solid #92400E",
                boxShadow: "0 10px 0 #92400E, 0 14px 24px rgba(0,0,0,0.25)",
                imageRendering: "pixelated",
              }}
            >
              <p className="text-base text-gray-800 font-sans mb-3 font-medium">{genre.summary}</p>
              <ul className="space-y-2">
                {genre.details.map((detail, i) => (
                  <li key={i} className="text-sm text-gray-600 font-sans flex items-start gap-2">
                    <span className="text-amber-600">-</span> {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
  
  // Hide scroll hint when near bottom
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.85, 0.95], [1, 1, 0])

  // Mouse position for title glow effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  // Parallax transforms for clouds - positioned to avoid hero area
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "200%"])
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "150%"])
  const cloud3Y = useTransform(scrollYProgress, [0, 1], ["0%", "250%"])
  const cloud4Y = useTransform(scrollYProgress, [0, 1], ["0%", "120%"])

  // Track mouse for title glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }
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
            background: "linear-gradient(180deg, #2E7DD1 0%, #4A9BE8 20%, #6BB3F0 45%, #87CEEB 70%, #B8E4F8 100%)",
          }}
        />
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "4px 4px",
          }}
        />
      </div>

      {/* Parallax Pixel Clouds - Positioned to AVOID hero text area (top 15%-60%) */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - very top, won't block hero */}
        <motion.div
          className="absolute"
          style={{ top: "3%", left: "15%", y: cloud1Y }}
          animate={{ x: ["0%", "60vw", "0%"] }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-40 md:w-56 h-auto opacity-90" />
        </motion.div>

        {/* Cloud 2 - top right */}
        <motion.div
          className="absolute"
          style={{ top: "6%", left: "70%", y: cloud2Y }}
          animate={{ x: ["0%", "-50vw", "0%"] }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear", delay: 15 }}
        >
          <PixelCloud className="w-36 md:w-48 h-auto opacity-85" />
        </motion.div>

        {/* Cloud 3 - below hero area (65%+) */}
        <motion.div
          className="absolute"
          style={{ top: "68%", left: "8%", y: cloud3Y }}
          animate={{ x: ["0%", "85vw", "0%"] }}
          transition={{ duration: 220, repeat: Infinity, ease: "linear", delay: 30 }}
        >
          <PixelCloud className="w-52 md:w-72 h-auto opacity-95" />
        </motion.div>

        {/* Cloud 4 - below hero area */}
        <motion.div
          className="absolute"
          style={{ top: "75%", left: "55%", y: cloud4Y }}
          animate={{ x: ["0%", "-70vw", "0%"] }}
          transition={{ duration: 190, repeat: Infinity, ease: "linear", delay: 45 }}
        >
          <PixelCloud className="w-44 md:w-60 h-auto opacity-88" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content, also avoid hero */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {/* Foreground cloud 1 - below hero */}
        <motion.div
          className="absolute"
          style={{ top: "72%", left: "25%", y: cloud1Y }}
          animate={{ x: ["0%", "65vw", "0%"] }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear", delay: 10 }}
        >
          <PixelCloud className="w-38 md:w-52 h-auto opacity-95" />
        </motion.div>

        {/* Foreground cloud 2 - below hero */}
        <motion.div
          className="absolute"
          style={{ top: "82%", left: "80%", y: cloud2Y }}
          animate={{ x: ["0%", "-90vw", "0%"] }}
          transition={{ duration: 170, repeat: Infinity, ease: "linear", delay: 25 }}
        >
          <PixelCloud className="w-42 md:w-58 h-auto opacity-92" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Section 1: Hero (100vh) */}
        <section ref={heroRef} className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Floating animation wrapper */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-700 mb-6 font-sans">
                {t.welcome}
              </p>
              
              {/* CWrite with mouse-reactive glow */}
              <div className="relative inline-block">
                <motion.h1 
                  className="text-[7rem] md:text-[10rem] lg:text-[16rem] font-bold leading-none tracking-tight font-sans"
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
                  className="absolute pointer-events-none rounded-full blur-[60px]"
                  style={{
                    background: "radial-gradient(circle, rgba(255,220,120,0.7) 0%, transparent 70%)",
                    width: 400,
                    height: 400,
                    left: smoothMouseX,
                    top: smoothMouseY,
                    x: "-50%",
                    y: "-50%",
                    mixBlendMode: "soft-light",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-3xl md:text-5xl lg:text-6xl font-medium text-gray-800 font-sans">
              {t.subtitleTop}
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl text-gray-600 mt-4 font-sans">
              {t.subtitleBottom}
            </p>
          </motion.div>

          <motion.p
            className="mt-10 text-2xl md:text-4xl lg:text-5xl text-gray-500 font-sans italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {t.tagline}
          </motion.p>

          {/* Scroll down hint in hero - bouncing arrow */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ opacity: scrollHintOpacity }}
          >
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </motion.div>
        </section>

        {/* Section 2: The 5 Writing Genres - Scroll morph icons */}
        <section className="py-32 md:py-48 px-6">
          <div className="flex flex-wrap justify-center gap-12 md:gap-16 lg:gap-20 max-w-7xl mx-auto">
            {genreData.map((genre, index) => (
              <ScrollMorphIcon key={genre.id} genre={genre} index={index} />
            ))}
          </div>
        </section>

        {/* Section 3: Bottom Action Buttons - Horizontal Pixel Style */}
        <section className="py-32 md:py-48 px-6">
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
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
              <span className="text-2xl md:text-3xl">&#9992;</span>
            </PixelButton>

            {/* Continue past journey */}
            <PixelButton 
              onClick={handleContinuePastJourneyClick}
              color="#64B5F6"
              borderColor="#1976D2"
            >
              Continue past journey
              <span className="text-2xl md:text-3xl">&#9198;</span>
            </PixelButton>

            {/* Visit my farm */}
            <PixelButton 
              onClick={handleVisitFarmClick}
              color="#FFB74D"
              borderColor="#F57C00"
            >
              Visit my farm
              <span className="text-2xl md:text-3xl">&#127968;</span>
            </PixelButton>
          </motion.div>

          {/* Bottom spacing */}
          <div className="h-24" />
        </section>
      </div>

      {/* Fixed scroll hint at bottom of page - hidden when scrolled to bottom */}
      <motion.div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        style={{ opacity: scrollHintOpacity }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg"
          style={{
            border: "3px solid #4A9BE8",
            boxShadow: "0 4px 0 #2E7DD1, 0 6px 12px rgba(0,0,0,0.15)",
          }}
        >
          <span className="text-sm md:text-base font-sans font-medium text-gray-700">{t.scrollHint}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A9BE8" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </main>
  )
}
