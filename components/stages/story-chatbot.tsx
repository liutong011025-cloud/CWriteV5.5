"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"

import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentLevel } from "@/lib/current-level"
import { sanitizeStoryAssistantText } from "@/lib/story-meta"
import { cn } from "@/lib/utils"

type StoryChatPhase = "plot" | "structure" | "writing"
type StoryMode = "ai" | "manual"
type PlotState = NonNullable<StoryState["plot"]>
type StructureState = NonNullable<StoryState["structure"]>
type StructureType = StructureState["type"]

interface StoryChatbotProps {
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

interface ChatMessage {
  id: string
  role: "assistant" | "user"
  content: string
  phase: StoryChatPhase
  suggestions?: string[]
}

interface DifyChatResponse {
  answer?: string
  conversation_id?: string
  error?: string
  message?: string
}

interface PlotSummaryResponse {
  summary?: string
  conversation_id?: string
  error?: string
  needsMoreConversation?: boolean
}

interface StoryExample {
  structure_type: StructureType
  story: string
  imageUrl: string
}

interface StructureExamplesResponse {
  error?: string
  freytag?: { story?: string; structure_type?: string }
  threeAct?: { story?: string; structure_type?: string }
  fichtean?: { story?: string; structure_type?: string }
}

interface WritingEvaluationResponse {
  evaluation?: string
  done?: boolean
  error?: string
  message?: string
  secretCodeDetected?: boolean
  gibberishDetected?: boolean
}

const EMPTY_PLOT: PlotState = {
  setting: "",
  conflict: "",
  goal: "",
}

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

const composeStoryFromSections = (sections: string[], sectionTexts: Record<number, string>) =>
  sections
    .map((section, index) => `${section}:\n${(sectionTexts[index] || "").trim()}`.trimEnd())
    .join("\n\n")
    .trim()

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const parseStoryIntoSections = (story: string, sections: string[]): Record<number, string> => {
  if (!story.trim() || sections.length === 0) return {}

  const parsed: Record<number, string> = {}
  const blocks = story.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  for (const block of blocks) {
    const [header, ...rest] = block.split(/\n/)
    const normalizedHeader = header.trim().replace(/:$/, "")
    const sectionIndex = sections.findIndex((section) => section.toLowerCase() === normalizedHeader.toLowerCase())
    if (sectionIndex >= 0) {
      parsed[sectionIndex] = rest.join("\n").trim()
    }
  }

  if (Object.keys(parsed).length > 0) return parsed

  sections.forEach((section, index) => {
    const nextHeaders = sections.slice(index + 1).map((value) => `${escapeRegExp(value)}:`).join("|")
    const pattern = nextHeaders
      ? new RegExp(`${escapeRegExp(section)}:\\s*\\n([\\s\\S]*?)(?=\\n\\n(?:${nextHeaders})|$)`, "i")
      : new RegExp(`${escapeRegExp(section)}:\\s*\\n([\\s\\S]*)$`, "i")
    const match = story.match(pattern)
    if (match?.[1]) {
      parsed[index] = match[1].trim()
    }
  })

  if (Object.keys(parsed).length > 0) return parsed

  return story.trim() ? { 0: story.trim() } : {}
}

const cleanAiDisplayText = (text: string) =>
  sanitizeStoryAssistantText(text)
    .replace(/The plot is getting clearer![\s\S]*?talk about\?/gi, "")
    .replace(/故事情节已经比较清晰了[，,]?\s*还想再聊些什么吗[？?]?/g, "")
    .replace(/Great choice!?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()

const extractLastSixWords = (text: string): { words: string[]; cleanedText: string } => {
  const normalized = text.replace(/\r/g, "").trim()

  const trimQuestionTail = (input: string) => {
    const qIndex = input.indexOf("?")
    return qIndex >= 0 ? input.slice(0, qIndex + 1).trim() : input.trim()
  }

  const optionsMatch = normalized.match(/(?:^|\n)\s*OPTIONS\s*:\s*([^\n]+)/i)
  if (optionsMatch) {
    const words = (optionsMatch[1].match(/[A-Za-z]+/g) || []).map((word) => word.toLowerCase()).slice(0, 6)
    const cleanedText = trimQuestionTail(normalized.replace(optionsMatch[0], "").trim())
    return { words, cleanedText }
  }

  const lastPunctuationIndex = Math.max(
    normalized.lastIndexOf("."),
    normalized.lastIndexOf("?"),
    normalized.lastIndexOf("!"),
    normalized.lastIndexOf("。"),
    normalized.lastIndexOf("？"),
    normalized.lastIndexOf("！"),
  )

  const textAfterPunctuation =
    lastPunctuationIndex >= 0 ? normalized.slice(lastPunctuationIndex + 1).trim() : normalized.trim()

  const words = textAfterPunctuation
    .split(/\s+|[,，、]/)
    .map((word) => word.replace(/[,，、]/g, "").trim())
    .filter(Boolean)

  if (words.length <= 6) {
    const cleanedText = lastPunctuationIndex >= 0 ? normalized.slice(0, lastPunctuationIndex + 1).trim() : ""
    return { words, cleanedText }
  }

  return {
    words: words.slice(-6),
    cleanedText: normalized.slice(0, lastPunctuationIndex + 1).trim(),
  }
}

const getInitialPhase = (storyState: StoryState): StoryChatPhase => {
  if (!storyState.plot) return "plot"
  if (!storyState.structure) return "structure"
  return "writing"
}

const getStructureByType = (type: StructureType) => STRUCTURES.find((item) => item.type === type) || STRUCTURES[0]

const summarizePlotField = (field: keyof PlotState, rawValue: string) => {
  const normalized = rawValue.trim().replace(/\s+/g, " ")
  if (!normalized || normalized.toLowerCase() === "unknown") return ""

  const tokens = normalized.toLowerCase().split(/\s+/).filter(Boolean)
  const wordCount = normalized.split(/\s+/).length
  const startsLikeSentence =
    /^[A-Z]/.test(normalized) || /^(in|at|on|inside|during|while|because|when|to|wants?|needs?|tries?)\b/i.test(normalized)

  if (wordCount >= 3 || startsLikeSentence) return normalized
  if (field === "setting") return `in a ${normalized}`
  if (field === "conflict") {
    const mapping: Record<string, string> = {
      danger: "is in danger",
      trouble: "is in trouble",
      thief: "is chased by a thief",
      monster: "is threatened by a monster",
      fire: "must escape a fire",
      storm: "gets trapped in a storm",
      lost: "gets lost",
      broken: "finds something broken",
    }
    return mapping[tokens[0]] || `has a problem with ${normalized}`
  }
  if (field === "goal") {
    const actionWords = new Set(["find", "save", "help", "protect", "escape", "win", "discover", "fix", "learn", "solve", "rescue"])
    if (wordCount === 1 && actionWords.has(tokens[0])) return `wants to ${tokens[0]}`
    return `wants to ${normalized}`
  }
  return normalized
}

const parsePlotSummary = (summary: string): Partial<PlotState> => {
  const getValue = (field: "setting" | "conflict" | "goal") => {
    const match = summary.match(new RegExp(`^\\s*${field}[：:]\\s*(.+)$`, "im"))
    return match?.[1]?.trim() || ""
  }

  const setting = summarizePlotField("setting", getValue("setting"))
  const conflict = summarizePlotField("conflict", getValue("conflict"))
  const goal = summarizePlotField("goal", getValue("goal"))

  return {
    setting,
    conflict,
    goal,
  }
}

export default function StoryChatbot({
  language,
  storyState,
  mode,
  onPlotCreate,
  onStructureSelect,
  onStoryWrite,
  onBack,
  userId,
  onDraftChange,
}: StoryChatbotProps) {
  const initialPhase = useMemo(() => getInitialPhase(storyState), [storyState])
  const [phase, setPhase] = useState<StoryChatPhase>(initialPhase)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [plotThread, setPlotThread] = useState<ChatMessage[]>([])
  const [plotInput, setPlotInput] = useState("")
  const [plotLoading, setPlotLoading] = useState(false)
  const [plotConversationId, setPlotConversationId] = useState<string | null>(null)
  const [plotSummaryConversationId, setPlotSummaryConversationId] = useState<string | null>(null)
  const [plotData, setPlotData] = useState<PlotState>(storyState.plot ?? EMPTY_PLOT)
  const [structureExamples, setStructureExamples] = useState<StoryExample[]>([])
  const [structureExamplesLoading, setStructureExamplesLoading] = useState(false)
  const [selectedStructureType, setSelectedStructureType] = useState<StructureType | null>(storyState.structure?.type ?? null)
  const [currentSection, setCurrentSection] = useState(0)
  const writingTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>(() =>
    parseStoryIntoSections(storyState.story || "", storyState.structure?.outline || []),
  )
  const [sectionDone, setSectionDone] = useState<Record<number, boolean>>(() => {
    if (mode === "manual" && storyState.structure?.outline?.length) {
      const parsed = parseStoryIntoSections(storyState.story || "", storyState.structure.outline)
      return storyState.structure.outline.reduce<Record<number, boolean>>((acc, _, index) => {
        acc[index] = Boolean(parsed[index]?.trim())
        return acc
      }, {})
    }
    return {}
  })
  const [writingFeedback, setWritingFeedback] = useState<Record<number, string>>({})
  const [writingLoading, setWritingLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatWasNearBottomRef = useRef(true)
  const messageCounterRef = useRef(0)
  const bootstrappedRef = useRef(false)

  const activeStructureDefinition = useMemo(() => {
    if (selectedStructureType) return getStructureByType(selectedStructureType)
    if (storyState.structure?.type) return getStructureByType(storyState.structure.type)
    return null
  }, [selectedStructureType, storyState.structure])

  const sections = activeStructureDefinition?.outline || storyState.structure?.outline || []
  const plotComplete = Boolean(
    plotData.setting.trim() && plotData.conflict.trim() && plotData.goal.trim(),
  )
  const plotProgressCount = [plotData.setting, plotData.conflict, plotData.goal].filter((value) => value.trim()).length
  const draftWordCount = useMemo(
    () => countWords(sections.map((_, index) => sectionTexts[index] || "").join(" ")),
    [sectionTexts, sections],
  )
  const minimumWords = mode === "ai" ? 20 : 50
  const currentSectionText = sectionTexts[currentSection] || ""
  const currentFeedback = writingFeedback[currentSection] || ""
  const plotReplyPlaceholder =
    language === "zh"
      ? "回复聊天机器人，或点选上方建议词。"
      : "Reply to the chatbot or tap one of the suggestion chips above."
  const settingPlaceholder =
    language === "zh" ? "故事发生在哪里？" : "Where does the story happen?"
  const conflictPlaceholder =
    language === "zh" ? "角色遇到什么问题？" : "What problem appears?"
  const goalPlaceholder =
    language === "zh" ? "角色想达成什么目标？" : "What does the character want?"

  const nextMessageId = () => {
    messageCounterRef.current += 1
    return `story-chatbot-${messageCounterRef.current}`
  }

  const appendMessage = (message: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: nextMessageId() }])
  }

  const appendPlotMessages = (newMessages: Array<Omit<ChatMessage, "id">>) => {
    const hydrated = newMessages.map((message) => ({ ...message, id: nextMessageId() }))
    setMessages((prev) => [...prev, ...hydrated])
    setPlotThread((prev) => [...prev, ...hydrated])
    return hydrated
  }

  const scrollToBottom = () => {
    const container = chatContainerRef.current
    if (!container) return
    if (container.scrollHeight <= container.clientHeight + 2) return
    if (!chatWasNearBottomRef.current) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  useEffect(() => {
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true

      if (initialPhase === "plot") {
        if (mode === "ai") {
          void sendInitialPlotMessage()
        } else {
          appendMessage({
            role: "assistant",
            phase: "plot",
            content: "Let's build your plot. Fill in the setting, conflict, and goal, then we will move on to the story structure.",
          })
        }
      } else if (initialPhase === "structure") {
        appendMessage({
          role: "assistant",
          phase: "structure",
          content: "Your plot is ready. Choose a story structure, or ask for AI examples before you decide.",
        })
      } else {
        const firstSection = sections[0] || "first section"
        appendMessage({
          role: "assistant",
          phase: "writing",
          content: `Your structure is ready. Start with the "${firstSection}" section.`,
        })
      }
    }
  }, [initialPhase, mode, sections])

  useEffect(() => {
    if (!onDraftChange) return
    const draft = sections.map((_, index) => sectionTexts[index] || "").join(" ").trim()
    onDraftChange(draft)
  }, [onDraftChange, sectionTexts, sections])

  const requestJson = async <T,>(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; data: T }> => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const data = (await response.json().catch(() => ({}))) as T
      return { ok: response.ok, data }
    } catch {
      return { ok: false, data: {} as T }
    }
  }

  function buildPlotInitialPrompt() {
    const character = storyState.character
    if (character) {
      const characterInfo = [
        `Character name: ${character.name}`,
        character.species ? `Species: ${character.species}` : "",
        character.traits.length > 0 ? `Traits: ${character.traits.join(", ")}` : "",
        character.description ? `Description: ${character.description}` : "",
      ]
        .filter(Boolean)
        .join("\n")

      return `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation.
Answer in English only.

Here's the character information the student created:
${characterInfo}

IMPORTANT: Always refer to the character by their name "${character.name}", not "your character".

Start by asking: "Where does ${character.name}'s story take place?"

Continue guiding the student step by step. Each response should:
- Use proper punctuation.
- Output exactly two lines.
- Line 1: one short question ending with "?"
- Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- End with exactly six single words.
- Do not output congratulations or Chinese.`
    }

    return `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation.
Answer in English only.

Start by asking: "Where does this story take place?"

Continue guiding step by step. Each response should:
- Use proper punctuation.
- Output exactly two lines.
- Line 1: one short question ending with "?"
- Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- End with exactly six single words.
- Do not output congratulations or Chinese.`
  }

  async function sendInitialPlotMessage() {
    setPlotLoading(true)
    const { ok, data } = await requestJson<DifyChatResponse>("/api/dify-chat", {
      message: buildPlotInitialPrompt(),
      conversation_id: plotConversationId,
      user_id: userId || "default-user",
    })

    setPlotLoading(false)
    if (!ok || data.error) {
      toast.error(data.error || data.message || "Failed to start plot chat")
      appendMessage({
        role: "assistant",
        phase: "plot",
        content: "The AI guide is unavailable right now. You can still fill in the plot fields below.",
      })
      return
    }

    const aiMessage = cleanAiDisplayText(data.answer || "Let's begin with the plot.")
    const { words, cleanedText } = extractLastSixWords(aiMessage)
    appendPlotMessages([
      {
        role: "assistant",
        phase: "plot",
        content: cleanedText || aiMessage,
        suggestions: words,
      },
    ])
    if (data.conversation_id) {
      setPlotConversationId(data.conversation_id)
    }
  }

  async function summarizePlot(messageHistory: ChatMessage[]) {
    const conversationHistory = messageHistory.map((message) => ({
      role: message.role,
      content: message.content,
    }))

    const { ok, data } = await requestJson<PlotSummaryResponse>("/api/dify-plot-summary", {
      conversation_history: conversationHistory,
      conversation_id: plotSummaryConversationId || undefined,
      user_id: userId || "default-user",
    })

    if (!ok || data.error || data.needsMoreConversation || !data.summary) return
    if (data.conversation_id) {
      setPlotSummaryConversationId(data.conversation_id)
    }

    const parsed = parsePlotSummary(data.summary)
    setPlotData((prev) => ({
      setting: parsed.setting || prev.setting,
      conflict: parsed.conflict || prev.conflict,
      goal: parsed.goal || prev.goal,
    }))
  }

  async function handleSendPlotMessage(customText?: string) {
    const messageText = (customText ?? plotInput).trim()
    if (!messageText || plotLoading) return

    const userMessage: Omit<ChatMessage, "id"> = {
      role: "user",
      phase: "plot",
      content: messageText,
    }
    const nextPlotThread = [...plotThread, { ...userMessage, id: `preview-${plotThread.length + 1}` }]

    appendPlotMessages([userMessage])
    setPlotInput("")
    setPlotLoading(true)

    const history = plotThread.map((message) => ({
      role: message.role,
      content: message.content,
    }))

    const { ok, data } = await requestJson<DifyChatResponse>("/api/dify-chat", {
      message: messageText,
      history,
      conversation_id: plotConversationId,
      user_id: userId || "default-user",
    })

    setPlotLoading(false)
    if (!ok || data.error) {
      toast.error(data.error || data.message || "Failed to send plot message")
      return
    }

    const aiMessage = cleanAiDisplayText(data.answer || "")
    const { words, cleanedText } = extractLastSixWords(aiMessage)
    const appended = appendPlotMessages([
      {
        role: "assistant",
        phase: "plot",
        content: cleanedText || aiMessage,
        suggestions: words,
      },
    ])

    if (data.conversation_id) {
      setPlotConversationId(data.conversation_id)
    }

    const updatedThread = [...nextPlotThread, appended[0]]
    void summarizePlot(updatedThread)
  }

  function saveInteraction(stage: "plot" | "structure", input: Record<string, unknown>, output: Record<string, unknown>) {
    if (!userId) return
    void fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        stage,
        input,
        output,
      }),
    }).catch(() => {
      // ignore background persistence errors in MVP shell
    })
  }

  function handleConfirmPlot() {
    if (!plotComplete) {
      toast.error("Please complete setting, conflict, and goal before continuing.")
      return
    }

    const nextPlot: PlotState = {
      setting: plotData.setting.trim(),
      conflict: plotData.conflict.trim(),
      goal: plotData.goal.trim(),
    }

    onPlotCreate(nextPlot)
    saveInteraction(
      "plot",
      {
        character: storyState.character,
        messages: plotThread.map((message) => ({ role: message.role, content: message.content })),
      },
      { plot: nextPlot },
    )

    setSelectedStructureType(null)
    setStructureExamples([])
    setSectionTexts({})
    setSectionDone({})
    setWritingFeedback({})
    setCurrentSection(0)
    appendMessage({
      role: "assistant",
      phase: "structure",
      content: "Nice. Your plot is ready. Choose a story structure next.",
    })
    setPhase("structure")
  }

  const structureImagePrompt = useMemo(() => {
    const character = storyState.character
    const speciesInfo = character?.species
      ? character.species === "Boy" || character.species === "Girl"
        ? `a young ${character.species.toLowerCase()}`
        : `a ${character.species.toLowerCase()}`
      : "a character"

    return `A charming illustration for a children's story: ${speciesInfo} named ${character?.name || "a character"} in ${plotData.setting || "a setting"}, ${plotData.conflict || "facing a challenge"}. Colorful, friendly, and suitable for children.`
  }, [plotData.conflict, plotData.setting, storyState.character])

  async function handleGenerateStructureExamples() {
    if (mode !== "ai" || structureExamplesLoading) return

    setStructureExamplesLoading(true)
    appendMessage({
      role: "assistant",
      phase: "structure",
      content: "I am preparing three example stories for your plot. This may take a moment.",
    })

    const { ok, data } = await requestJson<StructureExamplesResponse>("/api/dify-structure-examples", {
      character: storyState.character,
      plot: plotData,
      user_id: userId || "default-user",
      generate_all: true,
      level: getCurrentLevel(),
    })

    if (!ok || data.error) {
      setStructureExamplesLoading(false)
      toast.error(data.error || "Failed to generate structure examples")
      return
    }

    const generated: StoryExample[] = []
    const items: Array<{ type: StructureType; story?: string }> = [
      { type: "freytag", story: data.freytag?.story },
      { type: "threeAct", story: data.threeAct?.story },
      { type: "fichtean", story: data.fichtean?.story },
    ]

    for (const item of items) {
      let imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.type}`
      const imageResult = await requestJson<{ imageUrl?: string }>("/api/generate-image", {
        prompt: structureImagePrompt,
        aspect_ratio: "16:9",
        user_id: userId,
        stage: "structure",
      })

      if (imageResult.ok && imageResult.data.imageUrl) {
        imageUrl = imageResult.data.imageUrl
      }

      generated.push({
        structure_type: item.type,
        story:
          item.story ||
          `Once upon a time, ${storyState.character?.name || "a hero"} faced ${plotData.conflict || "a problem"} in ${plotData.setting || "a magical place"} and worked hard to ${plotData.goal || "reach a goal"}.`,
        imageUrl,
      })
    }

    setStructureExamples(generated)
    setStructureExamplesLoading(false)
  }

  function handleSelectStructure(type: StructureType) {
    const structure = getStructureByType(type)
    const example = structureExamples.find((item) => item.structure_type === type)
    const selected: StructureState = {
      type: structure.type,
      outline: structure.outline,
      imageUrl: example?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${structure.type}`,
    }

    setSelectedStructureType(type)
    setCurrentSection(0)
    setSectionTexts({})
    setSectionDone({})
    setWritingFeedback({})
    onStructureSelect(selected)
    saveInteraction("structure", { character: storyState.character, plot: plotData }, { structure: selected })
    appendMessage({
      role: "assistant",
      phase: "writing",
      content: `Good choice. Start writing the "${selected.outline[0]}" section first.`,
    })
    setPhase("writing")
  }

  function handleSectionTextChange(sectionIndex: number, value: string, textarea: HTMLTextAreaElement | null) {
    setSectionTexts((prev) => ({
      ...prev,
      [sectionIndex]: value,
    }))

    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    if (mode === "manual") {
      setSectionDone((prev) => ({
        ...prev,
        [sectionIndex]: value.trim().length > 0,
      }))
    }
  }

  function handleSectionNavigate(targetIndex: number) {
    if (targetIndex === currentSection) return
    if (targetIndex > currentSection) {
      for (let index = currentSection; index < targetIndex; index += 1) {
        if (!sectionDone[index]) {
          toast.error(`Please finish the "${sections[index]}" section first.`)
          return
        }
      }
    }
    setCurrentSection(targetIndex)
  }

  async function handleCheckCurrentSection() {
    if (!sections[currentSection]) return

    const text = currentSectionText.trim()
    if (!text) {
      toast.error("Write something for this section first.")
      return
    }

    if (mode === "manual") {
      setSectionDone((prev) => ({
        ...prev,
        [currentSection]: true,
      }))
      const feedback = `The "${sections[currentSection]}" section is filled. You can move on when you are ready.`
      setWritingFeedback((prev) => ({
        ...prev,
        [currentSection]: feedback,
      }))
      appendMessage({
        role: "assistant",
        phase: "writing",
        content: feedback,
      })
      return
    }

    setWritingLoading(true)
    const { ok, data } = await requestJson<WritingEvaluationResponse>("/api/dify-writing-evaluation", {
      text,
      character: storyState.character,
      plot: plotData,
      structure: {
        type: activeStructureDefinition?.type,
        outline: sections,
      },
      current_section: currentSection,
      user_id: userId || "default-user",
      level: getCurrentLevel(),
    })
    setWritingLoading(false)

    const evaluationText =
      data.evaluation ||
      data.message ||
      data.error ||
      "The writing coach could not finish this check. Please try again."

    setWritingFeedback((prev) => ({
      ...prev,
      [currentSection]: evaluationText,
    }))
    appendMessage({
      role: "assistant",
      phase: "writing",
      content: evaluationText,
    })

    if (!ok || data.error) {
      toast.error(data.error || data.message || "Could not check this section")
      return
    }

    const passed =
      Boolean(data.done) ||
      Boolean(data.secretCodeDetected) ||
      /you can move on to the next part of your writing!/i.test(evaluationText)

    if (passed && !data.gibberishDetected) {
      setSectionDone((prev) => ({
        ...prev,
        [currentSection]: true,
      }))
    }
  }

  function handleAdvanceSection() {
    if (!sectionDone[currentSection]) {
      toast.error(`Please finish the "${sections[currentSection]}" section first.`)
      return
    }

    if (currentSection >= sections.length - 1) return
    const nextIndex = currentSection + 1
    setCurrentSection(nextIndex)
    appendMessage({
      role: "assistant",
      phase: "writing",
      content: `Now write the "${sections[nextIndex]}" section.`,
    })
  }

  function handleFinishStory() {
    const allSectionsReady = sections.every((_, index) =>
      mode === "ai" ? Boolean(sectionDone[index]) : Boolean(sectionTexts[index]?.trim()),
    )

    if (!allSectionsReady) {
      toast.error("Please complete every section before finishing the story.")
      return
    }

    if (draftWordCount < minimumWords) {
      toast.error(`Your story needs at least ${minimumWords} words.`)
      return
    }

    onStoryWrite(composeStoryFromSections(sections, sectionTexts))
  }

  function handleBackClick() {
    if (phase === "writing") {
      setPhase("structure")
      return
    }
    if (phase === "structure") {
      setPhase("plot")
      return
    }
    onBack()
  }

  const phaseTitle =
    phase === "plot" ? "Build Your Plot" : phase === "structure" ? "Choose Story Structure" : "Write Your Story"
  const stageNumber = phase === "plot" ? 2 : phase === "structure" ? 3 : 4

  return (
    <div
      className="min-h-screen py-8 px-6 relative pixel-theme overflow-hidden"
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
      <div className="max-w-7xl mx-auto relative z-10 px-2">
        <StageHeader
          stage={stageNumber}
          title={phaseTitle}
          onBack={handleBackClick}
          character={storyState.character?.name || undefined}
        />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-8">
            <div className="pixel-panel overflow-hidden">
              <div ref={chatContainerRef} className="h-[560px] overflow-y-auto p-6 space-y-4" style={{ background: "#f5e6c8" }}>
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[82%] px-5 py-4",
                        message.role === "user"
                          ? "pixel-btn-green"
                          : "pixel-card",
                      )}
                      style={message.role === "user" ? { color: "#fff" } : { color: "#5a4a2a", background: "#fff" }}
                    >
                      <div className="prose prose-base max-w-none prose-p:my-1 prose-headings:text-inherit prose-p:text-inherit prose-ul:text-inherit prose-ol:text-inherit prose-strong:text-inherit prose-em:text-inherit prose-code:text-inherit [&_pre]:bg-[#5a4a2a] [&_pre]:text-[#f5e6c8] [&_pre]:p-3 [&_pre]:text-sm [&_code]:bg-[#e8c547]/30 [&_code]:text-[#5a4a2a] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:before:content-none [&_code]:after:content-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                      {phase === "plot" && message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={`${message.id}-${suggestion}`}
                              type="button"
                              onClick={() => void handleSendPlotMessage(suggestion)}
                              className="pixel-btn pixel-btn-wood px-3 py-1 text-xs font-bold"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(plotLoading || structureExamplesLoading || writingLoading) && (
                  <div className="flex justify-start">
                    <div className="pixel-card px-4 py-3 space-y-1" style={{ background: "#fff" }}>
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#7ec850" }} />
                      <p className="text-xs" style={{ color: "#9a7b4f" }}>thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6" style={{ background: "#e8d4a8", borderTop: "4px solid #8b6914" }}>
                {phase === "plot" && (
                  <div className="space-y-4">
                    {mode === "ai" && (
                      <div className="flex gap-3">
                        <Input
                          value={plotInput}
                          onChange={(event) => setPlotInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault()
                              void handleSendPlotMessage()
                            }
                          }}
                          placeholder={plotReplyPlaceholder}
                          disabled={plotLoading}
                          className="flex-1 pixel-input"
                        />
                        <Button
                          type="button"
                          onClick={() => void handleSendPlotMessage()}
                          disabled={plotLoading || !plotInput.trim()}
                          className="pixel-btn pixel-btn-green"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Setting</label>
                        <Input
                          value={plotData.setting}
                          onChange={(event) => setPlotData((prev) => ({ ...prev, setting: event.target.value }))}
                          placeholder={settingPlaceholder}
                          className="pixel-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Conflict</label>
                        <Input
                          value={plotData.conflict}
                          onChange={(event) => setPlotData((prev) => ({ ...prev, conflict: event.target.value }))}
                          placeholder={conflictPlaceholder}
                          className="pixel-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Goal</label>
                        <Input
                          value={plotData.goal}
                          onChange={(event) => setPlotData((prev) => ({ ...prev, goal: event.target.value }))}
                          placeholder={goalPlaceholder}
                          className="pixel-input"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleConfirmPlot}
                      disabled={!plotComplete}
                      className="w-full pixel-btn pixel-btn-green"
                    >
                      Continue To Structure
                    </Button>
                  </div>
                )}

                {phase === "structure" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Pick the structure that best fits your plot.</p>
                        <p className="text-xs font-bold" style={{ color: "#8b6914" }}>You can choose directly, or ask AI to show examples first.</p>
                      </div>
                      {mode === "ai" && (
                        <Button
                          type="button"
                          onClick={() => void handleGenerateStructureExamples()}
                          disabled={structureExamplesLoading}
                          className="pixel-btn pixel-btn-blue"
                        >
                          <Sparkles className="h-4 w-4" />
                          Show Examples
                        </Button>
                      )}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-4">
                      {STRUCTURES.map((structure) => {
                        const example = structureExamples.find((item) => item.structure_type === structure.type)
                        const selected = selectedStructureType === structure.type
                        return (
                          <button
                            key={structure.type}
                            type="button"
                            onClick={() => handleSelectStructure(structure.type)}
                            className={cn(
                              "pixel-card p-5 text-left transition hover:-translate-y-0.5",
                              selected ? "pixel-selected" : "",
                            )}
                            style={{ background: selected ? "#e8c547" : "#fff" }}
                          >
                            <h3 className="text-lg font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>{structure.name}</h3>
                            <p className="mt-2 text-sm" style={{ color: "#6b5210" }}>{structure.desc}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {structure.outline.map((step) => (
                                <span
                                  key={`${structure.type}-${step}`}
                                  className="px-3 py-1 text-xs font-bold"
                                  style={{ background: "#7ec850", color: "#fff", border: "2px solid #5a9a32" }}
                                >
                                  {step}
                                </span>
                              ))}
                            </div>
                            {example && (
                              <div className="mt-4 space-y-3">
                                <img
                                  src={example.imageUrl}
                                  alt={`${structure.name} example`}
                                  className="h-32 w-full object-cover"
                                  style={{ border: "3px solid #8b6914" }}
                                />
                                <p className="text-xs leading-relaxed" style={{ color: "#6b5210" }}>{example.story}</p>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {phase === "writing" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {sections.map((section, index) => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => handleSectionNavigate(index)}
                          className={cn(
                            "px-4 py-2 text-sm font-bold transition pixel-btn",
                            currentSection === index
                              ? "pixel-btn-green"
                              : sectionDone[index]
                                ? "pixel-btn-blue"
                                : "pixel-btn-wood",
                          )}
                        >
                          {section}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>
                        {sections[currentSection] ? `Write: ${sections[currentSection]}` : "Write your story"}
                      </label>
                      <Textarea
                        ref={writingTextareaRef}
                        value={currentSectionText}
                        onChange={(event) => handleSectionTextChange(currentSection, event.target.value, event.target as HTMLTextAreaElement)}
                        placeholder={
                          sections[currentSection]
                            ? `Write the "${sections[currentSection]}" section here...`
                            : "Choose a structure first."
                        }
                        className="min-h-[220px] pixel-input"
                        disabled={sections.length === 0}
                      />
                    </div>

                    {currentFeedback && (
                      <div className="pixel-card px-4 py-3 text-sm whitespace-pre-wrap" style={{ background: "#87ceeb", color: "#2a4a5a", border: "3px solid #5bc0de" }}>
                        {currentFeedback}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={() => void handleCheckCurrentSection()}
                        disabled={writingLoading || sections.length === 0}
                        className="pixel-btn pixel-btn-blue"
                      >
                        {mode === "ai" ? "Check This Section" : "Mark Section Ready"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAdvanceSection}
                        disabled={currentSection >= sections.length - 1}
                        className="pixel-btn pixel-btn-wood"
                      >
                        Next Section
                      </Button>
                      <Button
                        type="button"
                        onClick={handleFinishStory}
                        disabled={sections.length === 0}
                        className="ml-auto pixel-btn pixel-btn-green"
                      >
                        Finish Story
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="pixel-panel p-6">
              <h3 className="text-lg font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Story Snapshot</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8b6914" }}>Character</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "#5a4a2a" }}>{storyState.character?.name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8b6914" }}>Setting</p>
                  <p className="mt-1 text-sm" style={{ color: "#6b5210" }}>{plotData.setting || "Waiting for idea..."}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8b6914" }}>Conflict</p>
                  <p className="mt-1 text-sm" style={{ color: "#6b5210" }}>{plotData.conflict || "Waiting for idea..."}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8b6914" }}>Goal</p>
                  <p className="mt-1 text-sm" style={{ color: "#6b5210" }}>{plotData.goal || "Waiting for idea..."}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8b6914" }}>Structure</p>
                  <p className="mt-1 text-sm" style={{ color: "#6b5210" }}>{activeStructureDefinition?.name || "Not chosen yet"}</p>
                </div>
              </div>
            </div>

            <div className="pixel-panel p-6">
              <h3 className="text-lg font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Progress</h3>
              {phase === "plot" && (
                <div className="mt-4 space-y-3">
                  <div className="h-3 w-full overflow-hidden" style={{ background: "#d9c9a6", border: "2px solid #8b6914" }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${Math.round((plotProgressCount / 3) * 100)}%`, background: "#7ec850" }}
                    />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#6b5210" }}>{plotProgressCount}/3 plot slots ready</p>
                </div>
              )}

              {phase === "structure" && (
                <div className="mt-4 space-y-3 text-sm" style={{ color: "#6b5210" }}>
                  <p>Select one structure card to unlock the writing phase.</p>
                  {structureExamples.length > 0 && <p>{structureExamples.length} example sets loaded.</p>}
                </div>
              )}

              {phase === "writing" && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-bold" style={{ color: "#6b5210" }}>
                    Sections ready: {sections.filter((_, index) => sectionDone[index]).length}/{sections.length}
                  </p>
                  <p className="text-sm font-bold" style={{ color: "#6b5210" }}>
                    Word count: {draftWordCount}/{minimumWords} minimum
                  </p>
                  <div className="space-y-2">
                    {sections.map((section, index) => (
                      <div key={`${section}-progress`} className="flex items-center justify-between text-sm">
                        <span style={{ color: "#5a4a2a" }}>{section}</span>
                        <span className="font-bold" style={{ color: sectionDone[index] ? "#7ec850" : "#8b6914" }}>
                          {sectionDone[index] ? "Ready" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {mode === "ai" && (
              <div className="pixel-panel p-6" style={{ background: "#e8c547" }}>
                <h3 className="text-lg font-extrabold" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>AI Mode</h3>
                <p className="mt-2 text-sm font-bold" style={{ color: "#6b5210" }}>
                  The chatbot helps collect plot ideas, can show structure examples, and checks each writing section before you move on.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
