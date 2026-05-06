"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useCallback } from "react"
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

// Pixel button component with ANIMATED glow effect
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
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.98, y: 0 }}
      animate={isAtBottom ? {
        boxShadow: isHovered
          ? [
              `0 0 40px 15px ${color}, 0 0 80px 30px ${color}90`,
              `0 0 70px 25px ${color}, 0 0 120px 45px ${color}99`,
              `0 0 40px 15px ${color}, 0 0 80px 30px ${color}90`,
            ]
          : [
              `0 0 25px 8px ${color}80, 0 0 50px 18px ${color}60`,
              `0 0 40px 14px ${color}90, 0 0 70px 28px ${color}70`,
              `0 0 25px 8px ${color}80, 0 0 50px 18px ${color}60`,
            ],
      } : undefined}
      transition={isAtBottom ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${borderColor} 100%)`,
        border: `4px solid ${borderColor}`,
        boxShadow: isAtBottom 
          ? undefined
          : `
            inset -4px -4px 0 rgba(0,0,0,0.25), 
            inset 4px 4px 0 rgba(255,255,255,0.35), 
            0 8px 0 ${borderColor},
            0 10px 16px rgba(0,0,0,0.2)
          `,
        padding: "16px 32px",
        imageRendering: "pixelated",
      }}
    >
      <span 
        className="flex items-center gap-3 text-lg md:text-xl lg:text-2xl font-bold text-white whitespace-nowrap font-sans"
        style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
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
  onHoverStart,
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
  onHoverStart?: (id: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isHovered = hoveredId === genre.id
  const isAnyHovered = hoveredId !== null
  const shouldMoveAway = isAnyHovered && !isHovered

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  })

  // Morph progress: 0 = just emoji, 1 = full box - earlier transformation
  const morphProgress = useTransform(scrollYProgress, [0.15, 0.65], [0, 1])
  
  // Icon crossfade - earlier timing
  const bookOpacity = useTransform(morphProgress, [0, 0.3, 0.5], [1, 1, 0])
  const bookScale = useTransform(morphProgress, [0.3, 0.5], [1, 0.5])
  const bookRotate = useTransform(morphProgress, [0.3, 0.5], [0, -20])
  
  const targetOpacity = useTransform(morphProgress, [0.4, 0.7], [0, 1])
  const targetScale = useTransform(morphProgress, [0.4, 0.6, 0.75], [0.4, 1.2, 1])
  
  // Box expansion - earlier timing
  const boxOpacity = useTransform(morphProgress, [0.5, 0.75], [0, 1])
  const boxScale = useTransform(morphProgress, [0.5, 0.9], [0.1, 1])
  
  // Title appears earlier
  const titleOpacity = useTransform(morphProgress, [0.65, 0.9], [0, 1])

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
        x: shouldMoveAway ? (index < 2 ? -30 : index > 2 ? 30 : 0) : 0,
        opacity: shouldMoveAway ? 0.6 : 1,
      }}
    >
      {/* Container for icon + box */}
      <div 
        className="relative flex flex-col items-center justify-center cursor-pointer"
        onMouseEnter={() => {
          onHoverStart?.(genre.id)
          setHoveredId(genre.id)
        }}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* The pixel box - expands from nothing, WIDER */}
        <motion.div
          className="absolute flex items-center justify-center rounded-lg"
          style={{ 
            opacity: boxOpacity,
            scale: boxScale,
            width: 340,
            height: 200,
            backgroundColor: genre.boxBg,
            border: `5px solid ${genre.boxBorder}`,
            boxShadow: `
              inset -5px -5px 0 rgba(0,0,0,0.2), 
              inset 5px 5px 0 rgba(255,255,255,0.35),
              0 10px 0 ${genre.boxBorder},
              0 14px 28px rgba(0,0,0,0.18)
            `,
            imageRendering: "pixelated",
          }}
        />

        {/* Icon container - WIDER, emoji and text side by side */}
        <div className="relative w-[340px] h-[200px] flex items-center justify-center z-10">
          {/* Book icon (fades out) - Different book for each genre */}
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
          
          {/* Target icon (fades in) - positioned left */}
          <motion.div
            className="absolute flex items-center gap-4 px-6"
            style={{ 
              opacity: targetOpacity, 
            }}
          >
            <motion.span
              className="text-6xl md:text-7xl lg:text-8xl"
              style={{ scale: targetScale }}
            >
              {genre.targetIcon}
            </motion.span>
            
            {/* Title next to icon - cute font style */}
            <motion.span 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 font-sans tracking-wide"
              style={{ 
                opacity: titleOpacity,
                textShadow: "2px 2px 0 rgba(255,255,255,0.8)",
                letterSpacing: "0.03em",
              }}
            >
              {genre.title}
            </motion.span>
          </motion.div>
        </div>

        {/* Hover details - INSIDE the box, LIGHTER background, text fits */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute z-20 flex flex-col items-center justify-start p-5 rounded-lg overflow-hidden"
              style={{
                width: 380,
                minHeight: 240,
                backgroundColor: genre.hoverBoxBg,
                border: `5px solid ${genre.boxBorder}`,
                boxShadow: `
                  inset -5px -5px 0 rgba(0,0,0,0.12), 
                  inset 5px 5px 0 rgba(255,255,255,0.5),
                  0 10px 0 ${genre.boxBorder},
                  0 16px 32px rgba(0,0,0,0.22)
                `,
                imageRendering: "pixelated",
              }}
            >
              {/* Icon + Title row */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl md:text-5xl">{genre.targetIcon}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 font-sans tracking-wide"
                  style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.8)" }}
                >
                  {genre.title}
                </h3>
              </div>
              
              {/* Summary - fits in box */}
              <p className="text-base md:text-lg text-gray-700 font-sans text-center mb-3 font-medium leading-snug px-2">
                {genre.summary}
              </p>
              
              {/* Details - smaller */}
              <ul className="space-y-1 text-sm md:text-base text-gray-600 font-sans px-2">
                {genre.details.slice(0, 2).map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">-</span> 
                    <span className="line-clamp-1">{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Theme elements floating around */}
              {genre.themeElements.map((el, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 0.7, 
                    scale: 1,
                    x: Math.cos((i * 2 * Math.PI) / genre.themeElements.length) * 130,
                    y: Math.sin((i * 2 * Math.PI) / genre.themeElements.length) * 90,
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
    hoverBoxBg: "#FFF8E1",
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
    hoverBoxBg: "#FCE4EC",
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
    hoverBoxBg: "#F3E5F5",
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
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const genreHoverAudioRef = useRef<HTMLAudioElement | null>(null)
  const easterEggAudioRef = useRef<HTMLAudioElement | null>(null)
  const speakerTapHistoryRef = useRef<number[]>([])
  const lastStartSoundAtRef = useRef(0)
  const lastGenreHoverSoundAtRef = useRef(0)
  const t = translations[language] || translations.en
  const [hoveredGenreId, setHoveredGenreId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  // Scroll hint visibility - hide if scrolled, show after 5s idle
  const [hasScrolled, setHasScrolled] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const scrollIdleTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { scrollYProgress } = useScroll({ target: containerRef })
  
  // Button glow when at bottom
  const [isAtBottom, setIsAtBottom] = useState(false)
  
  const handleScroll = useCallback(() => {
    setHasScrolled(true)
    setShowScrollHint(false)
    
    // Clear existing timer
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current)
    }
    
    // Set new timer to show hint after 5s idle
    scrollIdleTimerRef.current = setTimeout(() => {
      setShowScrollHint(true)
    }, 5000)
  }, [])
  
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setIsAtBottom(v > 0.92)
      if (v > 0.01) {
        handleScroll()
      }
    })
  }, [scrollYProgress, handleScroll])

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

  useEffect(() => {
    try {
      const savedMutePreference = window.localStorage.getItem("cwrite-home-muted")
      if (savedMutePreference === "true") {
        setIsMuted(true)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      const easterEggAudio = new Audio("/grand_theft_auto.mp3")
      easterEggAudio.preload = "auto"
      easterEggAudio.volume = 0.4
      easterEggAudio.load?.()
      easterEggAudioRef.current = easterEggAudio
    } catch {
      // ignore
    }

    return () => {
      if (easterEggAudioRef.current) {
        easterEggAudioRef.current.pause()
        easterEggAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    try {
      const hoverAudio = new Audio("/soundreality-finger-snap-179180.mp3")
      hoverAudio.preload = "auto"
      hoverAudio.volume = 0.45
      hoverAudio.load?.()
      genreHoverAudioRef.current = hoverAudio
    } catch {
      // ignore
    }

    return () => {
      if (genreHoverAudioRef.current) {
        genreHoverAudioRef.current.pause()
        genreHoverAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let isUnmounted = false

    const backgroundAudio = new Audio("/yoshiyuki_tatsuya-pixel-hearts-foreverwav-427383.mp3")
    backgroundAudio.preload = "auto"
    backgroundAudio.loop = true
    backgroundAudio.volume = 0.3
    backgroundAudio.muted = isMuted
    backgroundAudio.load?.()
    backgroundMusicRef.current = backgroundAudio

    const tryPlayBackgroundMusic = async () => {
      if (isUnmounted || isMuted) return
      try {
        await backgroundAudio.play()
      } catch {
        // Some browsers require a user gesture before audio playback.
      }
    }

    const resumeAfterInteraction = () => {
      void tryPlayBackgroundMusic()
    }

    void tryPlayBackgroundMusic()

    window.addEventListener("pointerdown", resumeAfterInteraction, { once: true })
    window.addEventListener("keydown", resumeAfterInteraction, { once: true })
    window.addEventListener("touchstart", resumeAfterInteraction, { once: true })

    return () => {
      isUnmounted = true
      window.removeEventListener("pointerdown", resumeAfterInteraction)
      window.removeEventListener("keydown", resumeAfterInteraction)
      window.removeEventListener("touchstart", resumeAfterInteraction)
      backgroundAudio.pause()
      backgroundAudio.currentTime = 0
      if (backgroundMusicRef.current === backgroundAudio) {
        backgroundMusicRef.current = null
      }
    }
  }, [isMuted])

  useEffect(() => {
    const allAudio = [
      startJourneyAudioRef.current,
      backgroundMusicRef.current,
      genreHoverAudioRef.current,
      easterEggAudioRef.current,
    ]

    allAudio.forEach((audio) => {
      if (!audio) return
      audio.muted = isMuted
    })

    try {
      window.localStorage.setItem("cwrite-home-muted", String(isMuted))
    } catch {
      // ignore
    }

    if (isMuted) {
      backgroundMusicRef.current?.pause()
      return
    }

    void backgroundMusicRef.current?.play().catch(() => {
      // ignore autoplay restrictions until the next user gesture
    })
  }, [isMuted])

  const playStartJourneySound = () => {
    if (isMuted) return
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

  const playGenreHoverSound = (genreId: string) => {
    if (isMuted) return
    if (hoveredGenreId === genreId) return

    const now = Date.now()
    if (now - lastGenreHoverSoundAtRef.current < 120) return
    lastGenreHoverSoundAtRef.current = now

    try {
      if (!genreHoverAudioRef.current) return
      genreHoverAudioRef.current.currentTime = 0
      void genreHoverAudioRef.current.play()
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

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev
      const now = Date.now()
      const recentTaps = [...speakerTapHistoryRef.current, now].filter((timestamp) => now - timestamp < 2200)
      speakerTapHistoryRef.current = recentTaps

      if (recentTaps.length >= 5 && !nextMuted) {
        speakerTapHistoryRef.current = []
        try {
          if (easterEggAudioRef.current) {
            easterEggAudioRef.current.currentTime = 0
            void easterEggAudioRef.current.play()
          }
        } catch {
          // ignore
        }
      }

      return nextMuted
    })
  }

  return (
    <main ref={containerRef} className="relative w-full overflow-x-hidden cursor-none">
      <CustomCursor />

      {/* Pixel Sky Background - Fixed, deeper blue */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0D47A1 0%, #1565C0 15%, #1E88E5 35%, #42A5F5 55%, #64B5F6 75%, #90CAF9 100%)",
          }}
        />
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "4px 4px",
          }}
        />
      </div>

      {/* Background Clouds - Behind hero text, z-[5] */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - top left corner */}
        <motion.div
          className="absolute"
          style={{ top: "3%", y: cloud1Y }}
          initial={{ x: "15vw" }}
          animate={{ x: ["15vw", "80vw", "15vw"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-40 md:w-52 h-auto opacity-85" />
        </motion.div>

        {/* Cloud 2 - top right */}
        <motion.div
          className="absolute"
          style={{ top: "6%", y: cloud2Y }}
          initial={{ x: "65vw" }}
          animate={{ x: ["65vw", "10vw", "65vw"] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-36 md:w-44 h-auto opacity-80" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content (genre boxes & buttons), z-30 */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute"
          style={{ top: "55%", y: cloud3Y }}
          initial={{ x: "25vw" }}
          animate={{ x: ["25vw", "85vw", "25vw"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-44 md:w-56 h-auto opacity-88" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "68%", y: cloud4Y }}
          initial={{ x: "70vw" }}
          animate={{ x: ["70vw", "5vw", "70vw"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-40 md:w-50 h-auto opacity-85" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "82%", y: cloud1Y }}
          initial={{ x: "40vw" }}
          animate={{ x: ["40vw", "90vw", "40vw"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-48 md:w-60 h-auto opacity-90" />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ top: "92%", y: cloud2Y }}
          initial={{ x: "8vw" }}
          animate={{ x: ["8vw", "60vw", "8vw"] }}
          transition={{ duration: 33, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-42 md:w-54 h-auto opacity-82" />
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
              <p
                className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 font-sans"
                style={{
                  background: "linear-gradient(135deg, #FFE45E 0%, #B7F36B 55%, #4CAF50 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: '"Berlin Sans FB Demi", "Berlin Sans FB", var(--font-baloo), sans-serif',
                  textShadow: "0 4px 14px rgba(255, 228, 94, 0.2)",
                }}
              >
                {t.welcome}
              </p>
              
              {/* CWrite */}
              <motion.h1 
                className="relative inline-block text-[7rem] md:text-[10rem] lg:text-[16rem] font-semibold leading-none tracking-tight font-sans"
                style={{
                  fontFamily: '"Berlin Sans FB Demi", "Berlin Sans FB", var(--font-baloo), sans-serif',
                  letterSpacing: "-0.03em",
                  filter: "drop-shadow(0 18px 20px rgba(109, 43, 92, 0.32))",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 select-none"
                  style={{
                    color: "#D34E83",
                    transform: "translateY(14px)",
                    filter: "blur(0.35px)",
                    opacity: 0.94,
                  }}
                >
                  CWrite
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 select-none"
                  style={{
                    background: "linear-gradient(180deg, #FFE85C 0%, #FFD93D 30%, #FFB25F 58%, #FF79AD 82%, #FF5F98 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    transform: "translateY(6px)",
                    opacity: 0.98,
                  }}
                >
                  CWrite
                </span>
                <span
                  className="relative block"
                  style={{
                    background: "linear-gradient(180deg, #FFF1A8 0%, #FFE45E 18%, #FFD93D 38%, #FFB85F 62%, #FF8CBB 82%, #FF679E 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    WebkitTextStroke: "0.5px rgba(255,255,255,0.32)",
                    textShadow: `
                      0 1px 0 rgba(255,244,190,0.78),
                      0 3px 0 rgba(255,221,92,0.9),
                      0 6px 0 rgba(255,123,175,0.92),
                      0 12px 18px rgba(128,44,78,0.24)
                    `,
                  }}
                >
                  CWrite
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-[7%] select-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,248,205,0.72) 0%, rgba(255,245,188,0.42) 26%, rgba(255,255,255,0.08) 56%, rgba(255,255,255,0) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    opacity: 0.82,
                    transform: "scaleX(0.99)",
                  }}
                >
                  CWrite
                </span>
              </motion.h1>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p
              className="text-3xl md:text-5xl lg:text-6xl font-bold font-sans"
              style={{
                background: "linear-gradient(135deg, #FFF59D 0%, #E6FF78 34%, #9BEA69 70%, #5BCB63 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: '"Berlin Sans FB Demi", "Berlin Sans FB", var(--font-baloo), sans-serif',
                textShadow: "0 3px 0 rgba(19, 88, 153, 0.18), 0 8px 16px rgba(7, 42, 92, 0.24)",
              }}
            >
              {t.subtitleTop}
            </p>
            <p
              className="text-2xl md:text-4xl lg:text-5xl font-bold mt-4 font-sans"
              style={{
                background: "linear-gradient(135deg, #FFF59D 0%, #E6FF78 34%, #9BEA69 70%, #5BCB63 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: '"Berlin Sans FB Demi", "Berlin Sans FB", var(--font-baloo), sans-serif',
                textShadow: "0 3px 0 rgba(19, 88, 153, 0.18), 0 8px 16px rgba(7, 42, 92, 0.24)",
              }}
            >
              {t.subtitleBottom}
            </p>
          </motion.div>

          <motion.p
            className="mt-8 text-2xl md:text-4xl lg:text-5xl font-bold italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1, delay: 1.2 }}
            style={{
              color: "#FFE45E",
              fontFamily: "var(--font-caveat), var(--font-patrick-hand), cursive",
              textShadow: "0 3px 0 rgba(145, 98, 0, 0.55), 0 0 18px rgba(255, 228, 94, 0.45)",
              letterSpacing: "0.03em",
            }}
          >
            {t.tagline}
          </motion.p>
        </section>

        {/* Section 2: The 5 Writing Genres - closer to tagline, 3 on first row, 2 on second */}
        <section className="py-12 md:py-16 px-6">
          <div className="max-w-6xl mx-auto">
            {/* First row - 3 items */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-10">
              {genreData.slice(0, 3).map((genre, index) => (
                <ScrollMorphIcon 
                  key={genre.id} 
                  genre={genre} 
                  index={index}
                  hoveredId={hoveredGenreId}
                  setHoveredId={setHoveredGenreId}
                  onHoverStart={playGenreHoverSound}
                />
              ))}
            </div>
            {/* Second row - 2 items */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12">
              {genreData.slice(3, 5).map((genre, index) => (
                <ScrollMorphIcon 
                  key={genre.id} 
                  genre={genre} 
                  index={index + 3}
                  hoveredId={hoveredGenreId}
                  setHoveredId={setHoveredGenreId}
                  onHoverStart={playGenreHoverSound}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Bottom Action Buttons - Horizontal, smaller, more distance to footer */}
        <section className="py-20 md:py-28 px-6 pb-48 md:pb-56">
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
              isAtBottom={isAtBottom}
            >
              Start a new journey
              <span className="text-2xl md:text-3xl lg:text-4xl">&#9992;</span>
            </PixelButton>

            {/* Continue past journey */}
            <PixelButton 
              onClick={handleContinuePastJourneyClick}
              color="#64B5F6"
              borderColor="#1976D2"
              isAtBottom={isAtBottom}
            >
              Continue past journey
              <span className="text-2xl md:text-3xl lg:text-4xl">&#9198;</span>
            </PixelButton>

            {/* Visit my farm */}
            <PixelButton 
              onClick={handleVisitFarmClick}
              color="#FFB74D"
              borderColor="#F57C00"
              isAtBottom={isAtBottom}
            >
              Visit my farm
              <span className="text-2xl md:text-3xl lg:text-4xl">&#127968;</span>
            </PixelButton>
          </motion.div>
        </section>
      </div>

      {/* Fixed scroll hint at bottom - hide when at bottom or after scroll, show after 5s idle */}
      <AnimatePresence>
        {showScrollHint && !isAtBottom && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-sm"
              style={{
                border: "4px solid #4A9BE8",
                boxShadow: "0 6px 0 #2E7DD1, 0 8px 16px rgba(0,0,0,0.15)",
                imageRendering: "pixelated",
              }}
            >
              <span className="text-base md:text-lg font-sans font-bold text-gray-700">{t.scrollHint}</span>
              {/* Bouncing arrow - hidden at bottom */}
              <motion.svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#4A90D9" 
                strokeWidth="3"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </motion.svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggleMute}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-white/90 p-4 shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-white"
        style={{
          border: "4px solid #4A9BE8",
          boxShadow: "0 6px 0 #2E7DD1, 0 10px 22px rgba(0,0,0,0.18)",
          imageRendering: "pixelated",
        }}
        aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
        title={isMuted ? "Turn sound on" : "Turn sound off"}
      >
        <Image
          src={isMuted ? "/speakeroff.png" : "/speaker on.png"}
          alt={isMuted ? "Sound off" : "Sound on"}
          width={44}
          height={44}
          priority
          className="pointer-events-none select-none"
        />
      </button>
    </main>
  )
}
