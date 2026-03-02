"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

export type CagentMood = "normal" | "like" | "angry"

const IMAGE_MAP: Record<CagentMood, string> = {
  normal: "/Cagentnormal.png",
  like: "/Cagentlike.png",
  angry: "/Cagentangry.png",
}

const SLEEP_IMAGE = "/Cagentsleep.png"
const SLEEP_TIMEOUT_MS = 30000

export interface CagentProps {
  /** Current page/stage identifier for Dify context */
  stage: string
  /** Serializable context summary for this page (for guide API) */
  contextSummary?: string
  /** User id for API */
  userId?: string
  /** Mood: normal / like (content good) / angry (values violation) */
  mood: CagentMood
  /** When values check fails, show this message in dialog if open */
  valuesMessage?: string | null
  /** Optional suggestion when values violation */
  valuesSuggestion?: string | null
  /** Callback when guide response is needed (e.g. parent fetches and passes content) */
  onOpenDialog?: () => void
}

export default function Cagent({
  stage,
  contextSummary = "",
  userId,
  mood,
  valuesMessage,
  valuesSuggestion,
}: CagentProps) {
  const [showBubble, setShowBubble] = useState(false)
  const [guideText, setGuideText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSleep = useCallback(() => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current)
    }
    sleepTimeoutRef.current = setTimeout(() => {
      setIsSleeping(true)
    }, SLEEP_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    scheduleSleep()
    return () => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current)
      }
    }
  }, [scheduleSleep])

  const fetchGuide = useCallback(async () => {
    setLoading(true)
    setGuideText(null)
    try {
      const res = await fetch("/api/dify-cagent-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          contextSummary: contextSummary || "",
          user_id: userId,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setGuideText("Oops, Cagent is resting. Try again in a bit! 🧸")
        return
      }
      setGuideText(data.message || data.answer || "Keep going! You're doing great! ✨")
    } catch {
      setGuideText("Something went wrong. Try again! 🌟")
    } finally {
      setLoading(false)
    }
  }, [stage, contextSummary, userId])

  // Auto-speak when entering a new stage or when values message appears
  useEffect(() => {
    setIsSleeping(false)
    setShowBubble(true)
    scheduleSleep()
    if (!valuesMessage) {
      fetchGuide()
    }
  }, [stage, contextSummary, valuesMessage, fetchGuide, scheduleSleep])

  const handleOpen = useCallback(() => {
    setShowBubble(true)
    setIsSleeping(false)
    scheduleSleep()
    if (!valuesMessage) {
      fetchGuide()
    }
  }, [valuesMessage, fetchGuide, scheduleSleep])

  const displayMessage = valuesMessage
    ? `${valuesMessage}${valuesSuggestion ? `\n\nSuggestion: ${valuesSuggestion}` : ""}`
    : guideText

  const avatarSrc = isSleeping ? SLEEP_IMAGE : IMAGE_MAP[mood]

  return (
    <div className="fixed bottom-6 left-6 z-[200] flex items-end gap-3 pointer-events-none">
      <button
        type="button"
        onClick={handleOpen}
        className="group flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 pointer-events-auto"
        aria-label="Open Cagent"
      >
        <img
          src={avatarSrc}
          alt="Cagent"
          className="h-20 w-20 object-contain shadow-lg md:h-24 md:w-24"
        />
        <span className="text-xs font-semibold text-purple-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Cagent
        </span>
      </button>

      {showBubble && (
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 px-4 py-3 shadow-xl">
          <div className="flex items-start gap-2">
            <img
              src={IMAGE_MAP["normal"]}
              alt=""
              className="mt-0.5 h-8 w-8 object-contain"
            />
            <div className="flex-1 text-sm text-foreground">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cagent is thinking...
                </div>
              ) : displayMessage ? (
                <p className="whitespace-pre-wrap">{displayMessage}</p>
              ) : (
                <p className="text-muted-foreground">Ask Cagent anything about this page!</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowBubble(false)}
              className="ml-1 text-xs text-purple-500 hover:text-purple-700"
              aria-label="Close Cagent message"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
