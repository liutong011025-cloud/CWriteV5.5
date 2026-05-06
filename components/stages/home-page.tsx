"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import type { Language } from "@/app/page"
import { CustomCursor } from "@/components/custom-cursor"
import GlassSurface from "@/components/glass-surface"

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
      {/* Pixel cloud shape */}
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
      {/* Shadow pixels */}
      <rect x="8" y="24" width="8" height="8" fill="rgba(0,0,0,0.1)" />
      <rect x="48" y="24" width="8" height="8" fill="rgba(0,0,0,0.1)" />
    </svg>
  )
}

// Genre card with scroll-linked icon morphing
function GenreCard({
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
  }
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  })

  // Icon morph progress: 0 = book, 1 = target icon
  const morphProgress = useTransform(scrollYProgress, [0, 0.7], [0, 1])
  const bookOpacity = useTransform(morphProgress, [0, 0.5], [1, 0])
  const targetOpacity = useTransform(morphProgress, [0.5, 1], [0, 1])
  const iconScale = useTransform(morphProgress, [0, 0.5, 1], [1, 1.2, 1])
  const iconRotate = useTransform(morphProgress, [0, 1], [0, 360])

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full max-w-lg mx-auto"
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ marginLeft: index % 2 === 0 ? "5%" : "auto", marginRight: index % 2 === 0 ? "auto" : "5%" }}
    >
      <motion.div
        className="relative rounded-3xl p-6 md:p-8 cursor-pointer overflow-hidden"
        style={{ backgroundColor: genre.color }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ height: isHovered ? "auto" : "auto" }}
        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
        transition={{ duration: 0.3 }}
      >
        {/* Icon container */}
        <div className="flex items-center gap-6 mb-4">
          <motion.div
            className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
            style={{ scale: iconScale }}
          >
            {/* Book icon (fades out) */}
            <motion.span
              className="absolute text-5xl md:text-6xl"
              style={{ opacity: bookOpacity, rotate: iconRotate }}
            >
              {genre.bookIcon}
            </motion.span>
            {/* Target icon (fades in) */}
            <motion.span
              className="absolute text-5xl md:text-6xl"
              style={{ opacity: targetOpacity, rotate: iconRotate }}
            >
              {genre.targetIcon}
            </motion.span>
          </motion.div>

          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-sans">{genre.title}</h3>
            <p className="text-gray-700 text-sm md:text-base mt-1 font-sans">{genre.summary}</p>
          </div>
        </div>

        {/* Expandable details on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-900/10">
                <p className="text-gray-800 text-sm md:text-base mb-3 font-sans leading-relaxed">
                  In this genre you will practise:
                </p>
                <ul className="space-y-2">
                  {genre.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm md:text-base font-sans">
                      <span className="text-gray-900 mt-0.5">&#8226;</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    bookIcon: "\u{1F4DA}", // books
    targetIcon: "\u{1F3F0}", // castle
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
    bookIcon: "\u{1F4DA}",
    targetIcon: "\u{1F50D}", // magnifying glass
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
    bookIcon: "\u{1F4DA}",
    targetIcon: "\u{2709}\u{FE0F}", // envelope
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
    bookIcon: "\u{1F4DA}",
    targetIcon: "\u{1F3AD}", // theater masks
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
    bookIcon: "\u{1F4DA}",
    targetIcon: "\u{2728}", // sparkles
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
  },
  zh: {
    welcome: "Welcome to",
    subtitleTop: "Creative Writing",
    subtitleBottom: "in the AI Era",
    tagline: "Unleash Creativity, Empower Expression",
    startButton: "Start a new journey",
    continueButton: "Continue past journey",
  },
}

export default function HomePage({ language = "en", onStartPlan, onContinuePastJourney, onVisitFarm }: HomePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startJourneyAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastStartSoundAtRef = useRef(0)
  const t = translations[language] || translations.en

  const { scrollYProgress } = useScroll({ target: containerRef })

  // Parallax transforms for clouds at different layers
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "150%"])
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const cloud3Y = useTransform(scrollYProgress, [0, 1], ["0%", "200%"])
  const cloud4Y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"])
  const cloud5Y = useTransform(scrollYProgress, [0, 1], ["0%", "180%"])

  // Preload the dedicated Start Journey SFX
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

      {/* Pixel Sky Background - Fixed */}
      <div className="fixed inset-0 z-0">
        {/* Gradient sky */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #E0F7FA 60%, #FFF8E1 100%)",
          }}
        />

        {/* Pixel grid overlay for game feel */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "8px 8px",
          }}
        />
      </div>

      {/* Parallax Pixel Clouds - Background Layer (z-5) */}
      <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
        {/* Cloud 1 - Large, slow horizontal + parallax vertical */}
        <motion.div
          className="absolute"
          style={{ top: "5%", y: cloud1Y }}
          animate={{ x: ["-20%", "120vw"] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <PixelCloud className="w-48 md:w-64 h-auto opacity-90" />
        </motion.div>

        {/* Cloud 2 */}
        <motion.div
          className="absolute"
          style={{ top: "15%", y: cloud2Y }}
          animate={{ x: ["120vw", "-20%"] }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear", delay: 10 }}
        >
          <PixelCloud className="w-40 md:w-56 h-auto opacity-80" />
        </motion.div>

        {/* Cloud 3 */}
        <motion.div
          className="absolute"
          style={{ top: "25%", y: cloud3Y }}
          animate={{ x: ["-15%", "115vw"] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear", delay: 25 }}
        >
          <PixelCloud className="w-32 md:w-48 h-auto opacity-85" />
        </motion.div>

        {/* Cloud 4 */}
        <motion.div
          className="absolute"
          style={{ top: "40%", y: cloud4Y }}
          animate={{ x: ["115vw", "-15%"] }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear", delay: 40 }}
        >
          <PixelCloud className="w-56 md:w-72 h-auto opacity-70" />
        </motion.div>
      </div>

      {/* Foreground Clouds - OVER content (z-30) for occlusion effect */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {/* Foreground cloud 1 - passes OVER content edges */}
        <motion.div
          className="absolute"
          style={{ top: "35%", y: cloud5Y }}
          animate={{ x: ["-25%", "125vw"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: 5 }}
        >
          <PixelCloud className="w-36 md:w-52 h-auto opacity-95" />
        </motion.div>

        {/* Foreground cloud 2 */}
        <motion.div
          className="absolute"
          style={{ top: "55%", y: cloud2Y }}
          animate={{ x: ["125vw", "-25%"] }}
          transition={{ duration: 75, repeat: Infinity, ease: "linear", delay: 20 }}
        >
          <PixelCloud className="w-44 md:w-60 h-auto opacity-90" />
        </motion.div>

        {/* Foreground cloud 3 */}
        <motion.div
          className="absolute"
          style={{ top: "70%", y: cloud1Y }}
          animate={{ x: ["-20%", "120vw"] }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear", delay: 35 }}
        >
          <PixelCloud className="w-40 md:w-56 h-auto opacity-85" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Section 1: Hero (100vh) */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24">
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
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-700 mb-2 font-sans">
                {t.welcome}
              </p>
              <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-tight font-sans bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400 bg-clip-text text-transparent">
                CWrite
              </h1>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-gray-800 font-sans">
              {t.subtitleTop}
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mt-2 font-sans">
              {t.subtitleBottom}
            </p>
          </motion.div>

          <motion.p
            className="mt-6 text-xl md:text-2xl lg:text-3xl text-gray-500 font-sans italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {t.tagline}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <span className="text-sm font-sans">Scroll to explore</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </motion.div>
        </section>

        {/* Section 2: The 5 Writing Genres */}
        <section className="py-20 md:py-32 px-6">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-16 md:mb-24 font-sans"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Writing Journey
          </motion.h2>

          <div className="flex flex-col gap-16 md:gap-24 max-w-4xl mx-auto">
            {genreData.map((genre, index) => (
              <GenreCard key={genre.id} genre={genre} index={index} />
            ))}
          </div>
        </section>

        {/* Section 3: Bottom Action Area */}
        <section className="py-20 md:py-32 px-6">
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <style jsx>{`
              .home-action-btn {
                width: min(440px, 90vw);
              }
              .home-action-inner {
                width: 100%;
                justify-content: center;
              }
            `}</style>

            {/* Start a new journey */}
            <button
              onPointerDown={playStartJourneySound}
              onClick={handleStartJourneyClick}
              className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-transform duration-200 hover:scale-[1.04] active:scale-95 home-action-btn"
            >
              <GlassSurface
                width="auto"
                height="auto"
                borderRadius={50}
                borderWidth={0.08}
                brightness={55}
                opacity={0.85}
                blur={12}
                displace={0.3}
              >
                <span className="flex items-center gap-3 px-9 py-4 text-base font-bold whitespace-nowrap text-white md:px-11 md:py-5 md:text-xl lg:px-16 lg:py-6 lg:text-3xl transition-all duration-200 group-hover:brightness-110 home-action-inner font-sans">
                  {t.startButton}
                  <span className="text-xl md:text-2xl lg:text-4xl">&#9992;</span>
                </span>
              </GlassSurface>
            </button>

            {/* Continue past journey */}
            <button
              onPointerDown={playStartJourneySound}
              onClick={handleContinuePastJourneyClick}
              className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-transform duration-200 hover:scale-[1.04] active:scale-95 home-action-btn"
            >
              <GlassSurface
                width="auto"
                height="auto"
                borderRadius={50}
                borderWidth={0.08}
                brightness={55}
                opacity={0.85}
                blur={12}
                displace={0.3}
              >
                <span className="flex items-center gap-3 px-9 py-4 text-base font-bold whitespace-nowrap text-white md:px-11 md:py-5 md:text-xl lg:px-16 lg:py-6 lg:text-3xl transition-all duration-200 group-hover:brightness-110 home-action-inner font-sans">
                  {t.continueButton}
                  <span className="text-xl md:text-2xl lg:text-4xl">&#9198;</span>
                </span>
              </GlassSurface>
            </button>

            {/* Visit my farm */}
            <button
              onPointerDown={playStartJourneySound}
              onClick={handleVisitFarmClick}
              className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-transform duration-200 hover:scale-[1.04] active:scale-95 home-action-btn"
            >
              <GlassSurface
                width="auto"
                height="auto"
                borderRadius={50}
                borderWidth={0.08}
                brightness={55}
                opacity={0.85}
                blur={12}
                displace={0.3}
              >
                <span className="flex items-center gap-3 px-9 py-4 text-base font-bold whitespace-nowrap text-white md:px-11 md:py-5 md:text-xl lg:px-16 lg:py-6 lg:text-3xl transition-all duration-200 group-hover:brightness-110 home-action-inner font-sans">
                  Visit my farm
                  <span className="text-xl md:text-2xl lg:text-4xl">&#127968;</span>
                </span>
              </GlassSurface>
            </button>
          </motion.div>

          {/* Bottom spacing */}
          <div className="h-32" />
        </section>
      </div>
    </main>
  )
}
