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
      className="min-h-screen py-8 px-6 relative overflow-hidden pixel-theme"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      {/* Pixel art background */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        {/* Pixel clouds */}
        <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-32 left-[40%] w-20 h-10 bg-white opacity-75" style={{
          clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        
        {/* Pixel grass at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 5 + Math.random() * 2}%`,
                width: "8px",
                height: `${20 + Math.random() * 16}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
        </div>
      </div>

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
            <div className="pixel-panel overflow-hidden">
              {mode === "ai" ? (
                /* ──── AI chat mode (all phases: explore → plot → structure → writing) ──── */
                <>
                  {/* Section progress bar — visible only once structure is chosen */}
                  {storyBlocks.length > 0 && (
                    <div className="px-5 pt-4 pb-3" style={{
                      borderBottom: "4px solid #8b6914",
                      background: "linear-gradient(180deg, #e8c547 0%, #c9a82e 100%)"
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold" style={{ color: "#5a4a2a" }}>
                          Now writing:{" "}
                          <span style={{ color: "#3d5a1f" }}>
                            {currentWritingSection < storyBlocks.length
                              ? storyBlocks[currentWritingSection].sectionName
                              : "All done!"}
                          </span>
                        </span>
                        <span className="text-xs font-bold" style={{ color: "#6b5210" }}>
                          {Math.min(currentWritingSection + 1, storyBlocks.length)}/{storyBlocks.length}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {storyBlocks.map((block, idx) => (
                          <div
                            key={block.sectionName}
                            title={block.sectionName}
                            className="flex-1 h-3 transition-all duration-300"
                            style={{
                              background: idx < currentWritingSection
                                ? "#7ec850"
                                : idx === currentWritingSection
                                  ? "#e8c547"
                                  : "#d9c9a6",
                              border: `2px solid ${idx < currentWritingSection ? "#5a9a32" : idx === currentWritingSection ? "#c4a020" : "#8b6914"}`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  <div
                    ref={chatContainerRef}
                    className="h-[460px] overflow-y-auto p-6 space-y-4"
                    style={{ background: "#f5e6c8" }}
                  >
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className="max-w-[82%] px-4 py-3"
                            style={{
                              background: msg.role === "user" 
                                ? "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)" 
                                : "#fff",
                              border: msg.role === "user" ? "3px solid #3d8a3d" : "3px solid #8b6914",
                              boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                              color: msg.role === "user" ? "#fff" : "#5a4a2a"
                            }}
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
                                    className="px-3 py-1 text-xs font-bold transition hover:scale-105"
                                    style={{
                                      background: "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)",
                                      border: "2px solid #3d8a3d",
                                      color: "#fff",
                                      boxShadow: "2px 2px 0 rgba(0,0,0,0.2)"
                                    }}
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
                                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition hover:scale-105"
                                  style={{
                                    background: "#87ceeb",
                                    border: "2px solid #5bc0de",
                                    color: "#2a5a7a",
                                    boxShadow: "2px 2px 0 rgba(0,0,0,0.2)"
                                  }}
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
                                className="p-4 text-left transition hover:scale-105"
                                style={{
                                  background: "#fff",
                                  border: "3px solid #8b6914",
                                  boxShadow: "3px 3px 0 rgba(0,0,0,0.2)"
                                }}
                              >
                                <h4 className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>{struct.name}</h4>
                                <p className="mt-1 text-xs" style={{ color: "#6b5210" }}>{struct.desc}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {struct.outline.map((step) => (
                                    <span
                                      key={step}
                                      className="px-2 py-0.5 text-[10px] font-bold"
                                      style={{
                                        background: "#7ec850",
                                        color: "#fff",
                                        border: "2px solid #5a9a32"
                                      }}
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
                        <div className="px-4 py-3" style={{ background: "#fff", border: "3px solid #8b6914" }}>
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#7ec850" }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="p-4 space-y-2" style={{ borderTop: "4px solid #8b6914", background: "#d9c9a6" }}>
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
                        className="flex-1 pixel-input"
                      />
                      <Button
                        type="button"
                        onClick={handleSendChat}
                        disabled={isLoading || !chatInput.trim()}
                        className="pixel-btn pixel-btn-green"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleHelpMe}
                        disabled={isLoading}
                        className="pixel-btn pixel-btn-wood"
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
                          className="w-full text-xs pixel-btn pixel-btn-blue"
                        >
                          Next Section: {storyBlocks[currentWritingSection + 1].sectionName}
                        </Button>
                      )}
                  </div>
                </>
              ) : (
                /* ──── Manual mode: static guides ──── */
                <div className="p-6 space-y-6" style={{ background: "#f5e6c8" }}>
                  <h3 className="text-lg font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Plan Your Story</h3>

                  {!manualPlotDone ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold" style={{ color: "#6b5210" }}>
                        Fill in the three elements of your plot:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>Setting (where & when)</label>
                          <Input
                            value={plotData.setting}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, setting: e.target.value }))}
                            placeholder="e.g. A magical forest at night"
                            className="pixel-input"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>Conflict (the problem)</label>
                          <Input
                            value={plotData.conflict}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, conflict: e.target.value }))}
                            placeholder="e.g. A dragon stole the village's water"
                            className="pixel-input"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>Goal (what the hero wants)</label>
                          <Input
                            value={plotData.goal}
                            onChange={(e) => setPlotData((prev) => ({ ...prev, goal: e.target.value }))}
                            placeholder="e.g. Get the water back and befriend the dragon"
                            className="pixel-input"
                          />
                        </div>
                        <Button onClick={handleManualPlotConfirm} className="w-full pixel-btn pixel-btn-green">
                          Confirm Plot
                        </Button>
                      </div>
                    </div>
                  ) : !selectedStructure ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold" style={{ color: "#6b5210" }}>
                        Great plot! Now choose a story structure:
                      </p>
                      <div className="grid gap-3">
                        {STRUCTURES.map((struct) => (
                          <button
                            key={struct.type}
                            type="button"
                            onClick={() => handleStructureSelect(struct.type)}
                            className="p-4 text-left transition hover:scale-105"
                            style={{
                              background: "#fff",
                              border: "3px solid #8b6914",
                              boxShadow: "3px 3px 0 rgba(0,0,0,0.2)"
                            }}
                          >
                            <h4 className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>{struct.name}</h4>
                            <p className="mt-1 text-xs" style={{ color: "#6b5210" }}>{struct.desc}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {struct.outline.map((step) => (
                                <span
                                  key={step}
                                  className="px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    background: "#7ec850",
                                    color: "#fff",
                                    border: "2px solid #5a9a32"
                                  }}
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
                      <div className="flex items-center gap-2" style={{ color: "#3d5a1f" }}>
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-bold">Plot & structure ready!</span>
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#6b5210" }}>
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
            <div className="pixel-panel overflow-hidden">
              <div className="p-6 space-y-4" style={{ background: "#f5e6c8" }}>
                <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
                  <Sparkles className="h-5 w-5" style={{ color: "#7ec850" }} />
                  Story Editor
                </h3>

                {/* Plot summary */}
                {(plotData.setting || plotData.conflict || plotData.goal) && (
                  <div className="p-3 space-y-1" style={{ background: "#d4e8b4", border: "3px solid #5a9a32" }}>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "#3d5a1f" }}>Plot Summary</h4>
                    {plotData.setting && (
                      <p className="text-xs" style={{ color: "#5a4a2a" }}>
                        <span className="font-bold">Setting:</span> {plotData.setting}
                      </p>
                    )}
                    {plotData.conflict && (
                      <p className="text-xs" style={{ color: "#5a4a2a" }}>
                        <span className="font-bold">Problem:</span> {plotData.conflict}
                      </p>
                    )}
                    {plotData.goal && (
                      <p className="text-xs" style={{ color: "#5a4a2a" }}>
                        <span className="font-bold">Goal:</span> {plotData.goal}
                      </p>
                    )}
                  </div>
                )}

                {/* Structure badge */}
                {structureForDisplay && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold" style={{
                      background: "#87ceeb",
                      color: "#2a5a7a",
                      border: "2px solid #5bc0de"
                    }}>
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
                            <label className="text-xs font-bold uppercase tracking-wider" style={{
                              color: isDone ? "#3d5a1f" : isActive ? "#c4a020" : "#8b6914"
                            }}>
                              {block.sectionName}
                            </label>
                            {isDone && <Check className="h-3 w-3" style={{ color: "#5a9a32" }} />}
                            {isActive && <span className="text-[10px] font-bold" style={{ color: "#c4a020" }}>writing now</span>}
                          </div>
                          {mode === "ai" ? (
                            /* Read-only display in AI mode */
                            <div
                              className="min-h-[80px] p-3 text-sm whitespace-pre-wrap transition-all duration-300"
                              style={{
                                background: isActive ? "#f5e6c8" : isDone ? "#d4e8b4" : "#e8dcc0",
                                border: `3px solid ${isActive ? "#c4a020" : isDone ? "#5a9a32" : "#8b6914"}`,
                                color: isDone ? "#5a4a2a" : "#8b6914",
                                fontStyle: block.text ? "normal" : "italic"
                              }}
                            >
                              {block.text || (isActive ? "Your writing will appear here..." : "Not written yet")}
                            </div>
                          ) : (
                            /* Editable in manual mode */
                            <Textarea
                              value={block.text}
                              onChange={(e) => handleStoryBlockChange(index, e.target.value)}
                              placeholder={`Write the ${block.sectionName.toLowerCase()} of your story...`}
                              className="min-h-[80px] resize-none pixel-input text-sm"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-sm font-bold" style={{ color: "#8b6914" }}>
                    {selectedStructure
                      ? "Loading sections..."
                      : "Choose a story structure to start writing!"}
                  </div>
                )}

                {/* Footer stats + Finish */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "3px solid #8b6914" }}>
                  <div className="text-xs font-bold" style={{ color: "#6b5210" }}>
                    Words: <span style={{ color: "#5a4a2a" }}>{totalWords}</span>
                    {storyBlocks.length > 0 && (
                      <>
                        {" | "}Sections: <span style={{ color: "#5a4a2a" }}>{storyBlocks.filter((b) => b.text.trim()).length}/{storyBlocks.length}</span>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleFinishStory}
                    disabled={storyBlocks.length === 0 || totalWords === 0}
                    className="pixel-btn pixel-btn-green"
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
