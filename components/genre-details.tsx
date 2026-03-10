"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"

interface GenreContent {
  title: string
  tagline: string
  paragraph1: string
  paragraph2: string
  practices: string[]
}

const genreData: Record<string, GenreContent> = {
  story: {
    title: "Story Writing",
    tagline: "Build worlds, invent characters, and shape unforgettable plots.",
    paragraph1:
      "Story writing invites you to create characters with goals, place them in meaningful settings, and let their choices drive a satisfying plot.",
    paragraph2:
      "In CWrite, stories help you practise narrative structure, description, and voice in a playful, low-pressure way.",
    practices: [
      "Designing characters, settings, and conflicts",
      "Organising events into a clear beginning, middle, and end",
      "Using detail to show rather than tell",
    ],
  },
  review: {
    title: "Book Review",
    tagline: "Think deeply, take a stance, and guide readers with your opinion.",
    paragraph1:
      "A book review is more than \"I like it\" or \"I don't like it\" - it explains why with clear reasons and examples.",
    paragraph2:
      "Here you practise argument, evidence, and evaluation, so your opinion can genuinely help other readers.",
    practices: [
      "Stating a clear opinion about a text",
      "Supporting ideas with quotes, scenes, or examples",
      "Balancing summary with analysis",
    ],
  },
  letter: {
    title: "Letter Writing",
    tagline: "Write with a real voice to connect hearts across distance.",
    paragraph1:
      "Letter writing keeps language close to real life: you write to someone specific, for a real purpose and tone.",
    paragraph2: "It is a powerful way to practise audience awareness, clarity, and emotional expression.",
    practices: [
      "Matching tone to your relationship with the reader",
      "Explaining events and feelings clearly",
      "Organising real-life details into a readable flow",
    ],
  },
  drama: {
    title: "Drama Script",
    tagline: "Turn words into scenes, voices, and action on stage.",
    paragraph1: "Drama turns stories into scripts with dialogue, stage directions, and clear scene changes.",
    paragraph2:
      "You learn to write for performance - imagining how words look and sound when actors bring them to life.",
    practices: [
      "Writing believable dialogue",
      "Using stage directions to guide actors",
      "Thinking in scenes, beats, and entrances/exits",
    ],
  },
  poetry: {
    title: "Poetry",
    tagline: "Play with rhythm, images, and silence between the lines.",
    paragraph1: "Poetry uses condensed language, images, and rhythm to say a lot with very few words.",
    paragraph2:
      "It cultivates your sense of sound, metaphor, and line breaks, helping you see how small changes in wording can change the whole feeling.",
    practices: [
      "Choosing precise, image-rich words",
      "Playing with rhythm, repetition, and line breaks",
      "Exploring different poetic forms and voices",
    ],
  },
}

interface GenreDetailsProps {
  activeGenre: string | null
  onBack: () => void
}

export function GenreDetails({ activeGenre, onBack }: GenreDetailsProps) {
  const content = activeGenre ? genreData[activeGenre] : null

  return (
    <AnimatePresence mode="wait">
      {content && (
        <motion.div
          key={activeGenre}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="mx-auto max-w-4xl rounded-3xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-xl md:p-10"
        >
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-sans text-sm">Back</span>
          </button>

          <div className="mb-6">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-foreground/60">Writing Genre Overview</p>
            <h3 className="mb-3 font-sans text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">{content.title}</h3>
            <p className="font-sans text-lg text-foreground/90 md:text-2xl">{content.tagline}</p>
          </div>

          <div className="mb-8 space-y-4">
            <p className="font-sans text-base leading-relaxed text-foreground/80 md:text-lg">{content.paragraph1}</p>
            <p className="font-sans text-base leading-relaxed text-foreground/80 md:text-lg">{content.paragraph2}</p>
          </div>

          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-foreground/60">In this genre you will practise</p>
            <ul className="space-y-3">
              {content.practices.map((practice, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 font-sans text-sm text-foreground/80 md:text-base"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {practice}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
