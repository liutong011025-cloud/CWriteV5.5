"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Lightbulb, Send, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"

import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentLevel } from "@/lib/current-level"
import type { StoryRevisionTag } from "@/lib/story-revision-tags"
import type { PlotConversationProgress } from "@/lib/story-plot-coach"
import { cn } from "@/lib/utils"
import StoryRevisionTags from "@/components/stages/story-revision-tags"

/* ── Types ───────────────────────────────────────────── */

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"
type StoryMode = "ai" | "manual"
type PlotState = NonNullable<StoryState["plot"]>
type StructureState = NonNullable<StoryState["structure"]>
type StructureType = StructureState["type"]

interface StoryCollabProps {
  language: Language
  storyState: StoryState
  /** Plan Test / journey 难度 1–5（传给协作 API） */
  writingLevel?: number
  mode: StoryMode
  onPlotCreate: (plot: PlotState) => void
  onPlotFinalize?: (plot: PlotState) => void
  onStructureSelect: (structure: StructureState) => void
  onStoryWrite: (story: string) => void
  onBack: () => void
  userId?: string
  onDraftChange?: (text: string) => void
  /** 自定义 API 端点，默认 /api/story-collab */
  apiEndpoint?: string
  /** 提示词测试模式：显示横幅，不写库 */
  promptTestMode?: boolean
}

interface CollabMessage {
  id: string
  role: "assistant" | "user"
  content: string
  suggestions?: string[]
  storySnippet?: string | null
  structureCards?: boolean
  revisionTags?: StoryRevisionTag[]
  sectionPassed?: boolean
}

interface CollabApiResponse {
  answer: string
  phase: CollabPhase
  suggestions: string[]
  story_snippet: string | null
  plot_update: { setting?: string; conflict?: string; goal?: string } | null
  structure_suggestion: string | null
  revision_tags?: StoryRevisionTag[]
  section_passed?: boolean
  plot_state?: { setting?: string; conflict?: string; goal?: string }
  plot_progress?: PlotConversationProgress
  plot_complete?: boolean
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

/** 用户输入 start writing / let's start writing 等即进入结构选择 */
function wantsStartWriting(raw: string): boolean {
  const t = raw.toLowerCase().trim()
  if (t === "start writing") return true
  if (/^start\s+writing[!.\s]*$/i.test(t)) return true
  if (/^let['']?s\s+(start\s+)?writing\b/i.test(t)) return true
  if (/^begin\s+writing\b/i.test(t)) return true
  return false
}

const cleanAiDisplayText = (text: string) =>
  text
    .replace(/The plot is getting clearer![\s\S]*?talk about\?/gi, "")
    .replace(/故事情节已经比较清晰了[，,]?\s*还想再聊些什么吗[？?]?/g, "")
    .replace(/Great choice!?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()

function detectAdvanceNextSectionSignal(answer: string): boolean {
  if (!answer || typeof answer !== "string") return false
  const t = answer.trim()
  if (!t) return false
  return (
    /\byou can move on to the next part of your writing!/i.test(t) ||
    /\byou can move to the next section\b/i.test(t) ||
    /\byou may move to the next section\b/i.test(t) ||
    /\byou'?re ready to move to the next section\b/i.test(t) ||
    /\bready for the next section\b/i.test(t) ||
    /可以进入下一节/.test(t) ||
    /可以进入下一部分/.test(t) ||
    /可以進入下一節/.test(t)
  )
}

/** Last section: AI ends with this when the final beat is good enough → show Continue, hide Finish! */
function detectLastSectionGreatJobSignal(answer: string): boolean {
  if (!answer || typeof answer !== "string") return false
  const t = answer.trim()
  if (!t) return false
  return /\bgreat job\b/i.test(t) || /太棒了/.test(t) || /做得好/.test(t)
}

function stripAdvanceNextSectionPhrases(text: string): string {
  let t = text
  const removals: RegExp[] = [
    /\n*You can move on to the next part of your writing!\.?\s*$/i,
    /\n*You can move to the next section\.?\s*$/i,
    /\n*You may move to the next section\.?\s*$/i,
    /\n*You'?re ready to move to the next section\.?\s*$/i,
    /\n*Ready for the next section\.?\s*$/i,
    /\n*可以进入下一节[。.]?\s*$/,
    /\n*可以进入下一部分[。.]?\s*$/,
    /\n*可以進入下一節[。.]?\s*$/,
  ]
  for (const re of removals) {
    t = t.replace(re, "")
  }
  return t.replace(/\s{2,}/g, " ").trim()
}

function stripLastSectionGreatJobPhrases(text: string): string {
  return text
    .replace(/\n*Great job!?\.?\s*$/i, "")
    .replace(/\n*太棒了[！!。.]?\s*$/, "")
    .replace(/\n*做得好[！!。.]?\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function mergePadIntoSection(committed: string, pad: string): string {
  const c = committed.trim()
  const p = pad.trim()
  if (!c) return p
  if (!p) return c
  return `${c} ${p}`
}

/** Before a structure is chosen (plot chat, structure cards): fixed position. */
const BEAR_PLOT_CHAT = { x: 16, y: -34, scale: 1.05 } as const

/** After structure is selected: writing vs next-section-unlocked. */
const BEAR_LAYOUT = {
  writing: { x: 16, y: -32, scale: 0.94 },
  nextUnlocked: { x: 11, y: -15, scale: 1.08 },
} as const

/* ── Component ───────────────────────────────────────── */

export default function StoryCollab({
  language,
  storyState,
  writingLevel: writingLevelProp,
  mode,
  onPlotCreate,
  onPlotFinalize,
  onStructureSelect,
  onStoryWrite,
  onBack,
  userId,
  onDraftChange,
  apiEndpoint = "/api/story-collab",
  promptTestMode = false,
}: StoryCollabProps) {
  const levelForApi = writingLevelProp ?? getCurrentLevel()

  /* ── State ── */
  const [phase, setPhase] = useState<CollabPhase>("explore")
  const [messages, setMessages] = useState<CollabMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])
  const [testMode, setTestMode] = useState(false)

  // Plot data
  const [plotData, setPlotData] = useState<{ setting: string; conflict: string; goal: string }>({
    setting: storyState.plot?.setting || "",
    conflict: storyState.plot?.conflict || "",
    goal: storyState.plot?.goal || "",
  })
  const [plotProgress, setPlotProgress] = useState<PlotConversationProgress>({})
  const [plotReadyForStructure, setPlotReadyForStructure] = useState(false)

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
  const [writingMood, setWritingMood] = useState<"sit" | "like" | "angry">("sit")
  type GateStatus = "idle" | "passed"
  const [sectionGateStatus, setSectionGateStatus] = useState<Record<number, GateStatus>>({})
  const gatePassSnapshotRef = useRef<Record<number, string>>({})

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatWasNearBottomRef = useRef(true)

  /* ── Derived ── */
  const totalWords = useMemo(() => {
    let sum = 0
    for (let i = 0; i < storyBlocks.length; i++) {
      const b = storyBlocks[i]
      const text =
        mode === "ai" && i === currentWritingSection
          ? mergePadIntoSection(b.text, chatInput)
          : b.text
      sum += countWords(text)
    }
    return sum
  }, [storyBlocks, currentWritingSection, chatInput, mode])

  const plotFieldsFilled = !!(plotData.setting && plotData.conflict && plotData.goal)
  const plotComplete = plotReadyForStructure || (mode === "manual" && plotFieldsFilled)

  const activeBear = useMemo(() => {
    const n = storyBlocks.length
    const hasNext = n > 0 && currentWritingSection < n - 1
    const onLast = n > 0 && currentWritingSection === n - 1
    const passed = sectionGateStatus[currentWritingSection] === "passed"
    if (!selectedStructure) return BEAR_PLOT_CHAT
    if (passed && (hasNext || onLast)) return BEAR_LAYOUT.nextUnlocked
    return BEAR_LAYOUT.writing
  }, [selectedStructure, storyBlocks.length, currentWritingSection, sectionGateStatus])

  const currentSectionMergedDraft = useMemo(() => {
    const idx = currentWritingSection
    if (idx < 0 || idx >= storyBlocks.length) return ""
    return mergePadIntoSection(storyBlocks[idx]?.text ?? "", chatInput)
  }, [storyBlocks, currentWritingSection, chatInput])

  useEffect(() => {
    const idx = currentWritingSection
    const t = currentSectionMergedDraft
    const snap = gatePassSnapshotRef.current[idx]
    if (snap !== undefined && t !== snap) {
      setSectionGateStatus((prev) => {
        if (prev[idx] !== "passed") return prev
        return { ...prev, [idx]: "idle" }
      })
    }
  }, [currentSectionMergedDraft, currentWritingSection])

  const composedStory = useMemo(
    () =>
      storyBlocks
        .map((b, i) => {
          const body =
            mode === "ai" && i === currentWritingSection
              ? mergePadIntoSection(b.text, chatInput)
              : b.text.trim()
          return `${b.sectionName}:\n${body}`.trimEnd()
        })
        .join("\n\n")
        .trim(),
    [storyBlocks, currentWritingSection, chatInput, mode],
  )

  /** 仅右侧已保存的正文（不含 Pad）；Finish Story 在 AI 模式下用此拼接终稿 */
  const composedStoryCommitted = useMemo(
    () =>
      storyBlocks
        .map((b) => `${b.sectionName}:\n${b.text.trim()}`.trimEnd())
        .join("\n\n")
        .trim(),
    [storyBlocks],
  )

  /** Finish Story：仅统计已出现在右侧编辑区的正文；Pad 里未点 Next/Continue 的不算。 */
  const everySectionHasContentForFinish = useMemo(() => {
    if (storyBlocks.length === 0) return false
    return storyBlocks.every((block) => !!block.text.trim())
  }, [storyBlocks])

  const sectionsProgressCount = useMemo(
    () => storyBlocks.filter((b) => !!b.text.trim()).length,
    [storyBlocks],
  )

  const hideFinishShowContinueLast = useMemo(() => {
    const n = storyBlocks.length
    if (n === 0) return false
    const last = n - 1
    return (
      mode === "ai" &&
      currentWritingSection === last &&
      sectionGateStatus[last] === "passed"
    )
  }, [storyBlocks.length, mode, currentWritingSection, sectionGateStatus])

  const bearSrc =
    writingMood === "angry"
      ? "/Cagentangry.webp"
      : writingMood === "like"
        ? "/Cagentlike.webp"
        : "/Cagentsit.webp"

  const updateWritingMoodFromText = useCallback((text: string) => {
    const lower = text.toLowerCase()
    const dangerWords = ["kill", "murder", "hate", "stupid", "idiot", "fuck", "shit", "asshole", "die"]
    const positiveWords = ["love", "like", "happy", "kind", "friend", "help", "care", "brave", "thank", "thanks", "excited"]

    if (dangerWords.some((word) => lower.includes(word))) {
      setWritingMood("angry")
      return
    }

    if (positiveWords.some((word) => lower.includes(word))) {
      setWritingMood("like")
      return
    }

    setWritingMood("sit")
  }, [])

  /* ── Auto-scroll chat (only chat container; only if overflowing; only if user is near bottom) ── */
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    if (container.scrollHeight <= container.clientHeight + 2) return
    if (!chatWasNearBottomRef.current) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const onScroll = () => {
      const threshold = 80
      chatWasNearBottomRef.current =
        container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
    }

    onScroll()
    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

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
        content: `Hi! Let's dream up a story for ${charName} together.\n\nWhat kind of story are you in the mood for?`,
        suggestions: ["Adventure", "Magic", "Mystery", "Funny"],
      }
      setMessages([welcome])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── API call ── */
  const sendMessage = useCallback(
    async (text: string, action?: "help_me" | "chat" | "submit_section") => {
      if (isLoading) return

      const padSnapshot =
        mode === "ai" && storyBlocks.length > 0 && currentWritingSection < storyBlocks.length
          ? chatInput.trim()
          : ""
      const keepWritingPad =
        mode === "ai" && storyBlocks.length > 0 && currentWritingSection < storyBlocks.length

      const storyBlocksPayload = storyBlocks.map((b, i) => ({
        section: b.sectionName,
        text:
          i === currentWritingSection ? mergePadIntoSection(b.text, padSnapshot) : b.text,
      }))

      setIsLoading(true)

      const userMsg: CollabMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      }
      setMessages((prev) => [...prev, userMsg])
      if (!keepWritingPad) setChatInput("")

      const newHistory = [...conversationHistory, { role: "user", content: text }]

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversation_history: newHistory.slice(-20),
            character: storyState.character,
            plot_state: plotData,
            plot_progress: plotProgress,
            structure_type: selectedStructure,
            story_blocks: storyBlocksPayload,
            current_writing_section_index:
              selectedStructure && storyBlocks.length > 0 ? currentWritingSection : null,
            current_phase: phase,
            user_id: promptTestMode ? undefined : userId || "anonymous",
            level: levelForApi,
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

        const applyPlotState = (patch?: { setting?: string; conflict?: string; goal?: string } | null) => {
          if (!patch) return
          setPlotData((prev) => ({
            setting: patch.setting?.trim() || prev.setting,
            conflict: patch.conflict?.trim() || prev.conflict,
            goal: patch.goal?.trim() || prev.goal,
          }))
        }
        if (data.plot_state) {
          applyPlotState(data.plot_state)
        } else if (data.plot_update) {
          applyPlotState(data.plot_update)
        }
        if (data.plot_progress) {
          setPlotProgress(data.plot_progress)
        }
        if (data.plot_complete === true) {
          setPlotReadyForStructure(true)
        }

        // Handle structure_suggestion
        if (data.structure_suggestion) {
          const matchType = data.structure_suggestion.toLowerCase()
          if (matchType.includes("freytag")) handleStructureSelect("freytag")
          else if (matchType.includes("three")) handleStructureSelect("threeAct")
          else if (matchType.includes("fichtean")) handleStructureSelect("fichtean")
        }

        const rawAnswer = data.answer || ""
        const sectionPassed = data.section_passed === true
        if (
          sectionPassed &&
          selectedStructure &&
          storyBlocks.length > 0 &&
          currentWritingSection < storyBlocks.length - 1
        ) {
          const idx = currentWritingSection
          const mergedForGate = mergePadIntoSection(storyBlocks[idx]?.text ?? "", padSnapshot)
          if (mergedForGate.trim()) {
            gatePassSnapshotRef.current[idx] = mergedForGate.trim()
            setSectionGateStatus((prev) => ({ ...prev, [idx]: "passed" }))
          }
        }

        if (
          sectionPassed &&
          selectedStructure &&
          storyBlocks.length > 0 &&
          currentWritingSection === storyBlocks.length - 1
        ) {
          const idx = currentWritingSection
          const mergedForGate = mergePadIntoSection(storyBlocks[idx]?.text ?? "", padSnapshot)
          if (mergedForGate.trim()) {
            gatePassSnapshotRef.current[idx] = mergedForGate.trim()
            setSectionGateStatus((prev) => ({ ...prev, [idx]: "passed" }))
          }
        }

        // Build assistant message
        const cleaned = stripLastSectionGreatJobPhrases(
          stripAdvanceNextSectionPhrases(cleanAiDisplayText(rawAnswer)),
        )
        const showStructureCards =
          !selectedStructure && (data.plot_complete === true || data.phase === "structure")

        const aiMsg: CollabMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content:
            data.revision_tags?.length
              ? data.answer?.trim() ||
                "Revise your Writing Pad — tap each tag to see why, then tap Finish! again."
              : cleaned,
          suggestions: data.revision_tags?.length ? [] : data.suggestions,
          storySnippet: data.story_snippet,
          structureCards: showStructureCards,
          revisionTags: data.revision_tags?.length ? data.revision_tags : undefined,
          sectionPassed: data.section_passed === true && !data.revision_tags?.length,
        }
        setMessages((prev) => [...prev, aiMsg])

        // Update conversation history
        setConversationHistory([
          ...newHistory,
          { role: "assistant", content: rawAnswer },
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
            suggestions: ["At school", "In a forest", "A magic problem"],
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [
      isLoading,
      conversationHistory,
      storyState.character,
      plotData,
      plotProgress,
      selectedStructure,
      storyBlocks,
      phase,
      userId,
      levelForApi,
      currentWritingSection,
      chatInput,
      mode,
      apiEndpoint,
      promptTestMode,
    ],
  )

  /* ── Handlers ── */

  const openStructureSelection = useCallback(
    (userLine?: string) => {
      if (selectedStructure) return
      if (!plotComplete) {
        toast.error("Finish setting, conflict, and goal first — chat a bit more with the AI!")
        return
      }
      const characterName = storyState.character?.name || "the hero"
      const nextPlot = {
        setting: plotData.setting.trim() || "a bright little town",
        conflict: plotData.conflict.trim() || `${characterName} faces a tricky problem`,
        goal: plotData.goal.trim() || `${characterName} wants to solve the problem`,
      }
      setPlotData(nextPlot)
      onPlotCreate(nextPlot)
      onPlotFinalize?.(nextPlot)
      const extra: CollabMessage[] = []
      if (userLine !== undefined) {
        extra.push({ id: `user-${Date.now()}`, role: "user", content: userLine })
      }
      extra.push({
        id: `ai-struct-${Date.now()}`,
        role: "assistant",
        content: "Great — choose a story structure for your story:",
        suggestions: [],
        structureCards: true,
      })
      setMessages((prev) => [...prev, ...extra])
      setChatInput("")
      setPhase("structure")
    },
    [
      selectedStructure,
      plotComplete,
      plotData.setting,
      plotData.conflict,
      plotData.goal,
      storyState.character?.name,
      onPlotCreate,
      onPlotFinalize,
    ],
  )

  const activateTestModeAndFinish = useCallback(() => {
    setTestMode(true)

    const testPlot = {
      setting: "in a sunny pixel farm",
      conflict: "the hero loses a magic seed",
      goal: "wants to find the seed before sunset",
    }
    setPlotData(testPlot)
    setManualPlotDone(true)
    onPlotCreate(testPlot)

    const struct = STRUCTURES[0]
    setSelectedStructure(struct.type)
    setStoryBlocks(
      struct.outline.map((sectionName, idx) => ({
        sectionName,
        text:
          idx === 0
            ? "Test mode story. This is a short sample adventure on the farm."
            : "The story continues with clear actions and a happy ending.",
      })),
    )
    onStructureSelect({ type: struct.type, outline: struct.outline })

    setPhase("writing")
    setCurrentWritingSection(struct.outline.length)

    setMessages((prev) => [
      ...prev,
      {
        id: `test-${Date.now()}`,
        role: "assistant",
        content: "TEST MODE enabled: skipping plot, structure, and writing. Finishing now.",
        suggestions: [],
      },
    ])

    // Finish after state updates are queued
    window.setTimeout(() => {
      const composed = struct.outline
        .map((sectionName, idx) => {
          const text =
            idx === 0
              ? "Test mode story. This is a short sample adventure on the farm."
              : "The story continues with clear actions and a happy ending."
          return `${sectionName}:\n${text}`.trimEnd()
        })
        .join("\n\n")
        .trim()
      onStoryWrite(composed)
    }, 0)
  }, [onPlotCreate, onStructureSelect, onStoryWrite])

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim()
    if (!text || isLoading) return
    const n = storyBlocks.length
    const last = n - 1
    if (
      n > 0 &&
      mode === "ai" &&
      currentWritingSection === last &&
      sectionGateStatus[last] === "passed"
    ) {
      toast.info("Tap Continue to save this part to the editor first.")
      return
    }
    if (text.toLowerCase() === "test") {
      setChatInput("")
      activateTestModeAndFinish()
      return
    }

    if (wantsStartWriting(text) && !selectedStructure) {
      updateWritingMoodFromText(text)
      openStructureSelection(text)
      return
    }

    updateWritingMoodFromText(text)
    const submitSection = storyBlocks.length > 0 && mode === "ai"
    void sendMessage(text, submitSection ? "submit_section" : "chat")
  }, [
    chatInput,
    isLoading,
    sendMessage,
    activateTestModeAndFinish,
    updateWritingMoodFromText,
    selectedStructure,
    openStructureSelection,
    storyBlocks.length,
    mode,
    currentWritingSection,
    sectionGateStatus,
  ])

  const handleNextSection = useCallback(() => {
    const idx = currentWritingSection
    if (idx < 0 || idx >= storyBlocks.length) return
    const merged = mergePadIntoSection(storyBlocks[idx].text, chatInput).trim()
    if (!merged) {
      toast.error("Write something in the Writing Pad first.")
      return
    }
    setStoryBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], text: merged }
      return next
    })
    gatePassSnapshotRef.current[idx] = merged
    setChatInput("")
    setCurrentWritingSection((prev) => prev + 1)
  }, [currentWritingSection, storyBlocks, chatInput])

  const handleLastSectionContinue = useCallback(() => {
    const idx = storyBlocks.length - 1
    if (idx < 0 || currentWritingSection !== idx) return
    const merged = mergePadIntoSection(storyBlocks[idx].text, chatInput).trim()
    if (!merged) {
      toast.error("Write something in the Writing Pad first.")
      return
    }
    setStoryBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], text: merged }
      return next
    })
    gatePassSnapshotRef.current[idx] = merged
    setChatInput("")
    setSectionGateStatus((prev) => ({ ...prev, [idx]: "idle" }))
  }, [currentWritingSection, storyBlocks, chatInput])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isLoading) return
      if (storyBlocks.length > 0 && mode === "ai") {
        setChatInput((prev) => {
          const p = prev.trim()
          if (!p) return suggestion
          if (p.toLowerCase().includes(suggestion.toLowerCase())) return p
          return `${p} ${suggestion}`
        })
        return
      }
      updateWritingMoodFromText(suggestion)
      void sendMessage(suggestion)
    },
    [isLoading, sendMessage, updateWritingMoodFromText, storyBlocks.length, mode],
  )

  const handleHelpMe = useCallback(() => {
    if (isLoading) return
    setWritingMood("sit")
    void sendMessage("Help me write!", "help_me")
  }, [isLoading, sendMessage])

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
      if (index === currentWritingSection) {
        updateWritingMoodFromText(text)
      }
    },
    [currentWritingSection, updateWritingMoodFromText],
  )

  const syncStoryStateBeforeFinish = useCallback(() => {
    if (plotComplete) {
      onPlotCreate({
        setting: plotData.setting.trim(),
        conflict: plotData.conflict.trim(),
        goal: plotData.goal.trim(),
      })
    }

    if (selectedStructure) {
      const structure = STRUCTURES.find((item) => item.type === selectedStructure) || STRUCTURES[0]
      onStructureSelect({
        type: structure.type,
        outline: structure.outline,
      })
    }
  }, [onPlotCreate, onStructureSelect, plotComplete, plotData, selectedStructure])

  const handleFinishStory = useCallback(() => {
    const finalStory = (mode === "ai" ? composedStoryCommitted : composedStory).trim()
    if (!finalStory) {
      toast.error("Please write something before finishing the story.")
      return
    }

    if (!everySectionHasContentForFinish) {
      toast.error("Please write something in every structure section before finishing the story.")
      return
    }

    syncStoryStateBeforeFinish()

    if (totalWords < 20) {
      toast("Your story is quite short! Are you sure you want to finish?", {
        action: {
          label: "Yes, finish!",
          onClick: () => {
            syncStoryStateBeforeFinish()
            onStoryWrite((mode === "ai" ? composedStoryCommitted : composedStory).trim())
          },
        },
      })
      return
    }
    onStoryWrite(finalStory)
  }, [
    totalWords,
    composedStory,
    composedStoryCommitted,
    mode,
    onStoryWrite,
    syncStoryStateBeforeFinish,
    everySectionHasContentForFinish,
  ])

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
    onPlotFinalize?.({ setting: plotData.setting, conflict: plotData.conflict, goal: plotData.goal })
  }, [plotData, onPlotCreate, onPlotFinalize])

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
        {promptTestMode && (
          <div className="mt-4 pixel-panel p-3" style={{ background: "#e8c547", border: "4px solid #c4a020" }}>
            <p className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>
              提示词测试模式 — 使用 lib/story-test-prompts.ts 中的提示词，数据不会写入数据库
            </p>
          </div>
        )}
        {testMode && !promptTestMode && (
          <div className="mt-4 pixel-panel p-3" style={{ background: "#e8c547", border: "4px solid #c4a020" }}>
            <p className="text-sm font-extrabold" style={{ color: "#5a4a2a" }}>
              TEST MODE: 已跳过 plot / structure / writing
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 mt-8 min-w-0">
          {/* ──── Left: Chat Panel ──── */}
          <div className="lg:col-span-7 min-w-0">
            <div className="pixel-panel overflow-hidden relative">
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
                    className="h-[560px] overflow-y-auto p-6 space-y-4"
                    style={{ background: "#f5e6c8" }}
                  >
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className="max-w-[82%] px-5 py-4"
                            style={{
                              background: msg.role === "user" 
                                ? "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)" 
                                : "#fff",
                              border: msg.role === "user" ? "3px solid #3d8a3d" : "3px solid #8b6914",
                              boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                              color: msg.role === "user" ? "#fff" : "#5a4a2a"
                            }}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed text-base md:text-lg">
                              {msg.content}
                            </p>

                            {msg.role === "assistant" && msg.revisionTags && msg.revisionTags.length > 0 && (
                              <StoryRevisionTags tags={msg.revisionTags} />
                            )}

                            {msg.role === "assistant" && msg.sectionPassed && (
                              <p
                                className="mt-2 text-sm font-bold"
                                style={{ color: "#3d5a1f" }}
                              >
                                ✓ This part looks good — you can move on when you are ready!
                              </p>
                            )}

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
                    <div className="space-y-3">
                      {storyBlocks.length > 0 ? (
                        <div
                          className="rounded-sm p-3"
                          style={{
                            background: "#f5e6c8",
                            border: "3px solid #8b6914",
                            boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.25)",
                          }}
                        >
                          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#6b5210" }}>
                            Writing Pad
                          </p>
                          <Textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault()
                                handleSendChat()
                              }
                            }}
                            placeholder={
                              currentWritingSection < storyBlocks.length
                                ? currentWritingSection === storyBlocks.length - 1
                                  ? `Last part (${storyBlocks[currentWritingSection].sectionName}): Finish! to submit. Fix the colored tags, then Finish! again. When you see the green check, tap Continue.`
                                  : `Write your ${storyBlocks[currentWritingSection].sectionName} in the pad… Tap Finish! to get revision tags (hover / tap each tag). Revise and Finish! again until you can go to the next section.`
                                : "Write the ending touch for your story..."
                            }
                            disabled={isLoading}
                            className="min-h-[150px] resize-y pixel-input text-base leading-relaxed"
                          />
                        </div>
                      ) : (
                        <div className="w-full space-y-3">
                          {plotComplete && !selectedStructure && (
                            <Button
                              type="button"
                              onClick={() => openStructureSelection()}
                              disabled={isLoading}
                              className="w-full py-3 text-sm font-extrabold pixel-btn pixel-btn-blue"
                            >
                              Choose story structure
                            </Button>
                          )}
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
                              placeholder="Type your message… (or tap the button above)"
                              disabled={isLoading}
                              className="min-w-0 flex-1 pixel-input"
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
                        </div>
                      )}
                      {storyBlocks.length > 0 && !hideFinishShowContinueLast && (
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleSendChat}
                            disabled={isLoading || !chatInput.trim()}
                            className="flex-1 pixel-btn pixel-btn-green"
                          >
                            Finish!
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
                      )}
                    </div>
                    {/* Next Section：AI 认可后解锁；点击后把 Writing Pad 正文写入当前小节并进入下一节 */}
                    {storyBlocks.length > 0 &&
                      currentWritingSection < storyBlocks.length - 1 &&
                      currentSectionMergedDraft.trim() &&
                      sectionGateStatus[currentWritingSection] === "passed" && (
                        <div className="space-y-2">
                          <Button
                            type="button"
                            onClick={handleNextSection}
                            className="w-full text-xs pixel-btn pixel-btn-blue"
                          >
                            Next Section: {storyBlocks[currentWritingSection + 1].sectionName}
                          </Button>
                        </div>
                      )}
                    {/* Last section：Great job! 后出现 Continue，把末段写入右侧后才能 Finish Story */}
                    {storyBlocks.length > 0 &&
                      currentWritingSection === storyBlocks.length - 1 &&
                      currentSectionMergedDraft.trim() &&
                      sectionGateStatus[storyBlocks.length - 1] === "passed" && (
                        <div className="space-y-2">
                          <Button
                            type="button"
                            onClick={handleLastSectionContinue}
                            className="w-full text-xs pixel-btn pixel-btn-blue"
                          >
                            Continue
                          </Button>
                        </div>
                      )}
                  </div>

                  <div
                    className="pointer-events-none absolute z-20 flex flex-col items-center"
                    style={{
                      right: "1rem",
                      bottom: "1rem",
                      transform: `translate(${activeBear.x}px, ${activeBear.y}px) scale(${activeBear.scale})`,
                      transformOrigin: "bottom right",
                    }}
                  >
                    {writingMood === "angry" && (
                      <div
                        className="mb-2 max-w-[220px] rounded-2xl px-3 py-2 text-xs font-bold text-red-700 shadow-xl"
                        style={{
                          background: "rgba(255,255,255,0.94)",
                          border: "2px solid #f87171",
                        }}
                      >
                        Please rewrite with safer and kinder words.
                      </div>
                    )}
                    <img
                      src={bearSrc}
                      alt="Story writing bear"
                      className="h-32 w-32 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]"
                    />
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
          <div className="lg:col-span-5 min-w-0">
            <div className="pixel-panel overflow-hidden min-w-0">
              <div className="p-6 space-y-4 min-w-0" style={{ background: "#f5e6c8" }}>
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
                  <div className="space-y-3 max-h-[380px] min-w-0 max-w-full overflow-y-auto overflow-x-hidden pr-1">
                    {storyBlocks.map((block, index) => {
                      const isActive = mode === "ai" && index === currentWritingSection && index < storyBlocks.length
                      const isDone =
                        mode === "ai" ? index < currentWritingSection || !!block.text.trim() : !!block.text.trim()
                      return (
                        <div key={block.sectionName} className="space-y-1 min-w-0 max-w-full">
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
                              className="min-h-[80px] min-w-0 max-w-full overflow-hidden break-words p-3 text-sm whitespace-pre-wrap transition-all duration-300"
                              style={{
                                background: isActive ? "#f5e6c8" : isDone ? "#d4e8b4" : "#e8dcc0",
                                border: `3px solid ${isActive ? "#c4a020" : isDone ? "#5a9a32" : "#8b6914"}`,
                                color: isDone ? "#5a4a2a" : "#8b6914",
                                fontStyle: block.text ? "normal" : "italic",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                              }}
                            >
                              {block.text ||
                                (isActive
                                  ? index === storyBlocks.length - 1
                                    ? "Finish Story only counts text saved here. After Great job!, tap Continue to move your pad writing to this box."
                                    : "Text stays in the Writing Pad until you tap Next Section."
                                  : "Not written yet")}
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
                      : "Talk with the AI to summarize your plot."}
                  </div>
                )}

                {/* Footer stats + Finish */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "3px solid #8b6914" }}>
                  <div className="text-xs font-bold" style={{ color: "#6b5210" }}>
                    Words: <span style={{ color: "#5a4a2a" }}>{totalWords}</span>
                    {storyBlocks.length > 0 && (
                      <>
                        {" | "}Sections: <span style={{ color: "#5a4a2a" }}>{sectionsProgressCount}/{storyBlocks.length}</span>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleFinishStory}
                    disabled={storyBlocks.length === 0 || totalWords === 0 || !everySectionHasContentForFinish}
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
