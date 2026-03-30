"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

interface PlotBrainstormProps {
  language: Language
  character: StoryState["character"] | null
  onPlotCreate: (plot: StoryState["plot"]) => void
  onBack: () => void
  userId?: string
}

interface Message {
  role: "ai" | "user"
  content: string
  suggestions?: string[]
}

export default function PlotBrainstorm({ language, character, onPlotCreate, onBack, userId }: PlotBrainstormProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [plotData, setPlotData] = useState<{ setting: string; conflict: string; goal: string }>({
    setting: "",
    conflict: "",
    goal: "",
  })
  const [updatingFields, setUpdatingFields] = useState<Set<string>>(new Set())
  const [summaryConversationId, setSummaryConversationId] = useState<string | null>(null)
  const [summaryDone, setSummaryDone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const summaryNonceRef = useRef(0)

  useEffect(() => {
    sendInitialMessage()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    const container = chatContainerRef.current
    if (!container) return
    if (container.scrollHeight <= container.clientHeight) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    })
  }

  const extractLastSixWords = (text: string): { words: string[]; cleanedText: string } => {
    const normalized = text.replace(/\r/g, "").trim()
    const normalizeOptionWords = (tokens: string[]) => {
      if (tokens.length === 0) return []
      if (tokens.length === 6) return tokens

      // If model outputs six two-word phrases (12 tokens), keep the first word of each pair.
      if (tokens.length >= 12 && tokens.length % 2 === 0) {
        const pairFirstWords = tokens.filter((_, index) => index % 2 === 0).slice(0, 6)
        if (pairFirstWords.length === 6) return pairFirstWords
      }

      // Otherwise keep the first six tokens to avoid trailing noisy words.
      return tokens.slice(0, 6)
    }

    const trimQuestionTail = (input: string) => {
      const qIndex = input.indexOf("?")
      if (qIndex >= 0) return input.slice(0, qIndex + 1).trim()
      return input.trim()
    }

    const optionsMatch = normalized.match(/(?:^|\n)\s*OPTIONS\s*:\s*([^\n]+)/i)
    if (optionsMatch) {
      const optionTokens = (optionsMatch[1].match(/[A-Za-z]+/g) || []).map((w) => w.toLowerCase())
      const singleWordOptions = normalizeOptionWords(optionTokens)
      const cleanedText = trimQuestionTail(normalized.replace(optionsMatch[0], "").trim())
      if (singleWordOptions.length > 0) {
        return { words: singleWordOptions, cleanedText }
      }
      return { words: [], cleanedText }
    }

    const lastPunctuationIndex = Math.max(
      normalized.lastIndexOf("."),
      normalized.lastIndexOf("?"),
      normalized.lastIndexOf("!"),
      normalized.lastIndexOf("。"),
      normalized.lastIndexOf("？"),
      normalized.lastIndexOf("！")
    )
    const punctuationChar = lastPunctuationIndex >= 0 ? normalized[lastPunctuationIndex] : ""
    const textAfterPunctuation =
      lastPunctuationIndex >= 0 ? normalized.substring(lastPunctuationIndex + 1).trim() : normalized.trim()

    const words = textAfterPunctuation
      .split(/\s+|[,，、]/)
      .map((word) => word.replace(/[,，、]/g, "").trim())
      .filter((word) => word.length > 0)

    if (lastPunctuationIndex >= 0 && punctuationChar === "?") {
      return {
        words: words.slice(-6),
        cleanedText: trimQuestionTail(normalized.substring(0, lastPunctuationIndex + 1)),
      }
    }

    if (words.length <= 6) {
      const cleanedText = lastPunctuationIndex >= 0 ? normalized.substring(0, lastPunctuationIndex + 1).trim() : ""
      return { words, cleanedText }
    }

    const lastSix = words.slice(-6)
    const cleanedText =
      lastPunctuationIndex >= 0
        ? `${normalized.substring(0, lastPunctuationIndex + 1).trim()} ${words.slice(0, -6).join(" ").trim()}`
        : words.slice(0, -6).join(" ").trim()

    return { words: lastSix, cleanedText: cleanedText.trim() }
  }

  const cleanAiDisplayText = (text: string) =>
    text
      .replace(/The plot is getting clearer![\s\S]*?talk about\?/gi, "")
      .replace(/故事情节已经比较清晰了[，,]?\s*还想再聊些什么吗[？?]?/g, "")
      .replace(/Great choice!?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const postJsonWithRetry = async (
    url: string,
    body: Record<string, unknown>,
    maxAttempts = 3
  ): Promise<{ data: any; ok: boolean }> => {
    let lastError = "Request failed"
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok) return { data, ok: true }
        lastError = (typeof data?.error === "string" && data.error) || `HTTP ${response.status}`
        const retryable = response.status >= 500 || response.status === 429
        if (attempt < maxAttempts && retryable) {
          await sleep(attempt * 700)
          continue
        }
        return { data: { error: lastError }, ok: false }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Network error"
        if (attempt < maxAttempts) {
          await sleep(attempt * 700)
          continue
        }
      }
    }
    return { data: { error: lastError }, ok: false }
  }

  const sendInitialMessage = async () => {
    setIsLoading(true)
    try {
      let initialPrompt = ""
      if (character) {
        const characterInfo = [
          `Character name: ${character.name}`,
          character.species ? `Species: ${character.species}` : "",
          character.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(", ")}` : "",
          character.description ? `Description: ${character.description}` : "",
        ].filter(Boolean).join("\n")

        const characterName = character.name || "the character"
        const characterSpecies = character.species ? ` (a ${character.species})` : ""

        initialPrompt = `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation.
Answer in English only.

Here's the character information the student created:
${characterInfo}

IMPORTANT: Always refer to the character by their name "${characterName}"${characterSpecies ? ` (a ${character.species})` : ""}, NOT "your character" or "the character". Use "${characterName}" in your questions.

Start by asking: "Where does ${characterName}'s story take place?"

Continue guiding the student step by step. Each response should:
- Always use "${characterName}"${characterSpecies ? ` (the ${character.species})` : ""} in your questions, NOT "your character"
- Use proper punctuation (question marks, periods, etc.) in your questions - DO NOT remove punctuation
- Output exactly two lines:
  Line 1: one short question ending with "?"
  Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- End with exactly six SINGLE WORDS related to the current topic (space-separated, no commas, letters only)
- Each word must be a single word, not a phrase (e.g., "school home forest" not "magic school enchanted forest")
- Do NOT output completion/congratulation sentences.
- Do NOT output Chinese.

CRITICAL: Always use "${characterName}" in your questions. Always keep proper punctuation in your questions. End with exactly six SINGLE WORDS (space-separated, no commas).`
      } else {
        initialPrompt = `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation.
Answer in English only.

Start by asking: "Where does this story take place?"

Continue guiding step by step. Each response should:
- Use proper punctuation (question marks, periods, etc.) - DO NOT remove punctuation
- Output exactly two lines:
  Line 1: one short question ending with "?"
  Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- End with exactly six SINGLE WORDS (space-separated, no commas)
- Each word must be a single word, not a phrase
- Do NOT output completion/congratulation sentences.
- Do NOT output Chinese.`
      }

      const { data, ok } = await postJsonWithRetry("/api/dify-chat", {
        message: initialPrompt,
        conversation_id: conversationId,
        user_id: userId || "default-user",
      })

      if (!ok || data.error) {
        toast.error(data.error)
        return
      }

      const aiMessage = cleanAiDisplayText(data.answer || "Hello! Let's start brainstorming your plot.")
      const { words: suggestions, cleanedText } = extractLastSixWords(aiMessage)
      const initialMessages: Message[] = [{ role: "ai", content: cleanedText || aiMessage, suggestions }]
      setMessages(initialMessages)
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }
      
      // 初始消息是AI说的，不调用总结API
      // 只有在学生回答后才会调用总结API
    } catch (error) {
      console.error("Error sending initial message:", error)
      toast.error("Failed to start conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const { data, ok } = await postJsonWithRetry("/api/dify-chat", {
        message: messageText,
        conversation_id: conversationId,
        user_id: userId || "default-user",
      })

      if (!ok || data.error) {
        toast.error(data.error)
        setIsLoading(false)
        return
      }

      const aiMessage = cleanAiDisplayText(data.answer || "")
      const { words: suggestions, cleanedText } = extractLastSixWords(aiMessage)
      const updatedMessages = [...messages, userMessage, { role: "ai" as const, content: cleanedText || aiMessage, suggestions }]
      setMessages(updatedMessages)
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      // 保存对话内容到interactions API
      if (userId) {
        fetch("/api/interactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            stage: "plot",
            input: {
              messages: updatedMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            },
            output: {
              plotData: plotData,
            },
          }),
        }).catch((error) => {
          console.error("Error saving plot conversation:", error)
        })
      }

      // 只有在学生发送消息后，才调用总结API来提取Setting, Conflict, Goal
      // 需要学生多交流几个回合才总结，特别是 Conflict 和 Goal
      // 计算学生消息数量
      const studentMessageCount = updatedMessages.filter(msg => msg.role === 'user').length
      
      // 前6轮每轮都总结，确保尽快收敛出 Setting / Conflict / Goal；
      // 6轮后再降频到偶数轮，控制请求量。
      const shouldSummarizeNow = studentMessageCount <= 6 || studentMessageCount % 2 === 0
      if (shouldSummarizeNow) {
        await summarizePlot(updatedMessages)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const summarizePlot = async (messageHistory?: Message[]) => {
    const nonce = ++summaryNonceRef.current
    try {
      // 使用传入的消息历史，如果没有则使用当前messages
      const messagesToUse = messageHistory || messages
      
      // 只有当有对话历史时才调用总结API
      if (messagesToUse.length === 0) {
        console.log("No messages to summarize")
        return
      }

      const summarizeFieldValue = (field: "setting" | "conflict" | "goal", rawValue: string) => {
        const normalized = rawValue.trim().replace(/\s+/g, " ")
        if (!normalized) return normalized
        if (normalized.toLowerCase() === "unknown") return "unknown"
        const lower = normalized.toLowerCase()
        const tokens = lower.split(/\s+/).filter(Boolean)
        const wordCount = normalized.split(/\s+/).length
        const startsLikeSentence =
          /^[A-Z]/.test(normalized) ||
          /^(in|at|on|inside|during|while|because|when|to|wants?|needs?|tries?)\b/i.test(normalized)
        if (wordCount >= 3 || startsLikeSentence) return normalized
        if (field === "setting") return `in a ${normalized}`
        if (field === "conflict") {
          if (wordCount === 1) {
            const c = tokens[0]
            const mapped: Record<string, string> = {
              danger: "is in danger",
              dangerous: "is in danger",
              trouble: "is in trouble",
              thief: "is chased by a thief",
              monster: "is threatened by a monster",
              fire: "must escape a fire",
              storm: "gets trapped in a storm",
              noise: "is bothered by loud noise",
              dark: "is lost in the dark",
              sick: "gets sick",
              broken: "finds something broken",
              lost: "gets lost",
            }
            return mapped[c] || `has a problem with ${normalized}`
          }
          return `has a problem with ${normalized}`
        }
        // goal
        if (wordCount === 1) {
          const g = tokens[0]
          const actionWords = new Set(["find", "save", "help", "protect", "escape", "win", "discover", "investigate", "hide", "fix", "ask", "call", "tell", "learn", "solve", "rescue"])
          if (actionWords.has(g)) return `wants to ${g}`
          return `wants ${normalized}`
        }
        if (/^(a|an|the|this|that|these|those)\b/i.test(normalized)) {
          return `wants ${normalized}`
        }
        return `wants to ${normalized}`
      }
      
      // 构建对话历史（包含所有对话内容）
      const conversationHistory = messagesToUse.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      console.log("Calling plot summary API with", conversationHistory.length, "messages")

      const { data } = await postJsonWithRetry(
        "/api/dify-plot-summary",
        {
          conversation_history: conversationHistory,
          conversation_id: summaryConversationId || undefined,
          user_id: userId || "default-user",
        },
        2
      )

      console.log("Plot summary API response:", data)

      // 如果这不是最新一次总结请求，就直接丢弃（包括 conversation_id 也不更新）
      if (nonce !== summaryNonceRef.current) return

      // 保存总结机器人的conversation_id
      if (data.conversation_id && !summaryConversationId) {
        setSummaryConversationId(data.conversation_id)
      }

      if (data.error) {
        // 如果信息不足，总结API不会返回结果，这是正常的
        console.log("Plot summary not ready yet:", data.error)
        return
      }

      // 检查是否需要更多对话
      if (data.needsMoreConversation) {
        console.log("Plot summary needs more conversation")
        return
      }

      const summary = data.summary || ""
      
      // 如果这不是最新一次总结请求，就丢弃结果避免覆盖更新
      if (nonce !== summaryNonceRef.current) return

      console.log("Plot summary result:", summary)
      
      // 检查是否输出"done"
      if (summary.toLowerCase().includes("done")) {
        setSummaryDone(true)
        console.log("Summary done signal received")
      }
      
      // 解析总结结果，提取 setting / conflict / goal
      // 为了避免“永远提取不到”，这里做更强的容错：优先逐行匹配字段名，其次才回退到多行正则。
      const lines = summary
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)

      let extractedSetting: string | undefined
      let extractedConflict: string | undefined
      let extractedGoal: string | undefined

      for (const line of lines) {
        // setting / location / place
        const mSetting = line.match(/^(setting|location|place)[：:]\s*(.+)$/i)
        if (mSetting) extractedSetting = mSetting[2]?.trim()

        // conflict（容错：conflic / confilc / problem / challenge）
        const mConflict = line.match(/^(conflict|confilc|conflcit|problem|challenge)[：:]\s*(.+)$/i)
        if (mConflict) extractedConflict = mConflict[2]?.trim()

        // goal（容错：objective / aim / want）
        const mGoal = line.match(/^(goal|objective|aim|want)[：:]\s*(.+)$/i)
        if (mGoal) extractedGoal = mGoal[2]?.trim()
      }

      // 回退：仍然支持“setting: ... \n conflict: ...”这种多行结构
      const settingMatch = extractedSetting
        ? null
        : summary.match(/setting[：:]\s*([^\n\r]+?)(?=\n\s*(?:conflict|goal|done)|$)/i)
      const conflictMatch = extractedConflict
        ? null
        : summary.match(/conflict[：:]\s*([^\n\r]+?)(?=\n\s*(?:goal|done|$)|$)/i)
      const goalMatch = extractedGoal ? null : summary.match(/goal[：:]\s*([^\n\r]+?)(?=\n\s*(?:done|$)|$)/i)

      const settingValue = extractedSetting ?? settingMatch?.[1]
      const conflictValue = extractedConflict ?? conflictMatch?.[1]
      const goalValue = extractedGoal ?? goalMatch?.[1]

      console.log("Extracted matches:", {
        setting: settingValue,
        conflict: conflictValue,
        goal: goalValue,
      })

      if (settingValue && settingValue.trim()) {
        // 去掉可能的"setting:"前缀和多余空格（兼容偶发输出）
        let newSetting = settingValue.trim().replace(/^setting[：:]\s*/i, "").trim()
        newSetting = summarizeFieldValue("setting", newSetting)
        // Setting 允许单个单词，不进行长度检查
        if (newSetting && newSetting.toLowerCase() !== "unknown" && newSetting !== plotData.setting) {
          setUpdatingFields((prev) => new Set([...prev, "setting"]))
          // 允许 AI 结果覆盖/纠正本地兜底（只不覆盖 unknown）
          setPlotData((prev) => ({ ...prev, setting: newSetting }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("setting")
              return newSet
            })
          }, 1000)
        } else if (newSetting && newSetting.toLowerCase() === "unknown") {
          // Summary 可能会抽取失败返回 unknown；此处不覆盖已有值
        }
      }

      if (conflictValue && conflictValue.trim()) {
        // 去掉可能的"conflict:"前缀和多余空格（兼容偶发输出）
        let newConflict = conflictValue
          .trim()
          .replace(/^(conflict|confilc|problem|challenge)[：:]\s*/i, "")
          .replace(/\s+/g, " ")
          .trim()
        newConflict = summarizeFieldValue("conflict", newConflict)

        // Dify 有时只抽取到不完整片段（例如 "is lost"），这里做轻量“补句式”让展示更顺。
        if (/^(is|are)\s+lost$/i.test(newConflict)) {
          const subject = character?.name ? character.name : "the hero"
          newConflict = `${subject} is lost`
        }
        // 如果提取到内容且不是 "unknown"，就使用它（允许单个词或短句）
        if (newConflict && newConflict.toLowerCase() !== "unknown" && newConflict !== plotData.conflict) {
          setUpdatingFields((prev) => new Set([...prev, "conflict"]))
          // 允许 AI 结果覆盖/纠正本地兜底（只不覆盖 unknown）
          setPlotData((prev) => ({ ...prev, conflict: newConflict }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("conflict")
              return newSet
            })
          }, 1000)
        } else if (newConflict && newConflict.toLowerCase() === "unknown") {
          // Summary 可能会抽取失败返回 unknown；此处不覆盖已有值
        }
      }

      if (goalValue && goalValue.trim()) {
        // 去掉可能的"goal:"前缀和多余空格（兼容偶发输出）
        let newGoal = goalValue.trim().replace(/^(goal|objective|aim|want)[：:]\s*/i, "").trim()
        newGoal = summarizeFieldValue("goal", newGoal)
        // 如果提取到内容且不是 "unknown"，就使用它（允许单个词或短句）
        if (newGoal && newGoal.toLowerCase() !== "unknown" && newGoal !== plotData.goal) {
          setUpdatingFields((prev) => new Set([...prev, "goal"]))
          // 允许 AI 结果覆盖/纠正本地兜底（只不覆盖 unknown）
          setPlotData((prev) => ({ ...prev, goal: newGoal }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("goal")
              return newSet
            })
          }, 1000)
        } else if (newGoal && newGoal.toLowerCase() === "unknown") {
          // Summary 可能会抽取失败返回 unknown；此处不覆盖已有值
        }
      }
    } catch (error) {
      console.error("Error summarizing plot:", error)
      // 静默失败，不影响用户体验
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // 检查是否可以继续：三个字段都不能是unknown或空
  const canContinue =
    plotData.setting &&
    plotData.setting.toLowerCase() !== "unknown" &&
    plotData.conflict && 
    plotData.conflict.toLowerCase() !== "unknown" &&
    plotData.goal && 
    plotData.goal.toLowerCase() !== "unknown"

  // 只要三个要素都有明确内容，就允许进入下一步
  const canProceed = !!canContinue

  const progressCount = [plotData.setting, plotData.conflict, plotData.goal].reduce((acc, v) => {
    const ok = !!v && v.trim() !== "" && v.toLowerCase() !== "unknown"
    return acc + (ok ? 1 : 0)
  }, 0)
  const progressPct = Math.round((progressCount / 3) * 100)

  const handleContinue = () => {
    // 只检查三要素是否齐全且不是 unknown
    if (canProceed) {
      onPlotCreate(plotData)
    } else {
      toast.error("Please complete all plot fields (Setting, Conflict, Goal) before continuing")
    }
  }

  return (
    <div
      className="relative min-h-screen py-8 px-6 overflow-hidden pixel-theme"
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

      <div className="relative max-w-7xl mx-auto z-10">
        <StageHeader stage={2} title="Brainstorm Your Plot" onBack={onBack} character={character?.name} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-9">
            <div className="pixel-panel p-6">
              <div ref={chatContainerRef} className="h-[600px] overflow-y-auto mb-6 space-y-4 pr-4" style={{ background: "#f5e6c8" }}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 ${
                        message.role === "user"
                          ? "pixel-btn-green"
                          : "pixel-card"
                      }`}
                      style={{
                        border: message.role === "user" ? "3px solid #3d8a3d" : "3px solid #8b6914",
                        boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                        color: message.role === "user" ? "#fff" : "#5a4a2a",
                        background: message.role === "user" ? undefined : "#fff"
                      }}
                    >
                      <p className="text-base leading-relaxed">
                        {message.content}
                      </p>
                      {message.suggestions && message.suggestions.length > 0 && message.role === "ai" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, i) => {
                            const cleanSuggestion = suggestion.replace(/[,，、。.!?！？;；:：]/g, '').trim()
                            return (
                              <button
                                key={i}
                                onClick={() => handleSuggestionClick(cleanSuggestion)}
                                className="px-3 py-2 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                                style={{
                                  background: "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)",
                                  border: "3px solid #3d8a3d",
                                  boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2), 2px 2px 0 rgba(0,0,0,0.25)",
                                  color: "#fff",
                                  textShadow: "1px 1px 0 #3d8a3d"
                                }}
                              >
                                {cleanSuggestion}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="pixel-card p-4" style={{ background: "#fff", border: "3px solid #8b6914" }}>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 bg-[#7ec850] animate-bounce" style={{ border: "2px solid #5a9a32" }} />
                        <span className="h-3 w-3 bg-[#e8c547] animate-bounce" style={{ animationDelay: "150ms", border: "2px solid #c4a020" }} />
                        <span className="h-3 w-3 bg-[#87ceeb] animate-bounce" style={{ animationDelay: "300ms", border: "2px solid #5bc0de" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Choose one as answer or type your response here..."
                  className="flex-1 pixel-input"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="pixel-btn pixel-btn-green"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {canProceed && (
                <div className="mt-6 p-4 pixel-panel" style={{ background: "#d4e8b4", border: "4px solid #5a9a32" }}>
                  <p className="font-bold text-center mb-3" style={{ color: "#3d5a1f", textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}>
                    You can proceed to the next step, or continue chatting with AI to make your plot more accurate!
                  </p>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="w-full py-6 text-lg font-bold pixel-btn pixel-btn-green"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {/* Character panel */}
            {character?.imageUrl && (
              <div className="pixel-panel p-4">
                <h3 className="text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Your Character</h3>
                <div className="relative overflow-hidden" style={{ border: "3px solid #8b6914" }}>
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: "rgba(90,74,42,0.85)" }}>
                    <p className="font-bold text-sm" style={{ color: "#f5e6c8" }}>{character.name}</p>
                    {character.species && (
                      <p className="text-xs" style={{ color: "#d4c4a0" }}>{character.species}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Plot Progress */}
            <div className="pixel-panel p-6">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
                Plot Progress
              </h3>

              <div className="mb-5">
                <div className="h-4 w-full overflow-hidden" style={{ background: "#d9c9a6", border: "3px solid #8b6914" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)" }}
                  />
                </div>
                <p className="mt-2 text-xs text-center font-bold" style={{ color: "#6b5210" }}>
                  {progressCount}/3 unlocked
                </p>
              </div>

              <div className="space-y-4">
                <div className={`transition-all duration-500 ${updatingFields.has("setting") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ color: "#5a4a2a" }}>Setting</span>
                    {plotData.setting && (
                      <span className="w-3 h-3 animate-ping" style={{ background: "#7ec850", border: "2px solid #5a9a32" }}></span>
                    )}
                  </div>
                  <div className="p-3 transition-all duration-500" style={{
                    background: plotData.setting ? "#d4e8b4" : "#e8dcc0",
                    border: `3px solid ${plotData.setting ? "#5a9a32" : "#8b6914"}`,
                    boxShadow: plotData.setting ? "inset -2px -2px 0 rgba(0,0,0,0.1), inset 2px 2px 0 rgba(255,255,255,0.3)" : "none"
                  }}>
                    <p className="text-sm font-bold transition-all duration-500" style={{
                      color: plotData.setting && plotData.setting.toLowerCase() !== "unknown" ? "#3d5a1f" : "#8b6914"
                    }}>
                      {plotData.setting && plotData.setting.toLowerCase() !== "unknown" ? plotData.setting : "unknown"}
                    </p>
                  </div>
                </div>
                <div className={`transition-all duration-500 ${updatingFields.has("conflict") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ color: "#5a4a2a" }}>Conflict</span>
                    {plotData.conflict && (
                      <span className="w-3 h-3 animate-ping" style={{ background: "#e8c547", border: "2px solid #c4a020" }}></span>
                    )}
                  </div>
                  <div className="p-3 transition-all duration-500" style={{
                    background: plotData.conflict ? "#f5e6c8" : "#e8dcc0",
                    border: `3px solid ${plotData.conflict ? "#c4a020" : "#8b6914"}`,
                    boxShadow: plotData.conflict ? "inset -2px -2px 0 rgba(0,0,0,0.1), inset 2px 2px 0 rgba(255,255,255,0.3)" : "none"
                  }}>
                    <p className="text-sm font-bold transition-all duration-500" style={{
                      color: plotData.conflict && plotData.conflict.toLowerCase() !== "unknown" ? "#8b6914" : "#a59070"
                    }}>
                      {plotData.conflict && plotData.conflict.toLowerCase() !== "unknown" ? plotData.conflict : "unknown"}
                    </p>
                  </div>
                </div>
                <div className={`transition-all duration-500 ${updatingFields.has("goal") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ color: "#5a4a2a" }}>Goal</span>
                    {plotData.goal && (
                      <span className="w-3 h-3 animate-ping" style={{ background: "#87ceeb", border: "2px solid #5bc0de" }}></span>
                    )}
                  </div>
                  <div className="p-3 transition-all duration-500" style={{
                    background: plotData.goal ? "#c5e4f5" : "#e8dcc0",
                    border: `3px solid ${plotData.goal ? "#5bc0de" : "#8b6914"}`,
                    boxShadow: plotData.goal ? "inset -2px -2px 0 rgba(0,0,0,0.1), inset 2px 2px 0 rgba(255,255,255,0.3)" : "none"
                  }}>
                    <p className="text-sm font-bold transition-all duration-500" style={{
                      color: plotData.goal && plotData.goal.toLowerCase() !== "unknown" ? "#2a5a7a" : "#a59070"
                    }}>
                      {plotData.goal && plotData.goal.toLowerCase() !== "unknown" ? plotData.goal : "unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
