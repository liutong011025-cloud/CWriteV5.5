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
    // 先找到最後一個句號/問號/感嘆號，把「六個單詞」限制在標點後的尾段
    const lastPunctuationIndex = Math.max(
      text.lastIndexOf("."),
      text.lastIndexOf("?"),
      text.lastIndexOf("!"),
      text.lastIndexOf("。"),
      text.lastIndexOf("？"),
      text.lastIndexOf("！")
    )

    const tail = (lastPunctuationIndex >= 0 ? text.substring(lastPunctuationIndex + 1) : text).trim()

    // 從尾巴往前收集，僅保留純英文字母構成的單詞
    const rawTokens = tail.split(/\s+/).filter(Boolean)
    const collected: string[] = []

    for (let i = rawTokens.length - 1; i >= 0 && collected.length < 6; i--) {
      const cleaned = rawTokens[i].replace(/[^A-Za-z]/g, "").trim()
      if (cleaned.length > 0) {
        collected.push(cleaned.toLowerCase())
      }
    }

    const words = collected.reverse()

    // cleanedText：保留到最後一個主要標點為止，去掉尾部提示單詞
    const cleanedText =
      lastPunctuationIndex >= 0 ? text.substring(0, lastPunctuationIndex + 1).trim() : text.trim()

    return { words, cleanedText }
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
          character.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(", ")}` : "",
          character.description ? `Description: ${character.description}` : "",
        ].filter(Boolean).join("\n")
        
        // 新的设定：脑图机器人，面向小学生，六个单词收尾（保留标点符号，单词不用逗号）
        const characterName = character.name || "the character"
        const characterSpecies = character.species ? ` (a ${character.species})` : ""
        const characterReference = `${characterName}${characterSpecies}`
        
        initialPrompt = `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation. Always answer in English only.

Here's the character information the student created:
${characterInfo}

IMPORTANT: Always refer to the character by their name "${characterName}"${characterSpecies ? ` (a ${character.species})` : ""}, NOT "your character" or "the character". Use "${characterName}" in your questions.

Flow (CRITICAL):
Start by getting the setting/place.
After the student answers, briefly acknowledge in a natural way, then ask about the conflict/problem next.
After the student answers the conflict, briefly acknowledge, then ask about the goal/want next.
You MUST keep the order setting → conflict → goal, but do not use rigid turn numbers or rigid templates.
Let your next question sound like a real chat that continues from the student's last answer.

Tone (IMPORTANT):
- Keep the AI's message short and calm: 1-2 simple sentences.
- Do NOT be too vivid or dramatic. No extra worldbuilding beyond the next question.
- Briefly and naturally reflect the student's last answer (in your own words, 1 short clause) before asking the next question.
- Do NOT use a fixed sentence template every time; vary the wording naturally.

At the very end of your answer, add exactly six SINGLE ENGLISH WORDS related to story settings (like: school home forest park beach library). Each word must be a single word, not a phrase. Do not use commas between the six words - just use spaces. Keep proper punctuation in your questions (question marks, periods, etc.).

Continue guiding the student step by step. In every response you must:
- Always use "${characterName}"${characterSpecies ? ` (the ${character.species})` : ""} in your questions, NOT "your character"
- Use proper punctuation (question marks, periods, etc.) in your questions - DO NOT remove punctuation
- Grammar rule:
  - The student is allowed to answer with single words or short phrases (like "water", "big monster", "dark forest"). This is NOT a grammar error.
  - ONLY when the student's last message is a full sentence in English AND there is a clear grammar or spelling mistake, you may add ONE short error note like this: [GRAMMAR_ERROR]You wrote \"He go school\" → it should be \"He goes to school\".[/GRAMMAR_ERROR].
  - If there is no clear error, or if the student only wrote one word or a short phrase, do NOT use [GRAMMAR_ERROR] and do NOT talk about grammar.
  - Never ask the student to always answer with a full sentence. Do not say "Please answer with a full sentence".
- End with exactly six SINGLE ENGLISH WORDS related to the current topic (space-separated, no commas)
- Each of the six should be a single word, not a phrase (e.g., "school home forest park beach library" not "magic school enchanted forest")
- When the conversation can fully describe a complete story, say: "The plot is getting clearer! Anything else you'd like to talk about?" (in Chinese: 故事情节已经比较清晰了，还想再聊些什么吗？)

CRITICAL: Always use "${characterName}" in your questions. Always keep proper punctuation in your questions. End with exactly six SINGLE WORDS (space-separated, no commas).`
      } else {
        initialPrompt = `You are a mind map robot helping elementary school students with plot writing. Use simple, kid-friendly language with proper punctuation. Always answer in English only.

Flow (CRITICAL):
Start by getting the setting/place.
After the student answers, briefly acknowledge in a natural way, then ask about the conflict/problem next.
After the student answers the conflict, briefly acknowledge, then ask about the goal/want next.
You MUST keep the order setting → conflict → goal, but do not use rigid turn numbers or rigid templates.
Let your next question sound like a real chat that continues from the student's last answer.

Tone (IMPORTANT):
- Keep the AI's message short and calm: 1-2 simple sentences.
- Do NOT be too vivid or dramatic. No extra worldbuilding beyond the next question.
- Briefly and naturally reflect the student's last answer (in your own words, 1 short clause) before asking the next question.
- Do NOT use a fixed sentence template every time; vary the wording naturally.

At the very end of your answer, add exactly six SINGLE ENGLISH WORDS related to story settings (like: school home forest park beach library). Each word must be a single word, not a phrase. Don't use commas between the six words - just use spaces. Keep proper punctuation in your questions (question marks, periods, etc.).

Continue guiding step by step. In every response you must:
- Use proper punctuation (question marks, periods, etc.) - DO NOT remove punctuation
- Grammar rule:
  - The student is allowed to answer with single words or short phrases (like "water", "big monster", "dark forest"). This is NOT a grammar error.
  - ONLY when the student's last message is a full sentence in English AND there is a clear grammar or spelling mistake, you may add ONE short error note like this: [GRAMMAR_ERROR]You wrote \"He go school\" → it should be \"He goes to school\".[/GRAMMAR_ERROR].
  - If there is no clear error, or if the student only wrote one word or a short phrase, do NOT use [GRAMMAR_ERROR] and do NOT talk about grammar.
  - Never ask the student to always answer with a full sentence. Do not say "Please answer with a full sentence".
- End with exactly six SINGLE ENGLISH WORDS (space-separated, no commas)
- Each word must be a single word, not a phrase`
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
      const { grammarIssue, cleaned } = extractGrammarIssue(aiMessage)
      const { words: suggestions, cleanedText } = extractLastSixWords(cleaned)

      const initialMessages: Message[] = [{ role: "ai", content: cleanedText || cleaned || aiMessage, suggestions, grammarIssue }]
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
      const { grammarIssue, cleaned } = extractGrammarIssue(aiMessage)
      const { words: suggestions, cleanedText } = extractLastSixWords(cleaned)

      const updatedMessages = [...messages, userMessage, { role: "ai" as const, content: cleanedText || cleaned || aiMessage, suggestions, grammarIssue }]
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
    try {
      // 使用传入的消息历史，如果没有则使用当前messages
      const messagesToUse = messageHistory || messages
      
      // 只有当有对话历史时才调用总结API
      if (messagesToUse.length === 0) {
        console.log("No messages to summarize")
        return
      }
      
      // 构建对话历史（包含所有对话内容）
      const conversationHistory = messagesToUse.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

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
          setPlotData((prev) => ({ ...prev, setting: newSetting }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("setting")
              return newSet
            })
          }, 1000)
        } else if (newSetting && newSetting.toLowerCase() === "unknown") {
          setPlotData((prev) => ({ ...prev, setting: "unknown" }))
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
          setPlotData((prev) => ({ ...prev, conflict: newConflict }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("conflict")
              return newSet
            })
          }, 1000)
        } else if (newConflict && newConflict.toLowerCase() === "unknown") {
          setPlotData((prev) => ({ ...prev, conflict: "unknown" }))
        }
      }

      if (goalValue && goalValue.trim()) {
        // 去掉可能的"goal:"前缀和多余空格（兼容偶发输出）
        let newGoal = goalValue.trim().replace(/^(goal|objective|aim|want)[：:]\s*/i, "").trim()
        // 如果提取到内容且不是 "unknown"，就使用它（允许单个词或短句）
        if (newGoal && newGoal.toLowerCase() !== "unknown" && newGoal !== plotData.goal) {
          setUpdatingFields((prev) => new Set([...prev, "goal"]))
          setPlotData((prev) => ({ ...prev, goal: newGoal }))
          setTimeout(() => {
            setUpdatingFields((prev) => {
              const newSet = new Set(prev)
              newSet.delete("goal")
              return newSet
            })
          }, 1000)
        } else if (newGoal && newGoal.toLowerCase() === "unknown") {
          setPlotData((prev) => ({ ...prev, goal: "unknown" }))
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
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-blue-100 via-cyan-50 via-purple-50 to-pink-50" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto">
        <StageHeader stage={2} title="Brainstorm Your Plot" onBack={onBack} character={character?.name} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-9">
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 border-2 border-purple-200 shadow-2xl">
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
                                className="px-3 py-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border-2 border-purple-400 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-2xl animate-bounce-in hover:animate-wiggle relative overflow-hidden group flex-shrink-0"
                                style={{
                                  animationDelay: `${i * 100}ms`,
                                  animationFillMode: 'forwards',
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
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-200">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
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
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-xl"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {canContinue && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg">
                  <p className="text-green-800 font-semibold text-center mb-3">
                    ✨ You can proceed to the next step, or continue chatting with AI to make your plot more accurate!
                  </p>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="w-full border-0 shadow-xl py-6 text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white animate-pulse"
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
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-200 shadow-xl">
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
