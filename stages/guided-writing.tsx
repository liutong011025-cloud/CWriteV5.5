"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { toast } from "sonner"
import { getCurrentLevel } from "@/lib/current-level"

interface GuidedWritingProps {
  language: Language
  storyState: StoryState
  onStoryWrite: (story: string) => void
  onBack: () => void
  userId?: string
  // 寫作草稿變化時回傳給上層（供 Cagent 做價值觀檢查）
  onDraftChange?: (text: string) => void
}

// Enhanced word count function that handles both English and Chinese
const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0

  // Match Chinese characters (CJK unified ideographs)
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  
  // Match English words (sequences of letters, numbers, and apostrophes)
  // Remove Chinese characters first, then split by whitespace
  const englishText = text.replace(/[\u4e00-\u9fff]/g, ' ').trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(word => word.length > 0).length : 0

  return chineseChars + englishWords
}

const STORY_BEAR_POSITION = { x: 83.2, y: 3.0, scale: 0.92 }
const STORY_HANG_POSITION = { x: 83.2, y: 16.3, scale: 0.92 }

export default function GuidedWriting({ language, storyState, onStoryWrite, onBack, userId, onDraftChange }: GuidedWritingProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>({}) // 存储每个结构块的文本
  const [aiEvaluation, setAiEvaluation] = useState("")
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [sectionDone, setSectionDone] = useState<Record<number, boolean>>({}) // 每个结构块是否完成
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})
  const [writingMood, setWritingMood] = useState<"sit" | "like" | "angry" | "hang">("sit")
  const [isHoveringHang, setIsHoveringHang] = useState(false)
  const hangTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sections = storyState.structure?.outline || []
  
  // 当前结构块的文本
  const currentSectionText = sectionTexts[currentSection] || ""
  
  const wordCount = useMemo(() => {
    // 计算所有结构块的总字数
    const allText = Object.values(sectionTexts).join(' ')
    const count = countWords(allText)
    return count
  }, [sectionTexts])
  
  const currentSectionWordCount = useMemo(() => {
    return countWords(currentSectionText)
  }, [currentSectionText])

  const shortEvaluation = useMemo(() => {
    const content = aiEvaluation.trim().replace(/\s+/g, " ")
    if (!content) return ""
    const firstSentence = content.match(/^[^.!?。！？]{1,120}[.!?。！？]?/)?.[0] ?? content
    return firstSentence.length > 120 ? `${firstSentence.slice(0, 120)}...` : firstSentence
  }, [aiEvaluation])

  const activeBearPosition = writingMood === "hang" ? STORY_HANG_POSITION : STORY_BEAR_POSITION

  useEffect(() => {
    if (typeof window === "undefined") return
    const sources = ["/Cagentsit.png", "/Cagenthang.png", "/Cagentlike.png", "/Cagentangry.png"]
    sources.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [])

  // 將當前所有段落文字回傳給上層，實時給 Cagent 作價值觀檢查
  useEffect(() => {
    if (!onDraftChange) return
    const allText = Object.values(sectionTexts).join(" ")
    onDraftChange(allText)
  }, [sectionTexts, onDraftChange])

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

  // 处理当前结构块文本变化
  const handleSectionTextChange = (sectionIndex: number, text: string) => {
    setSectionTexts(prev => ({
      ...prev,
      [sectionIndex]: text
    }))
    if (sectionIndex === currentSection) {
      updateWritingMoodFromText(text)
    }
    
    // 测试功能：如果输入 "test"，自动标记当前 section 为完成
    if (text.trim().toLowerCase() === "test") {
      setSectionDone(prev => ({
        ...prev,
        [sectionIndex]: true
      }))
      // 自动触发 AI 评估完成状态
      setAiEvaluation("Test mode: Section marked as complete! ✓")
    }
  }

  // Debounced AI evaluation fetching
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (currentSectionText.trim().length > 10) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoadingEvaluation(true)
        try {
          const response = await fetch("/api/dify-writing-evaluation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: currentSectionText,
              character: storyState.character,
              plot: storyState.plot,
              structure: storyState.structure,
              current_section: currentSection,
              user_id: userId || "default-user",
              level: getCurrentLevel(),
            }),
          })

          const data = await response.json()

          if (data.error) {
            console.error("AI evaluation error:", data.error)
            return
          }

          setAiEvaluation(data.evaluation || "")
          
          // 如果AI返回done，标记当前结构块为完成
          if (data.done) {
            setSectionDone(prev => ({
              ...prev,
              [currentSection]: true
            }))
          }
        } catch (error) {
          console.error("Error fetching AI evaluation:", error)
        } finally {
          setIsLoadingEvaluation(false)
        }
      }, 2000) // Wait 2 seconds after user stops typing
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentSectionText, currentSection, storyState.character, storyState.plot, storyState.structure, userId])
  
  // 切换结构块时的处理
  const handleSectionChange = (index: number) => {
    if (index === currentSection) return
    
    // 如果切换到下一个或更后面的结构块，检查前面的所有结构块是否都已完成
    if (index > currentSection) {
      // 检查从当前结构块到目标结构块之间的所有结构块是否都已完成
      for (let i = currentSection; i < index; i++) {
        if (!sectionDone[i]) {
          toast.error(`Please complete "${sections[i]}" section before moving to the next one`)
          return
        }
      }
    }
    
    // 允许向后切换（回到之前已完成的结构块）
    setCurrentSection(index)
    setAiEvaluation("") // 清空评价，重新评估
    
    // 延迟聚焦到新的文本框，确保DOM已更新
    setTimeout(() => {
      const textarea = textareaRefs.current[index]
      if (textarea) {
        textarea.focus()
      }
    }, 100)
  }

  // 检查是否输入了test（测试模式）
  const isTestMode = useMemo(() => {
    return Object.values(sectionTexts).some(text => text.trim().toLowerCase() === "test")
  }, [sectionTexts])

  const handlePublish = () => {
    // 检查所有结构块是否都已完成
    const allSectionsDone = sections.every((_, index) => sectionDone[index])
    
    if (!allSectionsDone) {
      toast.error("Please complete all sections before finishing the story")
      return
    }
    
    // 测试模式下取消字数限制
    if (!isTestMode && wordCount < 20) {
      toast.error("Your story needs at least 20 words")
      return
    }
    
    // 组合所有结构块的文本
    const fullStory = sections.map((_, index) => {
      const sectionText = sectionTexts[index] || ""
      return `${sections[index]}:\n${sectionText}`
    }).join('\n\n')
    
    onStoryWrite(fullStory)
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-green-100 via-emerald-50 via-blue-50 via-purple-50 to-pink-50 relative overflow-hidden" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 高级背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* 创意元素：写作相关图标 */}
        <div className="absolute top-32 right-32 text-6xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>✍️</div>
        <div className="absolute top-48 left-48 text-5xl opacity-10 animate-float" style={{ animationDelay: '1.5s' }}>📝</div>
        <div className="absolute top-64 right-64 text-4xl opacity-10 animate-float" style={{ animationDelay: '0s' }}>📖</div>
        <div className="absolute bottom-32 left-32 text-4xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute top-96 left-96 text-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🌟</div>
        <div className="absolute bottom-1/3 right-1/3 text-5xl opacity-10 animate-float" style={{ animationDelay: '0.3s' }}>💫</div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader stage={4} title="Write Your Story" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-8">
            <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl p-8 border-4 border-blue-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              {/* 纸张纹理效果 */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}></div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <label className="block text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    Story Sections
                  </label>
                  <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {sections.map((section, i) => (
                    <button
                      key={i}
                        onClick={() => handleSectionChange(i)}
                        disabled={i > currentSection && !sectionDone[i - 1]}
                        className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-lg transform hover:scale-105 ${
                        currentSection === i
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white scale-105 ring-4 ring-blue-300 animate-pulse"
                            : sectionDone[i]
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400 hover:shadow-xl"
                            : "bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                      {section}
                          {sectionDone[i] && <span className="text-lg animate-bounce">✓</span>}
                        </span>
                    </button>
                  ))}
                </div>
              </div>

                <div className="relative">
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
                        <div className="absolute left-1/2 top-full mt-1 w-[320px] -translate-x-1/2 rounded-2xl border border-purple-300 bg-white/95 px-3 py-2 text-xs text-purple-800 shadow-xl">
                          {isLoadingEvaluation ? "Cagent is thinking..." : shortEvaluation}
                        </div>
                      )}
                      {writingMood === "angry" && (
                        <div className="absolute left-1/2 top-full mt-20 w-[320px] -translate-x-1/2 rounded-2xl border border-red-300 bg-white/95 px-3 py-2 text-xs text-red-700 shadow-xl">
                          This text contains offensive words. Please revise with respectful language.
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 文本框装饰边框 */}
                  <div
                    className={`absolute -inset-1 rounded-xl blur-sm ${
                      writingMood === "angry"
                        ? "bg-gradient-to-r from-red-400 via-pink-400 to-red-300 opacity-60 animate-pulse"
                        : "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20"
                    }`}
                  ></div>
              <textarea
                    key={currentSection}
                    ref={(el) => {
                      textareaRefs.current[currentSection] = el
                    }}
                    placeholder={`Start writing the "${sections[currentSection]}" section here... Let your imagination flow! 💭`}
                    value={currentSectionText}
                    onChange={(e) => handleSectionTextChange(currentSection, e.target.value)}
                    className={`relative w-full h-[500px] p-6 rounded-xl border-4 bg-white/90 text-foreground placeholder-gray-400 font-serif text-base leading-relaxed shadow-inner focus:shadow-lg transition-all duration-300 ${
                      writingMood === "angry"
                        ? "border-red-400 bg-pink-50 focus:border-red-500 focus:ring-4 focus:ring-red-200"
                        : "border-blue-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-200"
                    }`}
                    style={{ fontFamily: 'var(--font-comic-neue)' }}
                  />
                  
                  {/* 输入提示装饰 */}
                  {currentSectionText.length === 0 && (
                    <div className="absolute top-4 right-4 text-2xl opacity-20 animate-pulse">✨</div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 p-5 bg-gradient-to-r from-blue-50 via-cyan-50 to-purple-50 rounded-xl border-3 border-blue-300 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/80 px-4 py-2 rounded-lg border-2 border-blue-200">
                      <span className="text-lg font-bold text-blue-700 flex items-center gap-2">
                        <span>📊</span>
                        Section: {currentSectionWordCount} | Total: {wordCount}
                      </span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    sectionDone[currentSection] 
                      ? "bg-green-100 border-green-400 text-green-700 animate-pulse" 
                      : "bg-yellow-50 border-yellow-300 text-yellow-700"
                  }`}>
                    <span className="text-lg font-semibold flex items-center gap-2">
                      {sectionDone[currentSection] ? (
                        <>
                          <span className="text-xl">✓</span>
                          Section Complete!
                        </>
                      ) : (
                        <>
                          <span className="animate-pulse">✍️</span>
                          Keep writing...
                        </>
                      )}
                    </span>
                  </div>
              </div>

              <Button
                onClick={handlePublish}
                  disabled={(!isTestMode && wordCount < 50) || !sections.every((_, index) => sectionDone[index])}
                size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white border-0 shadow-2xl py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isTestMode ? (
                      <>
                        <span className="text-2xl">🎉</span>
                        Finish Story (Test Mode)
                      </>
                    ) : wordCount < 20 ? (
                      <>
                        <span>📝</span>
                        Finish Story ({wordCount}/20 words)
                      </>
                    ) : sections.every((_, index) => sectionDone[index]) ? (
                      <>
                        <span className="text-2xl">🎉</span>
                        Finish Story
                      </>
                    ) : (
                      <>
                        <span>⏳</span>
                        Complete All Sections ({sections.filter((_, index) => sectionDone[index]).length}/{sections.length} done)
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {/* 故事上下文卡片 */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl p-6 border-4 border-indigo-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              {/* 装饰背景 */}
              <div className="absolute top-0 left-0 w-28 h-28 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-5 text-indigo-700 flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  Story Context
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 border-2 border-indigo-200 shadow-md">
                    <p className="text-gray-600 font-semibold mb-2 flex items-center gap-2">
                      <span>👤</span>
                      Character
                    </p>
                    <p className="text-indigo-700 font-bold text-lg">{storyState.character?.name || "N/A"}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 border-2 border-purple-200 shadow-md">
                    <p className="text-gray-600 font-semibold mb-2 flex items-center gap-2">
                      <span>🌍</span>
                      Setting
                    </p>
                    <p className="text-purple-700 font-bold text-lg">{storyState.plot?.setting || "N/A"}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 border-2 border-pink-200 shadow-md">
                    <p className="text-gray-600 font-semibold mb-2 flex items-center gap-2">
                      <span>📐</span>
                      Structure
                    </p>
                    <p className="text-pink-700 font-bold text-lg capitalize">{storyState.structure?.type || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 进度指示器 - 更生动的展示 */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-4 border-amber-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-5 text-amber-700 flex items-center gap-2">
                  <span className="text-3xl animate-pulse">🎯</span>
                  <span>Writing Progress</span>
                </h3>
                
                {/* 进度条 - 更生动的设计 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      Sections
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-700">
                        {sections.filter((_, index) => sectionDone[index]).length}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-lg font-semibold text-gray-600">
                        {sections.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* 生动的进度条 */}
                  <div className="relative w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-6 overflow-hidden shadow-inner border-2 border-gray-300">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                      style={{ 
                        width: `${(sections.filter((_, index) => sectionDone[index]).length / sections.length) * 100}%` 
                      }}
                    >
                      {/* 进度条内的闪烁效果 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      {/* 进度百分比文字 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-md">
                          {Math.round((sections.filter((_, index) => sectionDone[index]).length / sections.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 单词统计 - 更生动的展示 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/80 rounded-xl p-3 border-2 border-amber-200 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✍️</span>
                      <span className="text-xs font-semibold text-gray-600">Words</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-700">{wordCount}</span>
                      <span className="text-xs text-gray-500">/ 50</span>
                    </div>
                    {wordCount >= 50 && (
                      <div className="mt-1 text-xs text-green-600 font-semibold flex items-center gap-1">
                        <span>✓</span>
                        <span>Target reached!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-3 border-2 border-purple-200 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✅</span>
                      <span className="text-xs font-semibold text-gray-600">Complete</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-700">
                        {sections.filter((_, index) => sectionDone[index]).length}
                      </span>
                      <span className="text-xs text-gray-500">/ {sections.length}</span>
                    </div>
                    {sections.every((_, index) => sectionDone[index]) && (
                      <div className="mt-1 text-xs text-green-600 font-semibold flex items-center gap-1">
                        <span>🎉</span>
                        <span>All done!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 完成度指示 */}
                {sections.every((_, index) => sectionDone[index]) && wordCount >= 50 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-400 shadow-lg animate-pulse">
                    <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2">
                      <span className="text-xl">🎊</span>
                      <span>Ready to Finish!</span>
                      <span className="text-xl">🎊</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
