"use client"

import type { FormEvent, ChangeEvent } from "react"
import { useState, useCallback, useEffect, useRef } from "react"

export type CagentMood = "normal" | "like" | "angry"

const IMAGE_MAP: Record<CagentMood, string> = {
  normal: "/Cagentnormal.png",
  like: "/Cagentlike.png",
  angry: "/Cagentangry.png",
}

const SLEEP_IMAGE = "/Cagentsleep.png"
// 延長入睡時間，讓小熊陪伴更久一點
const SLEEP_TIMEOUT_MS = 60000

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
  const [userInput, setUserInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
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

  const fetchGuide = useCallback(
    async (opts?: { userMessage?: string }) => {
      setLoading(true)
      // 每次主動請求新提示前，清空舊內容，避免新頁面先顯示舊進度
      if (!opts?.userMessage) {
        setGuideText(null)
      }
      try {
        const res = await fetch("/api/dify-cagent-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            contextSummary: contextSummary || "",
            user_id: userId,
            userMessage: opts?.userMessage || null,
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
    },
    [stage, contextSummary, userId]
  )

  // Auto-speak when entering a new stage or when values message appears
  useEffect(() => {
    // 切換頁面時立刻清空舊文案與輸入，避免帶出上一頁內容
    setGuideText(null)
    setUserInput("")
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
    if (!valuesMessage && !guideText && !loading) {
      fetchGuide()
    }
  }, [valuesMessage, guideText, loading, fetchGuide, scheduleSleep])

  const handleSendMessage = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault()
      const message = userInput.trim()
      if (!message || isSending) return
      setIsSending(true)
      try {
        await fetchGuide({ userMessage: message })
      } finally {
        setIsSending(false)
      }
    },
    [userInput, isSending, fetchGuide]
  )

  const displayMessage = valuesMessage
    ? `${valuesMessage}${valuesSuggestion ? `\n\nSuggestion: ${valuesSuggestion}` : ""}`
    : guideText

  const avatarSrc = isSleeping ? SLEEP_IMAGE : IMAGE_MAP[mood]

  // 仅在空闲状态自动隐藏，避免对话过程中打断体验
  useEffect(() => {
    if (!showBubble || !displayMessage) return
    if (isSending || isInteracting || userInput.trim().length > 0) return
    const t = setTimeout(() => {
      setShowBubble(false)
    }, 6000)
    return () => clearTimeout(t)
  }, [showBubble, displayMessage, isSending, isInteracting, userInput])

  return (
    <div className="fixed bottom-6 left-6 z-[200] flex items-end gap-3 pointer-events-none">
      <button
        type="button"
        onClick={handleOpen}
        className="group flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110 focus:outline-none pointer-events-auto"
        aria-label="Open Cagent"
      >
        <img
          src={avatarSrc}
          alt="Cagent"
          className="h-24 w-24 object-contain md:h-28 md:w-28"
        />
        <span className="text-xs font-semibold text-purple-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Cagent
        </span>
      </button>

      {showBubble && displayMessage && (
        <div
          className="pointer-events-auto max-w-xs rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 px-4 py-3 shadow-xl"
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
        >
          <div className="flex items-start gap-2 text-sm text-foreground">
            <div className="flex-1">
              <p
                className="whitespace-pre-wrap"
                style={{ fontFamily: '"Comic Neue", var(--font-comic-neue), "Comic Sans MS", cursive' }}
              >
                {displayMessage}
              </p>
              {!valuesMessage && (
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                    onFocus={() => setIsInteracting(true)}
                    onBlur={() => setIsInteracting(false)}
                    placeholder="Talk to Cagent..."
                    className="flex-1 rounded-full border border-purple-200 bg-white/80 px-3 py-1 text-xs focus:outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim() || isSending}
                    className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
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
