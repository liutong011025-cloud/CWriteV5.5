"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { getCurrentLevel } from "@/lib/current-level"

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
  grammarIssue?: string | null
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

  const sanitizeAiToEnglishOnly = (text: string): string => {
    // 去掉中文字符块，避免出现 “... (in Chinese: ...)” 或中英混排
    // 仅保留 ASCII 英文与常见英文标点/空白。
    const withoutChinese = text.replace(/[\u4e00-\u9fff]+[，。、！？]?\s*/g, " ")
    return withoutChinese.replace(/\s+/g, " ").trim()
  }

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
    const normalizedAll = text.trim()

    // 1) 首选：严格解析最后一行 OPTIONS: w1 w2 w3 w4 w5 w6
    const optionsMatch = normalizedAll.match(/OPTIONS\s*:\s*([A-Za-z]+(?:\s+[A-Za-z]+){5})\s*$/i)
    if (optionsMatch) {
      const optionsBody = optionsMatch[1] || ""
      const tokens = optionsBody
        .split(/\s+/)
        .map((t) => t.replace(/[^A-Za-z]/g, "").trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase())
      if (tokens.length === 6) {
        const cleanedText = normalizedAll.replace(optionsMatch[0], "").trim()
        return { words: tokens, cleanedText }
      }
    }

    // 2) 兜底：如果最后一行“恰好 6 个纯字母单词”，就当它是 options（但要避免把问题句子也当 options）
    const lines = normalizedAll.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : normalizedAll

    const lastLineTokens = lastLine
      .replace(/[.!?。！？]+$/g, "")
      .split(/\s+/)
      .map((t) => t.replace(/[^A-Za-z]/g, "").trim())
      .filter(Boolean)
      .map((t) => t.toLowerCase())

    const QUESTION_WORDS = new Set(["where", "does", "take", "place", "story"])
    const looksLikeQuestion = lastLineTokens.some((t) => QUESTION_WORDS.has(t))
    if (lastLineTokens.length === 6 && !looksLikeQuestion) {
      const cleanedText = normalizedAll.replace(new RegExp(`${lastLine.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*$`), "").trim()
      return { words: lastLineTokens, cleanedText }
    }

    // 3) 不符合 options 格式：为了不把“问题句子”当按钮，直接返回空按钮
    return { words: [], cleanedText: normalizedAll }
  }

  const extractGrammarIssue = (text: string): { grammarIssue: string | null; cleaned: string } => {
    const match = text.match(/\[GRAMMAR_ERROR\]([\s\S]*?)\[\/GRAMMAR_ERROR\]/i)
    if (!match) return { grammarIssue: null, cleaned: text }
    const issue = (match[1] || "").trim()
    const cleaned = text.replace(match[0], "").trim()
    return { grammarIssue: issue || "There is a grammar or spelling issue.", cleaned }
  }

  const sendInitialMessage = async () => {
    setIsLoading(true)
    try {
      let initialPrompt = ""
      if (character) {
        // 构建详细的角色信息
        const characterInfo = [
          `Character name: ${character.name}`,
          character.species ? `Species: ${character.species}` : "",
          character.description ? `Description: ${character.description}` : "",
        ].filter(Boolean).join("\n")

        // Cap prompt size to keep the first Dify response fast.
        const characterInfoCapped = characterInfo.length > 420 ? `${characterInfo.slice(0, 420)}...` : characterInfo
        
        // 新的设定：脑图机器人，面向小学生，六个单词收尾（保留标点符号，单词不用逗号）
        const characterName = character.name || "the character"
        const characterSpecies = character.species ? ` (a ${character.species})` : ""
        const characterReference = `${characterName}${characterSpecies}`
        
        initialPrompt = `You help elementary students brainstorm a plot mind map. Answer in English only.

Character info:
${characterInfoCapped}

Rules:
- Always use "${characterName}"${characterSpecies ? ` (a ${character.species})` : ""} in your questions.
- Never invent setting/conflict/goal the student did not say.
- Keep order: setting → conflict → goal.
- Be short and calm (1-2 sentences). No extra worldbuilding.

First message (before the student replies):
- Ask ONLY this question (no specific place): "Where does ${characterName}'s story take place?"

After the student answers setting:
- Briefly acknowledge their answer, then ask ONLY the conflict/problem.

After the student answers conflict:
- Briefly acknowledge their answer, then ask ONLY the goal/want.

Options (CRITICAL):
- Output EXACTLY TWO LINES:
  Line 1: your question (one short sentence, ends with ?)
  Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- Each wi must be a single English word (letters only, no spaces inside).
- These 6 words must be valid answer options for the question you just asked:
  - setting question: location words
  - conflict question: problem/challenge words
  - goal question: want/action words
- After w6, end immediately (no punctuation, no extra text).`
      } else {
        initialPrompt = `You help elementary students brainstorm a plot mind map. Answer in English only.

Rules:
- Never invent setting/conflict/goal the student did not say.
- Keep order: setting → conflict → goal.
- Be short and calm (1-2 sentences). No extra worldbuilding.

First message (before the student replies):
- Ask ONLY this question (no specific place): "Where does the story take place?"

After the student answers setting:
- Briefly acknowledge their answer, then ask ONLY the conflict/problem.

After the student answers conflict:
- Briefly acknowledge their answer, then ask ONLY the goal/want.

Options (CRITICAL):
- Output EXACTLY TWO LINES:
  Line 1: your question (one short sentence, ends with ?)
  Line 2: OPTIONS: w1 w2 w3 w4 w5 w6
- Each wi must be a single English word (letters only, no spaces inside).
- These 6 words must be valid answer options for the question you just asked:
  - setting question: location words
  - conflict question: problem/challenge words
  - goal question: want/action words
- After w6, end immediately (no punctuation, no extra text).`
      }

      const response = await fetch("/api/dify-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: initialPrompt,
          conversation_id: conversationId,
          user_id: userId || "default-user",
          level: getCurrentLevel(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      const aiMessage = data.answer || "Hello! Let's start brainstorming your plot."
      const sanitizedAiMessage = sanitizeAiToEnglishOnly(aiMessage)
      const { grammarIssue, cleaned } = extractGrammarIssue(sanitizedAiMessage)
      const { words: suggestions, cleanedText } = extractLastSixWords(cleaned)

      const initialMessages: Message[] = [
        { role: "ai", content: cleanedText || cleaned || sanitizedAiMessage, suggestions, grammarIssue },
      ]
      setMessages(initialMessages)
      setConversationId(data.conversation_id)
      
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
      const response = await fetch("/api/dify-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          user_id: userId || "default-user",
          level: getCurrentLevel(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        setIsLoading(false)
        return
      }

      const aiMessage = data.answer || ""
      const sanitizedAiMessage = sanitizeAiToEnglishOnly(aiMessage)
      const { grammarIssue, cleaned } = extractGrammarIssue(sanitizedAiMessage)
      const { words: suggestions, cleanedText } = extractLastSixWords(cleaned)

      const updatedMessages = [...messages, userMessage, { role: "ai" as const, content: cleanedText || cleaned || sanitizedAiMessage, suggestions, grammarIssue }]
      setMessages(updatedMessages)
      setConversationId(data.conversation_id)

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
      
      // 只在达到一定轮数时才总结
      if (studentMessageCount >= 1) {
        // 异步触发总结，避免用户感知聊天“变慢”
        summarizePlot(updatedMessages).catch((e) => {
          console.error("Plot summary failed:", e)
        })
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

      // 本地快速抽取：直接把前三次学生输入视为 setting/conflict/goal。
      // 这样可以保证 Plot Progress 不会因为 summary 抽取失败而一直显示 unknown。
      const studentValues = messagesToUse
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content.trim())
        .filter(Boolean)

      const normalizeByField = (value: string, field: "setting" | "conflict" | "goal"): string => {
        const cleaned = value
          .replace(new RegExp(`^(${field === "setting" ? "setting|location|place" : field === "conflict" ? "conflict|confilc|problem|challenge" : "goal|objective|aim|want"})[：:]\\s*`, "i"), "")
          .trim()
        return cleaned
      }

      if (studentValues.length >= 1) {
        const localSetting = normalizeByField(studentValues[0], "setting")
        if (localSetting && (!plotData.setting || plotData.setting.toLowerCase() === "unknown")) {
          setUpdatingFields((prev) => new Set([...prev, "setting"]))
          setPlotData((prev) => ({ ...prev, setting: localSetting }))
          setTimeout(() => setUpdatingFields((prev) => {
            const newSet = new Set(prev)
            newSet.delete("setting")
            return newSet
          }), 1000)
        }
      }
      if (studentValues.length >= 2) {
        const localConflict = normalizeByField(studentValues[1], "conflict")
        if (localConflict && (!plotData.conflict || plotData.conflict.toLowerCase() === "unknown")) {
          setUpdatingFields((prev) => new Set([...prev, "conflict"]))
          setPlotData((prev) => ({ ...prev, conflict: localConflict }))
          setTimeout(() => setUpdatingFields((prev) => {
            const newSet = new Set(prev)
            newSet.delete("conflict")
            return newSet
          }), 1000)
        }
      }
      if (studentValues.length >= 3) {
        const localGoal = normalizeByField(studentValues[2], "goal")
        if (localGoal && (!plotData.goal || plotData.goal.toLowerCase() === "unknown")) {
          setUpdatingFields((prev) => new Set([...prev, "goal"]))
          setPlotData((prev) => ({ ...prev, goal: localGoal }))
          setTimeout(() => setUpdatingFields((prev) => {
            const newSet = new Set(prev)
            newSet.delete("goal")
            return newSet
          }), 1000)
        }
      }
      
      // 构建对话历史（包含所有对话内容）
      // 后端只会读取 role==='user 的消息，但这里先裁掉 ai 消息可以减少 payload 加速
      const conversationHistory = messagesToUse
        .filter((msg) => msg.role === "user")
        .map((msg) => ({ role: msg.role, content: msg.content }))

      console.log("Calling plot summary API with", conversationHistory.length, "messages")

      const response = await fetch("/api/dify-plot-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          conversation_id: summaryConversationId || undefined,
          user_id: userId || "default-user",
          level: getCurrentLevel(),
        }),
      })

      const data = await response.json()

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
        // Setting 允许单个单词，不进行长度检查
        if (newSetting && newSetting.toLowerCase() !== "unknown" && newSetting !== plotData.setting) {
          setUpdatingFields((prev) => new Set([...prev, "setting"]))
          setPlotData((prev) => {
            // 如果本地已填充过（非 unknown），就不要被 summary 覆盖回别的值
            if (prev.setting && prev.setting.toLowerCase() !== "unknown") return prev
            return { ...prev, setting: newSetting }
          })
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

        // Dify 有时只抽取到不完整片段（例如 "is lost"），这里做轻量“补句式”让展示更顺。
        if (/^(is|are)\s+lost$/i.test(newConflict)) {
          const subject = character?.name ? character.name : "the hero"
          newConflict = `${subject} is lost`
        }
        // 如果提取到内容且不是 "unknown"，就使用它（允许单个词或短句）
        if (newConflict && newConflict.toLowerCase() !== "unknown" && newConflict !== plotData.conflict) {
          setUpdatingFields((prev) => new Set([...prev, "conflict"]))
          setPlotData((prev) => {
            if (prev.conflict && prev.conflict.toLowerCase() !== "unknown") return prev
            return { ...prev, conflict: newConflict }
          })
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
        // 如果提取到内容且不是 "unknown"，就使用它（允许单个词或短句）
        if (newGoal && newGoal.toLowerCase() !== "unknown" && newGoal !== plotData.goal) {
          setUpdatingFields((prev) => new Set([...prev, "goal"]))
          setPlotData((prev) => {
            if (prev.goal && prev.goal.toLowerCase() !== "unknown") return prev
            return { ...prev, goal: newGoal }
          })
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

  const progressCount = [plotData.setting, plotData.conflict, plotData.goal].reduce((acc, v) => {
    const ok = !!v && v.trim() !== "" && v.toLowerCase() !== "unknown"
    return acc + (ok ? 1 : 0)
  }, 0)
  const progressPct = Math.round((progressCount / 3) * 100)

  const handleContinue = () => {
    // Check if summary is done and all fields are not unknown
    if (canContinue) {
      onPlotCreate(plotData)
    } else if (!summaryDone) {
      toast.error("Please wait for the plot summary to complete")
    } else {
      toast.error("Please complete all plot fields (Setting, Conflict, Goal) before continuing")
    }
  }

  return (
    <div
      className="relative min-h-screen py-8 px-6 bg-gradient-to-br from-blue-100 via-cyan-50 via-purple-50 to-pink-50 overflow-hidden"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-200/50 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl animate-pulse" style={{ animationDelay: "500ms" }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <StageHeader stage={2} title="Brainstorm Your Plot" onBack={onBack} character={character?.name} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-9">
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 border-2 border-purple-200 shadow-2xl transition-all duration-300 hover:shadow-[0_24px_80px_rgba(167,139,250,0.35)] hover:-translate-y-0.5">
              <div ref={chatContainerRef} className="h-[600px] overflow-y-auto mb-6 space-y-4 pr-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                          : message.grammarIssue
                          ? "bg-red-100 border-2 border-red-400 text-red-800 animate-pulse"
                          : "bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 border-2 border-purple-200"
                      }`}
                    >
                      <p className="text-base leading-relaxed">
                        {message.content}
                      </p>
                      {message.role === "ai" && message.grammarIssue && (
                        <p className="mt-2 text-sm font-semibold">
                          {message.grammarIssue}
                        </p>
                      )}
                      {message.suggestions && message.suggestions.length > 0 && message.role === "ai" && (
                        <div className="mt-4 flex flex-nowrap gap-2">
                          {message.suggestions.map((suggestion, i) => {
                            // 去除单词中的逗号和其他标点
                            const cleanSuggestion = suggestion.replace(/[,，、。.!?！？;；:：]/g, '').trim()
                            return (
                              <button
                                key={i}
                                onClick={() => handleSuggestionClick(cleanSuggestion)}
                                className="px-3 py-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border-2 border-purple-400 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-2xl relative overflow-hidden group flex-shrink-0"
                                style={{
                                  animationDelay: `${i * 100}ms`,
                                  animationFillMode: "forwards",
                                }}
                              >
                                {/* 背景光效 */}
                                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                                <span className="relative z-10 whitespace-nowrap">
                                  {cleanSuggestion}
                                </span>
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
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-bounce" />
                        <span className="h-2.5 w-2.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl bg-white/70 backdrop-blur-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-xl transition-transform duration-150 active:scale-[0.98] hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {canContinue && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-200/60 blur-2xl animate-pulse" />
                  <p className="relative text-green-800 font-semibold text-center mb-3">
                    ✨ You can proceed to the next step, or continue chatting with AI to make your plot more accurate!
                  </p>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="relative w-full border-0 shadow-xl py-6 text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white animate-pulse"
                  >
                    Continue →
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {/* 角色图片 */}
            {character?.imageUrl && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-200 shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <h3 className="text-lg font-bold mb-3 text-indigo-700">Your Character</h3>
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white font-bold text-sm">{character.name}</p>
                    {character.species && (
                      <p className="text-white/80 text-xs">{character.species}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Plot Progress */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-blue-700 flex items-center gap-2">
                <span>📊</span>
                Plot Progress
              </h3>

              <div className="mb-5">
                <div className="h-2.5 w-full bg-white/60 border border-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-blue-800/80 text-center font-semibold">
                  {progressCount}/3 unlocked
                </p>
              </div>

              <div className="space-y-4">
                <div className={`transition-all duration-500 ${updatingFields.has("setting") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">Setting</span>
                    {plotData.setting && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${
                    plotData.setting 
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-lg" 
                      : "bg-gray-100 border-gray-200"
                  }`}>
                    <p className={`text-sm font-bold transition-all duration-500 ${
                      plotData.setting && plotData.setting.toLowerCase() !== "unknown" ? "text-blue-800" : "text-gray-400"
                    }`}>
                      {plotData.setting && plotData.setting.toLowerCase() !== "unknown" ? plotData.setting : "unknown"}
                    </p>
                  </div>
                </div>
                <div className={`transition-all duration-500 ${updatingFields.has("conflict") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">Conflict</span>
                    {plotData.conflict && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${
                    plotData.conflict 
                      ? "bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 shadow-lg" 
                      : "bg-gray-100 border-gray-200"
                  }`}>
                    <p className={`text-sm font-bold transition-all duration-500 ${
                      plotData.conflict && plotData.conflict.toLowerCase() !== "unknown" ? "text-purple-800" : "text-gray-400"
                    }`}>
                      {plotData.conflict && plotData.conflict.toLowerCase() !== "unknown" ? plotData.conflict : "unknown"}
                    </p>
                  </div>
                </div>
                <div className={`transition-all duration-500 ${updatingFields.has("goal") ? "animate-pulse scale-105" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">Goal</span>
                    {plotData.goal && (
                      <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${
                    plotData.goal 
                      ? "bg-gradient-to-r from-pink-100 to-pink-200 border-pink-300 shadow-lg" 
                      : "bg-gray-100 border-gray-200"
                  }`}>
                    <p className={`text-sm font-bold transition-all duration-500 ${
                      plotData.goal && plotData.goal.toLowerCase() !== "unknown" ? "text-pink-800" : "text-gray-400"
                    }`}>
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
