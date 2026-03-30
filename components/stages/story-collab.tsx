"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Lightbulb, Send, Plus, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"

import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentLevel } from "@/lib/current-level"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────── */

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"
type StoryMode = "ai" | "manual"
type PlotState = NonNullable<StoryState["plot"]>
type StructureState = NonNullable<StoryState["structure"]>
type StructureType = StructureState["type"]

interface StoryCollabProps {
  language: Language
  storyState: StoryState
  mode: StoryMode
  onPlotCreate: (plot: PlotState) => void
  onStructureSelect: (structure: StructureState) => void
  onStoryWrite: (story: string) => void
  onBack: () => void
  userId?: string
  onDraftChange?: (text: string) => void
}

interface CollabMessage {
  id: string
  role: "assistant" | "user"
  content: string
  suggestions?: string[]
  storySnippet?: string | null
  structureCards?: boolean
}

interface CollabApiResponse {
  answer: string
  phase: CollabPhase
  suggestions: string[]
  story_snippet: string | null
  plot_update: { setting?: string; conflict?: string; goal?: string } | null
  structure_suggestion: string | null
  error?: string
  message?: string
}

/* ── Constants ───────────────────────────────────────── */

const STRUCTURES: Array<{
  type: StructureType
  name: string
  desc: string
  outline: string[]
}> = [
  {
    type: "freytag",
    name: "Freytag's Pyramid",
    desc: "A five-part arc with exposition, rising action, climax, falling action, and resolution.",
    outline: ["Exposition", "Rising Action", "Climax", "Falling Action", "Resolution"],
  },
  {
    type: "threeAct",
    name: "Three Act Structure",
    desc: "A simple setup, confrontation, and resolution flow.",
    outline: ["Setup", "Confrontation", "Resolution"],
  },
  {
    type: "fichtean",
    name: "Fichtean Curve",
    desc: "Several small crises build tension before the final climax.",
    outline: ["First Crisis", "Second Crisis", "Third Crisis", "Climax", "Resolution"],
  },
]

const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishText = text.replace(/[\u4e00-\u9fff]/g, " ").trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(Boolean).length : 0
  return chineseChars + englishWords
}

const cleanAiDisplayText = (text: string) =>
  text
    .replace(/The plot is getting clearer![\s\S]*?talk about\?/gi, "")
    .replace(/故事情节已经比较清晰了[，,]?\s*还想再聊些什么吗[？?]?/g, "")
    .replace(/Great choice!?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()

/* ── Component ───────────────────────────────────────── */

export default function StoryCollab({
  language,
  storyState,
  mode,
  onPlotCreate,
  onStructureSelect,
  onStoryWrite,
  onBack,
  userId,
  onDraftChange,
}: StoryCollabProps) {
  /* ── State ── */
  const [phase, setPhase] = useState<CollabPhase>("explore")
  const [messages, setMessages] = useState<CollabMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])

  // Plot data
  const [plotData, setPlotData] = useState<{ setting: string; conflict: string; goal: string }>({
    setting: storyState.plot?.setting || "",
    conflict: storyState.plot?.conflict || "",
    goal: storyState.plot?.goal || "",
  })

  // Structure
  const [selectedStructure, setSelectedStructure] = useState<StructureType | null>(
    storyState.structure?.type || null,
  )

  // Story blocks (right side editor)
  const [storyBlocks, setStoryBlocks] = useState<Array<{ sectionName: string; text: string }>>(() => {
    if (storyState.structure) {
      const struct = STRUCTURES.find((s) => s.type === storyState.structure?.type) || STRUCTURES[0]
      return struct.outline.map((name) => ({ sectionName: name, text: "" }))
    }
    return []
  })

  // Manual mode plot inputs
  const [manualPlotDone, setManualPlotDone] = useState(!!storyState.plot)

  // Writing phase: tracks which section the user is currently writing
  const [currentWritingSection, setCurrentWritingSection] = useState(0)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  /* ── Derived ── */
  const totalWords = useMemo(
    () => storyBlocks.reduce((sum, b) => sum + countWords(b.text), 0),
    [storyBlocks],
  )

  const plotComplete = !!(plotData.setting && plotData.conflict && plotData.goal)

  const composedStory = useMemo(
    () =>
      storyBlocks
        .map((b) => `${b.sectionName}:\n${b.text.trim()}`.trimEnd())
        .join("\n\n")
        .trim(),
    [storyBlocks],
  )

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  /* ── Notify parent of draft changes ── */
  useEffect(() => {
    if (composedStory && onDraftChange) {
      onDraftChange(composedStory)
    }
  }, [composedStory, onDraftChange])

  /* ── Send welcome message on mount (AI mode) ── */
  useEffect(() => {
    if (mode === "ai" && messages.length === 0) {
      const charName = storyState.character?.name || "your character"
      const welcome: CollabMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hi there! I'm so excited to write a story with you and ${charName}! 🎉\n\nWhat kind of adventure should we go on? Something magical, mysterious, funny, or action-packed?`,
        suggestions: ["Adventure", "Magic", "Mystery", "Funny"],
      }
      setMessages([welcome])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── API call ── */
  const sendMessage = useCallback(
    async (text: string, action?: "help_me" | "chat") => {
      if (isLoading) return
      setIsLoading(true)

      const userMsg: CollabMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      }
      setMessages((prev) => [...prev, userMsg])
      setChatInput("")

      const newHistory = [...conversationHistory, { role: "user", content: text }]

      try {
        const res = await fetch("/api/story-collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversation_history: newHistory.slice(-20),
            character: storyState.character,
            plot_state: plotData,
            structure_type: selectedStructure,
            story_blocks: storyBlocks.map((b) => ({ section: b.sectionName, text: b.text })),
            current_phase: phase,
            user_id: userId || "anonymous",
            level: getCurrentLevel(),
            action: action || "chat",
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Network error" }))
          throw new Error(err.message || `Server error ${res.status}`)
        }

        const data = (await res.json()) as CollabApiResponse

        // Update phase
        if (data.phase) setPhase(data.phase)

        // Handle plot_update
        if (data.plot_update) {
          setPlotData((prev) => {
            const next = { ...prev }
            if (data.plot_update!.setting) next.setting = data.plot_update!.setting
            if (data.plot_update!.conflict) next.conflict = data.plot_update!.conflict
            if (data.plot_update!.goal) next.goal = data.plot_update!.goal
            return next
          })
        }

        // Handle structure_suggestion
        if (data.structure_suggestion) {
          const matchType = data.structure_suggestion.toLowerCase()
          if (matchType.includes("freytag")) handleStructureSelect("freytag")
          else if (matchType.includes("three")) handleStructureSelect("threeAct")
          else if (matchType.includes("fichtean")) handleStructureSelect("fichtean")
        }

        // Build assistant message
        const cleaned = cleanAiDisplayText(data.answer)
        const showStructureCards = data.phase === "structure" && !selectedStructure

        const aiMsg: CollabMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: cleaned,
          suggestions: data.suggestions,
          storySnippet: data.story_snippet,
          structureCards: showStructureCards,
        }
        setMessages((prev) => [...prev, aiMsg])

        // Update conversation history
        setConversationHistory([
          ...newHistory,
          { role: "assistant", content: data.answer },
        ])
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Something went wrong"
        toast.error(errMsg)
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Oops, I had a little hiccup! Could you try saying that again? 😊",
            suggestions: ["Try again", "Help me"],
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, conversationHistory, storyState.character, plotData, selectedStructure, storyBlocks, phase, userId],
  )

  /* ── Handlers ── */

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim()
    if (!text || isLoading) return
    // In writing phase, auto-save the user's text to the current section
    if (storyBlocks.length > 0 && currentWritingSection < storyBlocks.length) {
      setStoryBlocks((prev) => {
        const next = [...prev]
        const existing = next[currentWritingSection].text.trim()
        next[currentWritingSection] = {
          ...next[currentWritingSection],
          text: existing ? `${existing} ${text}` : text,
        }
        return next
      })
    }
    void sendMessage(text)
  }, [chatInput, isLoading, sendMessage, storyBlocks, currentWritingSection])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isLoading) return
      void sendMessage(suggestion)
    },
    [isLoading, sendMessage],
  )

  const handleHelpMe = useCallback(() => {
    if (isLoading) return
    void sendMessage("Help me write!", "help_me")
  }, [isLoading, sendMessage])

  const handleAddToStory = useCallback(
    (snippet: string) => {
      if (!storyBlocks.length) {
        toast.error("Choose a story structure first!")
        return
      }
      // Target the current writing section (or last section if all done)
      const idx = Math.min(currentWritingSection, storyBlocks.length - 1)
      setStoryBlocks((prev) => {
        const next = [...prev]
        const existing = next[idx].text.trim()
        next[idx] = {
          ...next[idx],
          text: existing ? `${existing} ${snippet}` : snippet,
        }
        return next
      })
      toast.success(`Added to ${storyBlocks[idx].sectionName}!`)
    },
    [storyBlocks, currentWritingSection],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleStructureSelect = useCallback(
    (type: StructureType) => {
      if (selectedStructure) return
      setSelectedStructure(type)
      const struct = STRUCTURES.find((s) => s.type === type) || STRUCTURES[0]
      const blocks = struct.outline.map((name) => ({ sectionName: name, text: "" }))
      setStoryBlocks(blocks)
      onStructureSelect({ type, outline: struct.outline })
    },
    [selectedStructure, onStructureSelect],
  )

  const handleStoryBlockChange = useCallback(
    (index: number, text: string) => {
      setStoryBlocks((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], text }
        return next
      })
    },
    [],
  )

  const handleFinishStory = useCallback(() => {
    if (totalWords < 20) {
      toast("Your story is quite short! Are you sure you want to finish?", {
        action: {
          label: "Yes, finish!",
          onClick: () => onStoryWrite(composedStory),
        },
      })
      return
    }
    onStoryWrite(composedStory)
  }, [totalWords, composedStory, onStoryWrite])

  /* ── Plot auto-callback ── */
  useEffect(() => {
    if (plotComplete && plotData.setting && plotData.conflict && plotData.goal) {
      onPlotCreate({ setting: plotData.setting, conflict: plotData.conflict, goal: plotData.goal })
    }
  }, [plotComplete, plotData, onPlotCreate])

  /* ── Manual mode: confirm plot ── */
  const handleManualPlotConfirm = useCallback(() => {
    if (!plotData.setting || !plotData.conflict || !plotData.goal) {
      toast.error("Please fill in all three plot fields.")
      return
    }
    setManualPlotDone(true)
    onPlotCreate({ setting: plotData.setting, conflict: plotData.conflict, goal: plotData.goal })
  }, [plotData, onPlotCreate])

  /* ── Render ── */

  const structureForDisplay = selectedStructure
    ? STRUCTURES.find((s) => s.type === selectedStructure)
    : null

  return (
    <div
      className="min-h-screen py-8 px-6 bg-gradient-to-br from-sky-100 via-cyan-50 via-purple-50 to-orange-50 relative"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader
          stage={2}
          title="Write Your Story"
          onBack={onBack}
          character={storyState.character?.name || undefined}
        />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          {/* ──── Left: Chat Panel ──── */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border-4 border-white/60 bg-white/85 backdrop-blur-sm shadow-2xl overflow-hidden">
              {mode === "ai" ? (
                /* ──── AI chat mode (all phases: explore → plot → structure → writing) ──── */
                <>
                  {/* Section progress bar — visible only once structure is chosen */}
                  {storyBlocks.length > 0 && (
                    <div className="px-5 pt-4 pb-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-700">
                          ✍️ Now writing:{" "}
                          <span className="text-purple-500">
                            {currentWritingSection < storyBlocks.length
                              ? storyBlocks[currentWritingSection].sectionName
                              : "All done!"}
                          </span>
                        </span>
                        <span className="text-xs text-slate-400">
                          {Math.min(currentWritingSection + 1, storyBlocks.length)}/{storyBlocks.length}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {storyBlocks.map((block, idx) => (
                          <div
                            key={block.sectionName}
                            title={block.sectionName}
                            className={cn(
                              "flex-1 h-1.5 rounded-full transition-all duration-300",
                              idx < currentWritingSection
                                ? "bg-emerald-400"
                                : idx === currentWritingSection
                                  ? "bg-purple-500"
                                  : "bg-slate-200",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  <div
                    ref={chatContainerRef}
                    className="h-[460px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-white to-purple-50/60"
                  >
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[82%] rounded-2xl px-4 py-3 shadow-sm",
                              msg.role === "user"
                                ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white"
                                : "bg-gradient-to-r from-purple-100 to-orange-100 text-slate-800 border border-purple-200",
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                              {msg.content}
                            </p>

                            {/* Suggestion pills */}
                            {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {msg.suggestions.map((suggestion) => (
                                  <button
                                    key={`${msg.id}-${suggestion}`}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="rounded-full border border-purple-300 bg-white/90 px-3 py-1 text-xs font-semibold text-purple-700 transition hover:border-purple-500 hover:bg-white"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Add to Story button */}
                            {msg.role === "assistant" && msg.storySnippet && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleAddToStory(msg.storySnippet!)}
                                  className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add to Story
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Structure cards inline */}
                        {msg.structureCards && !selectedStructure && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {STRUCTURES.map((struct) => (
                              <button
                                key={struct.type}
                                type="button"
                                onClick={() => handleStructureSelect(struct.type)}
                                className="rounded-xl border-2 border-purple-200 bg-white p-4 text-left transition hover:border-purple-500 hover:shadow-md"
                              >
                                <h4 className="text-sm font-bold text-purple-800">{struct.name}</h4>
                                <p className="mt-1 text-xs text-slate-600">{struct.desc}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {struct.outline.map((step) => (
                                    <span
                                      key={step}
                                      className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600"
                                    >
                                      {step}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-purple-200 bg-white px-4 py-3 shadow-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="border-t border-purple-100 bg-white p-4 space-y-2">
                    <div className="flex gap-3">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendChat()
                          }
                        }}
                        placeholder={
                          storyBlocks.length > 0 && currentWritingSection < storyBlocks.length
                            ? `Write your ${storyBlocks[currentWritingSection].sectionName}...`
                            : "Type your message..."
                        }
                        disabled={isLoading}
                        className="flex-1 border-purple-200 focus-visible:border-purple-400"
                      />
                      <Button
                        type="button"
                        onClick={handleSendChat}
                        disabled={isLoading || !chatInput.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleHelpMe}
                        disabled={isLoading}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        title="Get a creative idea!"
                      >
                        <Lightbulb className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Next Section button — appears once current section has content */}
                    {storyBlocks.length > 0 &&
                      currentWritingSection < storyBlocks.length - 1 &&
                      storyBlocks[currentWritingSection].text.trim() && (
                        <Button
                          type="button"
                          onClick={() => setCurrentWritingSection((prev) => prev + 1)}
                          variant="outline"
                          className="w-full text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                          Next Section: {storyBlocks[currentWritingSection + 1].sectionName} →
                        </Button>
                      )}
                  </div>
                </>
              ) : (
                /* ──── Manual mode: static guides ──── */
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-bold text-slate-800">Plan Your Story</h3>

                  {!manualPlotDone ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Fill in the three elements of your plot:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Setting (where & when)</label>
                          <Input
                            value={plotData.setting}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, setting: e.target.value }))}
                            placeholder="e.g. A magical forest at night"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Conflict (the problem)</label>
                          <Input
                            value={plotData.conflict}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, conflict: e.target.value }))}
                            placeholder="e.g. A dragon stole the village's water"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Goal (what the hero wants)</label>
                          <Input
                            value={plotData.goal}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, goal: e.target.value }))}
                            placeholder="e.g. Get the water back and befriend the dragon"
                          />
                        </div>
                        <Button onClick={handleManualPlotConfirm} className="w-full bg-purple-600 text-white">
                          Confirm Plot
                        </Button>
                      </div>
                    </div>
                  ) : !selectedStructure ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Great plot! Now choose a story structure:
                      </p>
                      <div className="grid gap-3">
                        {STRUCTURES.map((struct) => (
                          <button
                            key={struct.type}
                            type="button"
                            onClick={() => handleStructureSelect(struct.type)}
                            className="rounded-xl border-2 border-purple-200 bg-white p-4 text-left transition hover:border-purple-500 hover:shadow-md"
                          >
                            <h4 className="text-sm font-bold text-purple-800">{struct.name}</h4>
                            <p className="mt-1 text-xs text-slate-600">{struct.desc}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {struct.outline.map((step) => (
                                <span
                                  key={step}
                                  className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600"
                                >
                                  {step}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-semibold">Plot & structure ready!</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Write your story in the editor on the right. Fill in each section and click &ldquo;Finish Story&rdquo; when you&apos;re done.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ──── Right: Story Editor ──── */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border-4 border-white/60 bg-white/85 backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Story Editor
                </h3>

                {/* Plot summary */}
                {(plotData.setting || plotData.conflict || plotData.goal) && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-1">
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">Plot Summary</h4>
                    {plotData.setting && (
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold">Setting:</span> {plotData.setting}
                      </p>
                    )}
                    {plotData.conflict && (
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold">Problem:</span> {plotData.conflict}
                      </p>
                    )}
                    {plotData.goal && (
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold">Goal:</span> {plotData.goal}
                      </p>
                    )}
                  </div>
                )}

                {/* Structure badge */}
                {structureForDisplay && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                      {structureForDisplay.name}
                    </span>
                  </div>
                )}

                {/* Story blocks */}
                {storyBlocks.length > 0 ? (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {storyBlocks.map((block, index) => {
                      const isActive = mode === "ai" && index === currentWritingSection && index < storyBlocks.length
                      const isDone = mode === "ai" ? index < currentWritingSection : !!block.text.trim()
                      return (
                        <div key={block.sectionName} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <label
                              className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                isDone ? "text-emerald-600" : isActive ? "text-purple-700" : "text-slate-400",
                              )}
                            >
                              {block.sectionName}
                            </label>
                            {isDone && <Check className="h-3 w-3 text-emerald-500" />}
                            {isActive && <span className="text-[10px] text-purple-500 font-semibold">← writing now</span>}
                          </div>
                          {mode === "ai" ? (
                            /* Read-only display in AI mode */
                            <div
                              className={cn(
                                "min-h-[80px] rounded-lg border p-3 text-sm whitespace-pre-wrap transition-all duration-300",
                                isActive
                                  ? "border-purple-300 bg-purple-50/60 ring-2 ring-purple-200"
                                  : isDone
                                    ? "border-emerald-200 bg-emerald-50/40 text-slate-700"
                                    : "border-slate-200 bg-slate-50/60 text-slate-400 italic",
                              )}
                            >
                              {block.text || (isActive ? "Your writing will appear here..." : "Not written yet")}
                            </div>
                          ) : (
                            /* Editable in manual mode */
                            <Textarea
                              value={block.text}
                              onChange={(e) => handleStoryBlockChange(index, e.target.value)}
                              placeholder={`Write the ${block.sectionName.toLowerCase()} of your story...`}
                              className="min-h-[80px] resize-none border-slate-200 text-sm focus-visible:border-purple-400"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm">
                    {selectedStructure
                      ? "Loading sections..."
                      : "Choose a story structure to start writing!"}
                  </div>
                )}

                {/* Footer stats + Finish */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Words: <span className="font-semibold text-slate-700">{totalWords}</span>
                    {storyBlocks.length > 0 && (
                      <>
                        {" · "}Sections: <span className="font-semibold text-slate-700">{storyBlocks.filter((b) => b.text.trim()).length}/{storyBlocks.length}</span>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleFinishStory}
                    disabled={storyBlocks.length === 0 || totalWords === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Finish Story
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
