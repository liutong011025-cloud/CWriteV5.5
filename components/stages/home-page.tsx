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
            ? `0 0 50px 15px ${color}, 0 0 80px 25px ${color}80`
            : `0 0 30px 8px ${color}90, 0 0 50px 15px ${color}50`
          : `0 12px 0 ${borderColor}, 0 14px 24px rgba(0,0,0,0.25)`,
      }}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${borderColor} 100%)`,
        border: `6px solid ${borderColor}`,
        boxShadow: `
          inset -6px -6px 0 rgba(0,0,0,0.25), 
          inset 6px 6px 0 rgba(255,255,255,0.35), 
          0 12px 0 ${borderColor},
          0 14px 24px rgba(0,0,0,0.25)
        `,
        padding: "24px 56px",
        imageRendering: "pixelated",
      }}
    >
      <span 
        className="flex items-center gap-5 text-2xl md:text-3xl lg:text-4xl font-bold text-white whitespace-nowrap font-sans"
        style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}
      >
        {children}
      </span>
    </motion.button>
  )
}

// Genre icon that morphs from different styled books to target icon on scroll
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
    hoverBoxBg: string
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

  // Morph progress: 0 = just emoji, 1 = full box - DELAYED even more
  const morphProgress = useTransform(scrollYProgress, [0.35, 0.95], [0, 1])
  
  // Icon crossfade - happens LATER
  const bookOpacity = useTransform(morphProgress, [0, 0.5, 0.7], [1, 1, 0])
  const bookScale = useTransform(morphProgress, [0.5, 0.7], [1, 0.5])
  const bookRotate = useTransform(morphProgress, [0.5, 0.7], [0, -20])
  
  const targetOpacity = useTransform(morphProgress, [0.6, 0.85], [0, 1])
  const targetScale = useTransform(morphProgress, [0.6, 0.75, 0.9], [0.4, 1.2, 1])
  
  // Box expansion - starts MUCH later in scroll
  const boxOpacity = useTransform(morphProgress, [0.7, 0.9], [0, 1])
  const boxScale = useTransform(morphProgress, [0.7, 1], [0.2, 1])
  
  // Title appears last
  const titleOpacity = useTransform(morphProgress, [0.85, 1], [0, 1])

  return (
    <motion.div
      ref={cardRef}
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      animate={{
        scale: shouldMoveAway ? 0.85 : 1,
        x: shouldMoveAway ? (index < 2 ? -40 : index > 2 ? 40 : 0) : 0,
        opacity: shouldMoveAway ? 0.6 : 1,
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
            width: 380,
            height: 240,
            backgroundColor: genre.boxBg,
            border: `6px solid ${genre.boxBorder}`,
            boxShadow: `
              inset -6px -6px 0 rgba(0,0,0,0.2), 
              inset 6px 6px 0 rgba(255,255,255,0.35),
              0 14px 0 ${genre.boxBorder},
              0 18px 35px rgba(0,0,0,0.2)
            `,
            imageRendering: "pixelated",
          }}
        />

        {/* Icon container - BIGGER */}
        <div className="relative w-[380px] h-[240px] flex items-center justify-center z-10">
          {/* Book icon (fades out) - Different book for each genre */}
          <motion.span
            className="absolute text-8xl md:text-9xl lg:text-[10rem]"
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
            className="absolute text-8xl md:text-9xl lg:text-[10rem]"
            style={{ 
              opacity: targetOpacity, 
              scale: targetScale,
            }}
          >
            {genre.targetIcon}
          </motion.span>

          {/* Title below icon - cute font style, more spacing */}
          <motion.div 
            className="absolute bottom-4 left-0 right-0 text-center"
            style={{ opacity: titleOpacity }}
          >
            <span 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 font-sans tracking-wide"
              style={{ 
                textShadow: "2px 2px 0 rgba(255,255,255,0.8)",
                letterSpacing: "0.05em",
              }}
            >
              {genre.title}
            </span>
          </motion.div>
        </div>

        {/* Hover details - INSIDE the box, LIGHTER background, larger text */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute z-20 flex flex-col items-center justify-center p-8"
              style={{
                width: 440,
                height: 320,
                backgroundColor: genre.hoverBoxBg,
                border: `6px solid ${genre.boxBorder}`,
                boxShadow: `
                  inset -6px -6px 0 rgba(0,0,0,0.15), 
                  inset 6px 6px 0 rgba(255,255,255,0.5),
                  0 14px 0 ${genre.boxBorder},
                  0 20px 40px rgba(0,0,0,0.25)
                `,
                imageRendering: "pixelated",
              }}
            >
              {/* Icon at top */}
              <span className="text-6xl mb-4">{genre.targetIcon}</span>
              
              {/* Title - cute style */}
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 font-sans mb-4 tracking-wide"
                style={{ textShadow: "2px 2px 0 rgba(255,255,255,0.8)" }}
              >
                {genre.title}
              </h3>
              
              {/* Summary - larger */}
              <p className="text-xl md:text-2xl text-gray-700 font-sans text-center mb-4 font-medium leading-relaxed">
                {genre.summary}
              </p>
              
              {/* Details */}
              <ul className="space-y-2 text-base md:text-lg text-gray-600 font-sans">
                {genre.details.slice(0, 2).map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">-</span> {detail}
                  </li>
                ))}
              </ul>

              {/* Theme elements floating around */}
              {genre.themeElements.map((el, i) => (
                <motion.span
                  key={i}
                  className="absolute text-3xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 0.8, 
                    scale: 1,
                    x: Math.cos((i * 2 * Math.PI) / genre.themeElements.length) * 180,
                    y: Math.sin((i * 2 * Math.PI) / genre.themeElements.length) * 130,
                  }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
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
    bookIcon: "\u{1F4D5}", // Red book
    targetIcon: "\u{1F3F0}",
    boxBg: "#FFE082",
    boxBorder: "#FFA000",
    hoverBoxBg: "#FFF3CC",
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
    bookIcon: "\u{1F4D7}", // Green book
    targetIcon: "\u{1F50D}",
    boxBg: "#F8BBD0",
    boxBorder: "#EC407A",
    hoverBoxBg: "#FDDFEB",
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
    bookIcon: "\u{1F4D8}", // Blue book
    targetIcon: "\u{2709}\u{FE0F}",
    boxBg: "#FFF9C4",
    boxBorder: "#FBC02D",
    hoverBoxBg: "#FFFDE7",
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
    bookIcon: "\u{1F4D9}", // Orange book
    targetIcon: "\u{1F3AD}",
    boxBg: "#CE93D8",
    boxBorder: "#8E24AA",
    hoverBoxBg: "#E1BEE7",
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
    bookIcon: "\u{1F4D3}", // Notebook
    targetIcon: "\u{2728}",
    boxBg: "#B3E5FC",
    boxBorder: "#0288D1",
    hoverBoxBg: "#E1F5FE",
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
  
  // Hide scroll hint when near bottom (0.95+)
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.9, 0.95], [1, 1, 0])
  
  // Button glow when at bottom
  const [isAtBottom, setIsAtBottom] = useState(false)
  
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setIsAtBottom(v > 0.92)
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
            background: "linear-gradient(180deg, #1565C0 0%, #1E88E5 15%, #42A5F5 35%, #64B5F6 55%, #90CAF9 75%, #BBDEFB 100%)",
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

      {/* Parallax Pixel Clouds - Animated from the START, avoid hero text area */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - top left corner, MOVING immediately */}
        <motion.div
          className="absolute"
          style={{ top: "2%", y: cloud1Y }}
          initial={{ x: "10vw" }}
          animate={{ x: ["10vw", "85vw", "10vw"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-44 md:w-56 h-auto opacity-90" />
        </motion.div>

        {/* Cloud 2 - top right, MOVING immediately */}
        <motion.div
          className="absolute"
          style={{ top: "4%", y: cloud2Y }}
          initial={{ x: "70vw" }}
          animate={{ x: ["70vw", "5vw", "70vw"] }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-40 md:w-48 h-auto opacity-85" />
        </motion.div>

        {/* Cloud 3 - below tagline (75%+), MOVING immediately */}
        <motion.div
          className="absolute"
          style={{ top: "78%", y: cloud3Y }}
          initial={{ x: "20vw" }}
          animate={{ x: ["20vw", "75vw", "20vw"] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-56 md:w-72 h-auto opacity-95" />
        </motion.div>

        {/* Cloud 4 - below tagline, MOVING immediately */}
        <motion.div
          className="absolute"
          style={{ top: "82%", y: cloud4Y }}
          initial={{ x: "60vw" }}
          animate={{ x: ["60vw", "10vw", "60vw"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-48 md:w-60 h-auto opacity-90" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content, can cover genre boxes and buttons */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute"
          style={{ top: "55%", y: cloud1Y }}
          initial={{ x: "35vw" }}
          animate={{ x: ["35vw", "90vw", "35vw"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-42 md:w-52 h-auto opacity-85" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "65%", y: cloud2Y }}
          initial={{ x: "80vw" }}
          animate={{ x: ["80vw", "5vw", "80vw"] }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-46 md:w-58 h-auto opacity-88" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "90%", y: cloud3Y }}
          initial={{ x: "15vw" }}
          animate={{ x: ["15vw", "70vw", "15vw"] }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-50 md:w-64 h-auto opacity-90" />
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
              <p className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-800 mb-6 font-sans">
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
            className="mt-10 text-center"
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
            className="mt-8 text-2xl md:text-4xl lg:text-5xl font-bold text-gray-600 font-sans italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {t.tagline}
          </motion.p>
        </section>

        {/* Section 2: The 5 Writing Genres - Scroll morph icons, closer to tagline */}
        <section className="py-20 md:py-28 px-6">
          <div className="flex flex-wrap justify-center gap-12 md:gap-16 lg:gap-20 max-w-7xl mx-auto">
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

        {/* Section 3: Bottom Action Buttons - Horizontal, more bottom margin */}
        <section className="py-24 md:py-32 px-6 pb-40">
          <motion.div
            className="flex flex-wrap items-center justify-center gap-10 md:gap-14"
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
              <span className="text-4xl md:text-5xl">&#9992;</span>
            </PixelButton>

            {/* Continue past journey */}
            <PixelButton 
              onClick={handleContinuePastJourneyClick}
              color="#64B5F6"
              borderColor="#1976D2"
              isAtBottom={isAtBottom}
            >
              Continue past journey
              <span className="text-4xl md:text-5xl">&#9198;</span>
            </PixelButton>

            {/* Visit my farm */}
            <PixelButton 
              onClick={handleVisitFarmClick}
              color="#FFB74D"
              borderColor="#F57C00"
              isAtBottom={isAtBottom}
            >
              Visit my farm
              <span className="text-4xl md:text-5xl">&#127968;</span>
            </PixelButton>
          </motion.div>
        </section>
      </div>

      {/* Fixed scroll hint at bottom - hidden when at bottom, BIGGER text */}
      <motion.div
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40"
        style={{ opacity: scrollHintOpacity }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-3 px-10 py-5 rounded-full bg-white/90 backdrop-blur-sm"
          style={{
            border: "5px solid #4A9BE8",
            boxShadow: "0 8px 0 #2E7DD1, 0 10px 20px rgba(0,0,0,0.18)",
            imageRendering: "pixelated",
          }}
        >
          <span className="text-2xl md:text-3xl font-sans font-bold text-gray-700">{t.scrollHint}</span>
          {/* Bouncing arrow */}
          <motion.svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#4A90D9" 
            strokeWidth="3"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </motion.svg>
        </motion.div>
      </motion.div>
    </main>
  )
}
