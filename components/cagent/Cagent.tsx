"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
  const [open, setOpen] = useState(false)
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

  const handleOpen = useCallback(() => {
    setOpen(true)
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
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="group fixed bottom-6 left-6 z-[200] flex flex-col items-center gap-1 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        aria-label="Open Cagent"
      >
        <img
          src={avatarSrc}
          alt="Cagent"
          className="h-14 w-14 rounded-full object-cover shadow-lg md:h-16 md:w-16"
        />
        <span className="text-xs font-semibold text-purple-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Cagent
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <img
                src={IMAGE_MAP["normal"]}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
              Cagent
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[80px] text-sm text-foreground">
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
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
