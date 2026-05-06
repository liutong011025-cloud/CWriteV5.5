"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
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

// Pixel cloud SVG component - very small pixels (2x2)
function PixelCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 32" className={className} style={{ imageRendering: "pixelated", ...style }}>
      {/* Row 1 - top */}
      <rect x="20" y="4" width="2" height="2" fill="white" />
      <rect x="22" y="4" width="2" height="2" fill="white" />
      <rect x="24" y="4" width="2" height="2" fill="white" />
      <rect x="26" y="4" width="2" height="2" fill="white" />
      <rect x="28" y="4" width="2" height="2" fill="white" />
      <rect x="30" y="4" width="2" height="2" fill="white" />
      <rect x="32" y="4" width="2" height="2" fill="white" />
      <rect x="34" y="4" width="2" height="2" fill="white" />
      {/* Row 2 */}
      <rect x="16" y="6" width="2" height="2" fill="white" />
      <rect x="18" y="6" width="2" height="2" fill="white" />
      <rect x="20" y="6" width="2" height="2" fill="white" />
      <rect x="22" y="6" width="2" height="2" fill="white" />
      <rect x="24" y="6" width="2" height="2" fill="white" />
      <rect x="26" y="6" width="2" height="2" fill="white" />
      <rect x="28" y="6" width="2" height="2" fill="white" />
      <rect x="30" y="6" width="2" height="2" fill="white" />
      <rect x="32" y="6" width="2" height="2" fill="white" />
      <rect x="34" y="6" width="2" height="2" fill="white" />
      <rect x="36" y="6" width="2" height="2" fill="white" />
      <rect x="38" y="6" width="2" height="2" fill="white" />
      <rect x="40" y="6" width="2" height="2" fill="white" />
      {/* Row 3 */}
      <rect x="12" y="8" width="2" height="2" fill="white" />
      <rect x="14" y="8" width="2" height="2" fill="white" />
      <rect x="16" y="8" width="2" height="2" fill="white" />
      <rect x="18" y="8" width="2" height="2" fill="white" />
      <rect x="20" y="8" width="2" height="2" fill="white" />
      <rect x="22" y="8" width="2" height="2" fill="white" />
      <rect x="24" y="8" width="2" height="2" fill="white" />
      <rect x="26" y="8" width="2" height="2" fill="white" />
      <rect x="28" y="8" width="2" height="2" fill="white" />
      <rect x="30" y="8" width="2" height="2" fill="white" />
      <rect x="32" y="8" width="2" height="2" fill="white" />
      <rect x="34" y="8" width="2" height="2" fill="white" />
      <rect x="36" y="8" width="2" height="2" fill="white" />
      <rect x="38" y="8" width="2" height="2" fill="white" />
      <rect x="40" y="8" width="2" height="2" fill="white" />
      <rect x="42" y="8" width="2" height="2" fill="white" />
      <rect x="44" y="8" width="2" height="2" fill="white" />
      {/* Row 4 */}
      <rect x="8" y="10" width="2" height="2" fill="white" />
      <rect x="10" y="10" width="2" height="2" fill="white" />
      <rect x="12" y="10" width="2" height="2" fill="white" />
      <rect x="14" y="10" width="2" height="2" fill="white" />
      <rect x="16" y="10" width="2" height="2" fill="white" />
      <rect x="18" y="10" width="2" height="2" fill="white" />
      <rect x="20" y="10" width="2" height="2" fill="white" />
      <rect x="22" y="10" width="2" height="2" fill="white" />
      <rect x="24" y="10" width="2" height="2" fill="white" />
      <rect x="26" y="10" width="2" height="2" fill="white" />
      <rect x="28" y="10" width="2" height="2" fill="white" />
      <rect x="30" y="10" width="2" height="2" fill="white" />
      <rect x="32" y="10" width="2" height="2" fill="white" />
      <rect x="34" y="10" width="2" height="2" fill="white" />
      <rect x="36" y="10" width="2" height="2" fill="white" />
      <rect x="38" y="10" width="2" height="2" fill="white" />
      <rect x="40" y="10" width="2" height="2" fill="white" />
      <rect x="42" y="10" width="2" height="2" fill="white" />
      <rect x="44" y="10" width="2" height="2" fill="white" />
      <rect x="46" y="10" width="2" height="2" fill="white" />
      <rect x="48" y="10" width="2" height="2" fill="white" />
      {/* Row 5 */}
      <rect x="6" y="12" width="2" height="2" fill="white" />
      <rect x="8" y="12" width="2" height="2" fill="white" />
      <rect x="10" y="12" width="2" height="2" fill="white" />
      <rect x="12" y="12" width="2" height="2" fill="white" />
      <rect x="14" y="12" width="2" height="2" fill="white" />
      <rect x="16" y="12" width="2" height="2" fill="white" />
      <rect x="18" y="12" width="2" height="2" fill="white" />
      <rect x="20" y="12" width="2" height="2" fill="white" />
      <rect x="22" y="12" width="2" height="2" fill="white" />
      <rect x="24" y="12" width="2" height="2" fill="white" />
      <rect x="26" y="12" width="2" height="2" fill="white" />
      <rect x="28" y="12" width="2" height="2" fill="white" />
      <rect x="30" y="12" width="2" height="2" fill="white" />
      <rect x="32" y="12" width="2" height="2" fill="white" />
      <rect x="34" y="12" width="2" height="2" fill="white" />
      <rect x="36" y="12" width="2" height="2" fill="white" />
      <rect x="38" y="12" width="2" height="2" fill="white" />
      <rect x="40" y="12" width="2" height="2" fill="white" />
      <rect x="42" y="12" width="2" height="2" fill="white" />
      <rect x="44" y="12" width="2" height="2" fill="white" />
      <rect x="46" y="12" width="2" height="2" fill="white" />
      <rect x="48" y="12" width="2" height="2" fill="white" />
      <rect x="50" y="12" width="2" height="2" fill="white" />
      <rect x="52" y="12" width="2" height="2" fill="white" />
      {/* Row 6 - bottom */}
      <rect x="6" y="14" width="2" height="2" fill="white" />
      <rect x="8" y="14" width="2" height="2" fill="white" />
      <rect x="10" y="14" width="2" height="2" fill="white" />
      <rect x="12" y="14" width="2" height="2" fill="white" />
      <rect x="14" y="14" width="2" height="2" fill="white" />
      <rect x="16" y="14" width="2" height="2" fill="white" />
      <rect x="18" y="14" width="2" height="2" fill="white" />
      <rect x="20" y="14" width="2" height="2" fill="white" />
      <rect x="22" y="14" width="2" height="2" fill="white" />
      <rect x="24" y="14" width="2" height="2" fill="white" />
      <rect x="26" y="14" width="2" height="2" fill="white" />
      <rect x="28" y="14" width="2" height="2" fill="white" />
      <rect x="30" y="14" width="2" height="2" fill="white" />
      <rect x="32" y="14" width="2" height="2" fill="white" />
      <rect x="34" y="14" width="2" height="2" fill="white" />
      <rect x="36" y="14" width="2" height="2" fill="white" />
      <rect x="38" y="14" width="2" height="2" fill="white" />
      <rect x="40" y="14" width="2" height="2" fill="white" />
      <rect x="42" y="14" width="2" height="2" fill="white" />
      <rect x="44" y="14" width="2" height="2" fill="white" />
      <rect x="46" y="14" width="2" height="2" fill="white" />
      <rect x="48" y="14" width="2" height="2" fill="white" />
      <rect x="50" y="14" width="2" height="2" fill="white" />
      <rect x="52" y="14" width="2" height="2" fill="white" />
      <rect x="54" y="14" width="2" height="2" fill="white" />
      {/* Shadow */}
      <rect x="6" y="16" width="2" height="2" fill="rgba(0,0,0,0.06)" />
      <rect x="54" y="16" width="2" height="2" fill="rgba(0,0,0,0.06)" />
    </svg>
  )
}

// Pixel button component with glow effect
function PixelButton({ 
  children, 
  onClick, 
  color = "#7ec850",
  borderColor = "#5a9a32",
  isAtBottom = false,
}: { 
  children: React.ReactNode
  onClick?: () => void
  color?: string
  borderColor?: string
  isAtBottom?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative focus:outline-none"
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.98, y: 0 }}
      animate={{
        boxShadow: isAtBottom 
          ? isHovered
            ? `0 0 40px 12px ${color}, 0 0 60px 20px ${color}80`
            : `0 0 25px 6px ${color}90, 0 0 40px 12px ${color}50`
          : `0 10px 0 ${borderColor}, 0 12px 20px rgba(0,0,0,0.25)`,
      }}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${borderColor} 100%)`,
        border: `6px solid ${borderColor}`,
        boxShadow: `
          inset -6px -6px 0 rgba(0,0,0,0.25), 
          inset 6px 6px 0 rgba(255,255,255,0.35), 
          0 10px 0 ${borderColor},
          0 12px 20px rgba(0,0,0,0.25)
        `,
        padding: "22px 48px",
        imageRendering: "pixelated",
      }}
    >
      <span 
        className="flex items-center gap-4 text-xl md:text-2xl lg:text-3xl font-bold text-white whitespace-nowrap font-sans"
        style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}
      >
        {children}
      </span>
    </motion.button>
  )
}

// Genre icon that morphs from book to target icon on scroll
// Starts as ONLY emoji floating, box expands LATER in scroll
function ScrollMorphIcon({
  genre,
  index,
  hoveredId,
  setHoveredId,
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
    themeElements: string[]
  }
  index: number
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isHovered = hoveredId === genre.id
  const isAnyHovered = hoveredId !== null
  const shouldMoveAway = isAnyHovered && !isHovered

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  })

  // Morph progress: 0 = just emoji, 1 = full box - DELAYED
  const morphProgress = useTransform(scrollYProgress, [0.2, 0.9], [0, 1])
  
  // Icon crossfade - happens LATER
  const bookOpacity = useTransform(morphProgress, [0, 0.4, 0.6], [1, 1, 0])
  const bookScale = useTransform(morphProgress, [0.4, 0.6], [1, 0.5])
  const bookRotate = useTransform(morphProgress, [0.4, 0.6], [0, -20])
  
  const targetOpacity = useTransform(morphProgress, [0.5, 0.8], [0, 1])
  const targetScale = useTransform(morphProgress, [0.5, 0.7, 0.85], [0.4, 1.2, 1])
  
  // Box expansion - starts MUCH later in scroll
  const boxOpacity = useTransform(morphProgress, [0.6, 0.8], [0, 1])
  const boxScale = useTransform(morphProgress, [0.6, 0.9], [0.2, 1])
  
  // Title appears last
  const titleOpacity = useTransform(morphProgress, [0.8, 1], [0, 1])

  return (
    <motion.div
      ref={cardRef}
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      animate={{
        scale: shouldMoveAway ? 0.9 : 1,
        x: shouldMoveAway ? (index < 2 ? -30 : index > 2 ? 30 : 0) : 0,
        opacity: shouldMoveAway ? 0.7 : 1,
      }}
    >
      {/* Container for icon + box */}
      <div 
        className="relative flex flex-col items-center justify-center cursor-pointer"
        onMouseEnter={() => setHoveredId(genre.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* The pixel box - expands from nothing, BIGGER when complete */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{ 
            opacity: boxOpacity,
            scale: boxScale,
            width: isHovered ? 400 : 320,
            height: isHovered ? 280 : 200,
            backgroundColor: genre.boxBg,
            border: `6px solid ${genre.boxBorder}`,
            boxShadow: `
              inset -6px -6px 0 rgba(0,0,0,0.2), 
              inset 6px 6px 0 rgba(255,255,255,0.35),
              0 12px 0 ${genre.boxBorder},
              0 16px 30px rgba(0,0,0,0.2)
            `,
            imageRendering: "pixelated",
            transition: "width 0.3s, height 0.3s",
          }}
        />

        {/* Icon container */}
        <div className="relative w-[320px] h-[200px] flex items-center justify-center z-10">
          {/* Book icon (fades out) */}
          <motion.span
            className="absolute text-7xl md:text-8xl lg:text-9xl"
            style={{ 
              opacity: bookOpacity, 
              scale: bookScale,
              rotate: bookRotate,
            }}
          >
            {genre.bookIcon}
          </motion.span>
          
          {/* Target icon (fades in) */}
          <motion.span
            className="absolute text-7xl md:text-8xl lg:text-9xl"
            style={{ 
              opacity: targetOpacity, 
              scale: targetScale,
            }}
          >
            {genre.targetIcon}
          </motion.span>

          {/* Theme elements when hovered - floating around icon */}
          <AnimatePresence>
            {isHovered && (
              <>
                {genre.themeElements.map((el, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-3xl md:text-4xl"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: Math.cos((i * 2 * Math.PI) / genre.themeElements.length) * 100,
                      y: Math.sin((i * 2 * Math.PI) / genre.themeElements.length) * 60,
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    {el}
                  </motion.span>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Title below icon */}
          <motion.div 
            className="absolute bottom-3 left-0 right-0 text-center"
            style={{ opacity: titleOpacity }}
          >
            <span 
              className="text-2xl md:text-3xl font-bold text-gray-900 font-sans"
              style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.7)" }}
            >
              {genre.title}
            </span>
          </motion.div>
        </div>

        {/* Hover details - INSIDE the box, larger text */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
              style={{
                width: 400,
                height: 280,
                backgroundColor: genre.boxBg,
                border: `6px solid ${genre.boxBorder}`,
                boxShadow: `
                  inset -6px -6px 0 rgba(0,0,0,0.2), 
                  inset 6px 6px 0 rgba(255,255,255,0.35),
                  0 12px 0 ${genre.boxBorder},
                  0 16px 30px rgba(0,0,0,0.25)
                `,
                imageRendering: "pixelated",
              }}
            >
              {/* Icon at top */}
              <span className="text-5xl mb-3">{genre.targetIcon}</span>
              
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-sans mb-3"
                style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.7)" }}
              >
                {genre.title}
              </h3>
              
              {/* Summary - larger */}
              <p className="text-lg md:text-xl text-gray-800 font-sans text-center mb-3 font-medium">
                {genre.summary}
              </p>
              
              {/* Details */}
              <ul className="space-y-1 text-sm md:text-base text-gray-700 font-sans">
                {genre.details.slice(0, 2).map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-500">-</span> {detail}
                  </li>
                ))}
              </ul>

              {/* Theme elements floating */}
              {genre.themeElements.map((el, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  animate={{ 
                    x: Math.cos((i * 2 * Math.PI) / genre.themeElements.length + Date.now() / 2000) * 160,
                    y: Math.sin((i * 2 * Math.PI) / genre.themeElements.length + Date.now() / 2000) * 110,
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ opacity: 0.7 }}
                >
                  {el}
                </motion.span>
              ))}
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
    bookIcon: "\u{1F4D6}",
    targetIcon: "\u{1F3F0}",
    boxBg: "#FFE082",
    boxBorder: "#FFA000",
    themeElements: ["\u{1F451}", "\u{2694}\u{FE0F}", "\u{1F409}", "\u{1F31F}"],
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
    targetIcon: "\u{1F50D}",
    boxBg: "#F8BBD0",
    boxBorder: "#EC407A",
    themeElements: ["\u{1F4DD}", "\u{2B50}", "\u{1F4A1}", "\u{1F914}"],
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
    targetIcon: "\u{2709}\u{FE0F}",
    boxBg: "#FFF9C4",
    boxBorder: "#FBC02D",
    themeElements: ["\u{1F48C}", "\u{1F4EE}", "\u{2764}\u{FE0F}", "\u{270D}\u{FE0F}"],
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
    targetIcon: "\u{1F3AD}",
    boxBg: "#CE93D8",
    boxBorder: "#8E24AA",
    themeElements: ["\u{1F3AC}", "\u{1F4A5}", "\u{1F399}\u{FE0F}", "\u{2728}"],
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
    targetIcon: "\u{2728}",
    boxBg: "#B3E5FC",
    boxBorder: "#0288D1",
    themeElements: ["\u{1F319}", "\u{1F338}", "\u{1F4AB}", "\u{2665}\u{FE0F}"],
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
  const startJourneyAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastStartSoundAtRef = useRef(0)
  const t = translations[language] || translations.en
  const [hoveredGenreId, setHoveredGenreId] = useState<string | null>(null)

  const { scrollYProgress } = useScroll({ target: containerRef })
  
  // Hide scroll hint when near bottom (0.92+)
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.88, 0.92], [1, 1, 0])
  
  // Button glow when at bottom
  const [isAtBottom, setIsAtBottom] = useState(false)
  
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setIsAtBottom(v > 0.9)
    })
  }, [scrollYProgress])

  // Parallax transforms for clouds
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "250%"])
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "180%"])
  const cloud3Y = useTransform(scrollYProgress, [0, 1], ["0%", "300%"])
  const cloud4Y = useTransform(scrollYProgress, [0, 1], ["0%", "150%"])

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
            background: "linear-gradient(180deg, #1E6FBA 0%, #2E8DD6 15%, #4AA3E8 35%, #6BB9F2 55%, #8DCEF8 75%, #B0E0FC 100%)",
          }}
        />
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "4px 4px",
          }}
        />
      </div>

      {/* Parallax Pixel Clouds - Animated, positioned to avoid hero text */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - top left, starts moving */}
        <motion.div
          className="absolute"
          style={{ top: "2%", left: "5%", y: cloud1Y }}
          animate={{ x: ["0%", "80vw", "0%"] }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-44 md:w-60 h-auto opacity-95" />
        </motion.div>

        {/* Cloud 2 - top right */}
        <motion.div
          className="absolute"
          style={{ top: "5%", left: "65%", y: cloud2Y }}
          animate={{ x: ["0%", "-60vw", "0%"] }}
          transition={{ duration: 160, repeat: Infinity, ease: "linear", delay: 20 }}
        >
          <PixelCloud className="w-40 md:w-52 h-auto opacity-90" />
        </motion.div>

        {/* Cloud 3 - below hero (70%+) */}
        <motion.div
          className="absolute"
          style={{ top: "72%", left: "12%", y: cloud3Y }}
          animate={{ x: ["0%", "75vw", "0%"] }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear", delay: 40 }}
        >
          <PixelCloud className="w-56 md:w-80 h-auto opacity-95" />
        </motion.div>

        {/* Cloud 4 - below hero */}
        <motion.div
          className="absolute"
          style={{ top: "78%", left: "50%", y: cloud4Y }}
          animate={{ x: ["0%", "-65vw", "0%"] }}
          transition={{ duration: 170, repeat: Infinity, ease: "linear", delay: 60 }}
        >
          <PixelCloud className="w-48 md:w-64 h-auto opacity-92" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content, below hero */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute"
          style={{ top: "75%", left: "30%", y: cloud1Y }}
          animate={{ x: ["0%", "55vw", "0%"] }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear", delay: 15 }}
        >
          <PixelCloud className="w-42 md:w-56 h-auto opacity-95" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "85%", left: "75%", y: cloud2Y }}
          animate={{ x: ["0%", "-85vw", "0%"] }}
          transition={{ duration: 160, repeat: Infinity, ease: "linear", delay: 35 }}
        >
          <PixelCloud className="w-46 md:w-62 h-auto opacity-93" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Section 1: Hero (100vh) */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
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
              <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 font-sans">
                {t.welcome}
              </p>
              
              {/* CWrite - NO mouse glow effect */}
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
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-800 font-sans">
              {t.subtitleTop}
            </p>
            <p className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-700 mt-4 font-sans">
              {t.subtitleBottom}
            </p>
          </motion.div>

          <motion.p
            className="mt-10 text-2xl md:text-4xl lg:text-5xl font-bold text-gray-600 font-sans italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {t.tagline}
          </motion.p>

          {/* Scroll down hint in hero - bouncing arrow only */}
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ opacity: scrollHintOpacity }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </section>

        {/* Section 2: The 5 Writing Genres - Scroll morph icons */}
        <section className="py-40 md:py-56 px-6">
          <div className="flex flex-wrap justify-center gap-16 md:gap-20 lg:gap-24 max-w-7xl mx-auto">
            {genreData.map((genre, index) => (
              <ScrollMorphIcon 
                key={genre.id} 
                genre={genre} 
                index={index}
                hoveredId={hoveredGenreId}
                setHoveredId={setHoveredGenreId}
              />
            ))}
          </div>
        </section>

        {/* Section 3: Bottom Action Buttons - Horizontal, close to bottom */}
        <section className="py-16 px-6">
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
              isAtBottom={isAtBottom}
            >
              Start a new journey
              <span className="text-3xl md:text-4xl">&#9992;</span>
            </PixelButton>

            {/* Continue past journey */}
            <PixelButton 
              onClick={handleContinuePastJourneyClick}
              color="#64B5F6"
              borderColor="#1976D2"
              isAtBottom={isAtBottom}
            >
              Continue past journey
              <span className="text-3xl md:text-4xl">&#9198;</span>
            </PixelButton>

            {/* Visit my farm */}
            <PixelButton 
              onClick={handleVisitFarmClick}
              color="#FFB74D"
              borderColor="#F57C00"
              isAtBottom={isAtBottom}
            >
              Visit my farm
              <span className="text-3xl md:text-4xl">&#127968;</span>
            </PixelButton>
          </motion.div>
        </section>
      </div>

      {/* Fixed scroll hint at bottom - hidden when at bottom, NO arrow */}
      <motion.div
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40"
        style={{ opacity: scrollHintOpacity }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/85 backdrop-blur-sm"
          style={{
            border: "4px solid #4A9BE8",
            boxShadow: "0 6px 0 #2E7DD1, 0 8px 16px rgba(0,0,0,0.18)",
            imageRendering: "pixelated",
          }}
        >
          <span className="text-xl md:text-2xl font-sans font-bold text-gray-700">{t.scrollHint}</span>
        </motion.div>
      </motion.div>
    </main>
  )
}
