"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Mail, CheckCircle2, Lock } from "lucide-react"
import { toast } from "sonner"
import StageHeader from "@/components/stage-header"
import Image from "next/image"
import { getCurrentLevel } from "@/lib/current-level"

interface LetterGameProps {
  recipient: string
  occasion: string
  guidance: string
  readerImageUrl: string | null
  onComplete: (sections: string[]) => void
  onBack: () => void
  userId?: string
  onDraftChange?: (text: string) => void
}

// 默认的信件结构
const LETTER_SECTIONS = [
  { name: "Greeting", emoji: "👋", placeholder: "Dear [name], Hello! How are you?" },
  { name: "Opening", emoji: "💬", placeholder: "I'm writing to tell you..." },
  { name: "Body", emoji: "📝", placeholder: "Here's what I want to share..." },
  { name: "Closing", emoji: "💝", placeholder: "I hope to hear from you soon!" },
  { name: "Signature", emoji: "✍️", placeholder: "Love, [Your name]" }
]

const LETTER_BEAR_POSITION = { x: 79.7, y: 20.1, scale: 1.0 }
const LETTER_HANG_POSITION = { x: 79.7, y: 38.3, scale: 1.0 }

export default function LetterGame({
  recipient,
  occasion,
  guidance,
  readerImageUrl: readerImageUrlProp,
  onComplete,
  onBack,
  userId,
  onDraftChange,
}: LetterGameProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>({})
  const [aiEvaluation, setAiEvaluation] = useState("")
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [canMoveNext, setCanMoveNext] = useState(false) // 只有 AI 说可以继续才能继续
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set())
  const [readerImageUrl, setReaderImageUrl] = useState<string | null>(readerImageUrlProp)
  const [writingMood, setWritingMood] = useState<"sit" | "like" | "angry" | "hang">("sit")
  const [isHoveringHang, setIsHoveringHang] = useState(false)
  const hangTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentSectionText = sectionTexts[currentSection] || ""
  const allTextLower = Object.values(sectionTexts).join(" ").toLowerCase()
  const hasDangerKeyword = ["fuck", "shit", "asshole"].some((w) => allTextLower.includes(w))
  const hasLoveKeyword = ["love", "peace", "like"].some((w) => allTextLower.includes(w))
  const activeBearPosition = writingMood === "hang" ? LETTER_HANG_POSITION : LETTER_BEAR_POSITION

  const shortEvaluation = (() => {
    const content = aiEvaluation.trim().replace(/\s+/g, " ")
    if (!content) return ""
    const firstSentence = content.match(/^[^.!?。！？]{1,120}[.!?。！？]?/)?.[0] ?? content
    return firstSentence.length > 120 ? `${firstSentence.slice(0, 120)}...` : firstSentence
  })()

  useEffect(() => {
    if (typeof window === "undefined") return
    const sources = ["/Cagentsit.png", "/Cagenthang.png", "/Cagentlike.png", "/Cagentangry.png"]
    sources.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [])

  const updateWritingMoodFromText = (text: string) => {
    if (writingMood === "hang") {
      setWritingMood("sit")
    }
    const lower = text.toLowerCase()
    const dangerWords = ["kill", "murder", "fuck", "shit", "asshole"]
    const loveWords = ["love", "admire", "peace", "like"]
    if (dangerWords.some((w) => lower.includes(w))) {
      setWritingMood("angry")
    } else if (loveWords.some((w) => lower.includes(w))) {
      setWritingMood("like")
    } else {
      setWritingMood("sit")
    }
  }

  useEffect(() => {
    if (hangTimeoutRef.current) {
      clearTimeout(hangTimeoutRef.current)
      hangTimeoutRef.current = null
    }
    if (writingMood !== "sit") return
    hangTimeoutRef.current = setTimeout(() => {
      setWritingMood("hang")
    }, 30000)
    return () => {
      if (hangTimeoutRef.current) {
        clearTimeout(hangTimeoutRef.current)
        hangTimeoutRef.current = null
      }
    }
  }, [writingMood])

  // 如果照片还没有加载，尝试生成（只生成一次）
  const hasGeneratedImageRef = useRef(false)
  useEffect(() => {
    if (hasGeneratedImageRef.current || readerImageUrl || !recipient || !occasion) {
      return
    }
    hasGeneratedImageRef.current = true
    console.log("=== Generating Letter Reader Image (ONCE) ===")
    
    fetch("/api/generate-letter-reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, occasion }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          setReaderImageUrl(data.imageUrl)
        }
      })
      .catch(err => console.error("Error loading reader image:", err))
  }, [readerImageUrl, recipient, occasion])

  // 每次草稿變化時，通知上層給 Cagent 做價值觀檢查
  useEffect(() => {
    if (!onDraftChange) return
    const allText = Object.values(sectionTexts).join(" ")
    onDraftChange(allText)
  }, [sectionTexts, onDraftChange])

  // 获取 AI 评价（真实的 Luna）
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (currentSectionText.trim().length > 10) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoadingEvaluation(true)
        try {
          const response = await fetch("/api/dify-letter-guide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient,
              occasion,
              currentSection: LETTER_SECTIONS[currentSection].name,
              currentText: currentSectionText,
              user_id: userId || "student",
              level: getCurrentLevel(),
            }),
          })

          const data = await response.json()
          if (data.message) {
            setAiEvaluation(data.message)
            
            // 检查是否包含 "you can move to the next part" 或 "done"
            const messageLower = data.message.toLowerCase().trim()
            const canMove = messageLower.endsWith("you can move to the next part") ||
                           messageLower.includes("you can move to the next part") ||
                           messageLower.endsWith("done") ||
                           messageLower.includes("\ndone") ||
                           messageLower === "done"
            
            setCanMoveNext(canMove)
            if (hasDangerKeyword) setWritingMood("angry")
            else if (hasLoveKeyword || canMove) setWritingMood("like")
            else if (messageLower.includes("please")) setWritingMood("sit")
            else setWritingMood("hang")
            
            if (canMove) {
              setCompletedSections(prev => new Set([...prev, currentSection]))
              toast.success("Great job! You can move to the next part！✨")
            }
          }
        } catch (error) {
          console.error("Error fetching AI evaluation:", error)
        } finally {
          setIsLoadingEvaluation(false)
        }
      }, 1500)
    } else {
      setAiEvaluation("")
      setCanMoveNext(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentSectionText, currentSection, recipient, occasion, userId, hasDangerKeyword, hasLoveKeyword])

  const handleTextChange = (text: string) => {
    setSectionTexts(prev => ({ ...prev, [currentSection]: text }))
    updateWritingMoodFromText(text)
    // 重置 canMoveNext，需要重新评估
    setCanMoveNext(false)
    
    // 测试功能：根据当前部分输入 test1-test5，自动标记当前 section 为完成
    const testPattern = `test${currentSection + 1}`
    if (text.trim().toLowerCase() === testPattern.toLowerCase()) {
      setCompletedSections(prev => new Set([...prev, currentSection]))
      setCanMoveNext(true)
      setAiEvaluation(`Test mode: Section ${currentSection + 1} marked as complete! ✓`)
    }
  }

  const handleNext = () => {
    if (!canMoveNext && !completedSections.has(currentSection)) {
      toast.error("Please wait for AI to approve your writing before moving on! ✨")
      return
    }
    
    if (currentSection < LETTER_SECTIONS.length - 1) {
      setCurrentSection(prev => prev + 1)
      setCanMoveNext(false) // 重置下一部分的状态
      setAiEvaluation("") // 清空评价
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
      setCanMoveNext(completedSections.has(currentSection - 1))
    }
  }

  // 检查是否输入了 test1-test5（测试模式）
  const isTestMode = LETTER_SECTIONS.some((_, index) => {
    const text = sectionTexts[index] || ""
    const testPattern = `test${index + 1}`
    return text.toLowerCase().trim() === testPattern.toLowerCase()
  })

  const handleFinish = () => {
    // 测试模式下直接完成
    if (isTestMode) {
      const sections = LETTER_SECTIONS.map((_, index) => sectionTexts[index] || "")
      onComplete(sections)
      return
    }
    
    // 检查所有部分是否都完成了
    const allCompleted = LETTER_SECTIONS.every((_, index) => 
      completedSections.has(index) || sectionTexts[index]?.trim().length > 0
    )
    
    if (!allCompleted) {
      toast.error("Please complete all sections before finishing! ✨")
      return
    }
    
    const sections = LETTER_SECTIONS.map((_, index) => sectionTexts[index] || "")
    onComplete(sections)
  }

  const canFinish = LETTER_SECTIONS.every((_, index) => {
    const text = sectionTexts[index] || ""
    const testPattern = `test${index + 1}`
    if (text.toLowerCase().trim() === testPattern.toLowerCase()) return true
    return text.trim().length > 0
  })

  const progress = (completedSections.size / LETTER_SECTIONS.length) * 100

  return (
    <div className="min-h-screen py-6 px-4 bg-gradient-to-br from-pink-100 via-purple-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <StageHeader onBack={onBack} />

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center items-center gap-3">
            <Mail className="w-12 h-12 text-pink-600 animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Write Your Letter
            </h1>
            <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-xl px-6 py-3 inline-block border-2 border-pink-200 shadow-lg mb-4">
            <p className="text-lg text-gray-700">
              To: <span className="font-bold text-pink-700">{recipient}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              💭 {occasion}
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6 bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-4 border-purple-300 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-purple-700">📊 Your Progress</h3>
            <div className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-4 gap-2">
            {LETTER_SECTIONS.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  if (completedSections.has(index) || index === 0 || completedSections.has(index - 1)) {
                    setCurrentSection(index)
                  } else {
                    toast.error("Please complete previous sections first! ✨")
                  }
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  currentSection === index
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white scale-105 shadow-lg"
                    : completedSections.has(index)
                    ? "bg-green-100 text-green-700 border-2 border-green-300"
                    : "bg-gray-100 text-gray-600 border-2 border-gray-200"
                }`}
              >
                <div className="text-lg mb-1">{section.emoji}</div>
                <div className="text-xs">{section.name}</div>
                {completedSections.has(index) && (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-600" />
                )}
                {!completedSections.has(index) && index > 0 && !completedSections.has(index - 1) && (
                  <Lock className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 主写作区域 - 两列布局 */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* 左侧：写作区 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-4 border-pink-300 shadow-xl relative">
              <div
                className="absolute z-20"
                style={{
                  left: `${activeBearPosition.x}%`,
                  top: `${activeBearPosition.y}%`,
                  transform: `translate(-50%, -100%) scale(${activeBearPosition.scale})`,
                }}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWritingMood("sit")}
                    onMouseEnter={() => setIsHoveringHang(true)}
                    onMouseLeave={() => setIsHoveringHang(false)}
                    className="focus:outline-none"
                  >
                    <img
                      src={
                        writingMood === "angry"
                          ? "/Cagentangry.png"
                          : writingMood === "like"
                          ? "/Cagentlike.png"
                        : writingMood === "hang"
                          ? "/Cagenthang.png"
                          : "/Cagentsit.png"
                      }
                      alt="Cagent Bear"
                      className="h-24 w-24 object-contain drop-shadow-lg"
                    />
                  </button>
                  {writingMood === "hang" && isHoveringHang && (
                    <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white shadow-lg">
                      Save me!
                    </div>
                  )}
                  {(isLoadingEvaluation || shortEvaluation) && (
                    <div className="absolute left-1/2 top-full mt-1 w-[300px] -translate-x-1/2 rounded-2xl border border-purple-300 bg-white/95 px-3 py-2 text-xs text-purple-800 shadow-xl">
                      {isLoadingEvaluation ? "Cagent is reading your letter..." : shortEvaluation}
                    </div>
                  )}
                  {writingMood === "angry" && (
                    <div className="absolute left-1/2 top-full mt-20 w-[300px] -translate-x-1/2 rounded-2xl border border-red-300 bg-white/95 px-3 py-2 text-xs text-red-700 shadow-xl">
                      This text contains offensive words. Please rewrite politely.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{LETTER_SECTIONS[currentSection].emoji}</span>
                <h2 className="text-2xl font-bold text-pink-700">
                  {LETTER_SECTIONS[currentSection].name}
                </h2>
              </div>
              
              <Textarea
                value={currentSectionText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={LETTER_SECTIONS[currentSection].placeholder.replace('[name]', recipient)}
                className={`w-full min-h-[300px] p-4 border-2 rounded-xl focus:outline-none resize-y text-base ${
                  writingMood === "angry"
                    ? "border-red-400 bg-pink-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-300"
                }`}
                style={{ fontFamily: 'var(--font-comic-neue)' }}
              />
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  {currentSectionText.trim().length} characters
                </p>
                <div className="flex gap-2">
                  {currentSection > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="border-2 border-gray-300"
                    >
                      ← Previous
                    </Button>
                  )}
                  {currentSection < LETTER_SECTIONS.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canMoveNext && !completedSections.has(currentSection)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {canMoveNext || completedSections.has(currentSection) ? "Next →" : <><Lock className="w-4 h-4 mr-2" /> Wait for approval</>}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinish}
                      disabled={!canFinish}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {isTestMode ? "Finish Letter (Test Mode)" : "Finish Letter"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 右侧：提示和照片 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 提示卡片 - 放在照片上面 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-300 shadow-lg">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>Writing Tip</span>
              </h4>
              <p className="text-sm text-yellow-700">
                {LETTER_SECTIONS[currentSection].name === "Greeting" && "Start with a friendly greeting! Say hello and ask how they are. 👋"}
                {LETTER_SECTIONS[currentSection].name === "Opening" && "Tell them why you're writing! Share the reason for your letter. 💬"}
                {LETTER_SECTIONS[currentSection].name === "Body" && "Share your thoughts and feelings! Write what you want to tell them. 📝"}
                {LETTER_SECTIONS[currentSection].name === "Closing" && "End with warm wishes! Say something nice to finish. 💝"}
                {LETTER_SECTIONS[currentSection].name === "Signature" && "Sign your name! Add your name at the end. ✍️"}
              </p>
            </div>

            {/* 收信人读信照片 */}
            {readerImageUrl ? (
              <div className="sticky top-24">
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden" style={{
                  filter: 'blur(2px)',
                  border: 'none',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}>
                  <Image
                    src={readerImageUrl}
                    alt={`${recipient} reading your letter`}
                    fill
                    className="object-cover"
                    style={{
                      borderRadius: '1.5rem',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            ) : (
              <div className="sticky top-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 border-4 border-purple-300 shadow-xl flex items-center justify-center aspect-square">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Photo coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
