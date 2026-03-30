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
  onDraftChange?: (text: string) => void
}

const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishText = text.replace(/[\u4e00-\u9fff]/g, ' ').trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(word => word.length > 0).length : 0
  return chineseChars + englishWords
}

type ChatMessage = {
  id: number
  role: 'ai' | 'user'
  text: string
  isLoading?: boolean
}

function GuidedWriting({ language, storyState, onStoryWrite, onBack, userId, onDraftChange }: GuidedWritingProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>({})
  const [sectionDone, setSectionDone] = useState<Record<number, boolean>>({})
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isSubmittingChat, setIsSubmittingChat] = useState(false)
  const [writingMood, setWritingMood] = useState<"sit" | "like" | "angry" | "hang">("sit")
  const [angryReason, setAngryReason] = useState<"offensive" | "gibberish" | null>(null)
  const [goodEnoughSecret, setGoodEnoughSecret] = useState<string | null>(null)
  const [lastInputAt, setLastInputAt] = useState(() => Date.now())
  const hangTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  const sections = storyState.structure?.outline || []

  const wordCount = useMemo(() => {
    const allText = Object.values(sectionTexts).join(' ')
    return countWords(allText)
  }, [sectionTexts])

  const isTestMode = useMemo(() => {
    return Object.values(sectionTexts).some(text => text.trim().toLowerCase() === "test")
  }, [sectionTexts])

  // Initialize chat with first section prompt
  useEffect(() => {
    if (sections.length > 0) {
      setChatMessages([{
        id: 0,
        role: 'ai',
        text: `Let's start writing your story! Begin with the **${sections[0]}** section. Type your writing below and I'll give you feedback!`
      }])
    }
  }, [])

  // Preload bear images
  useEffect(() => {
    if (typeof window === "undefined") return
    const sources = ["/Cagentsit.png", "/Cagenthang.png", "/Cagentlike.png", "/Cagentangry.png"]
    sources.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Draft change callback
  useEffect(() => {
    if (!onDraftChange) return
    const allText = Object.values(sectionTexts).join(" ")
    onDraftChange(allText)
  }, [sectionTexts, onDraftChange])

  // Hang timeout — triggers if user is idle on "sit" mood
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
  }, [writingMood, lastInputAt])

  const updateWritingMoodFromText = (text: string) => {
    const lower = text.toLowerCase()
    const dangerWords = ["kill", "murder", "fuck", "shit", "asshole"]
    const loveWords = ["love", "admire", "peace", "like"]
    if (dangerWords.some((w) => lower.includes(w))) {
      setWritingMood("angry")
      setAngryReason("offensive")
    } else if (loveWords.some((w) => lower.includes(w))) {
      setWritingMood("like")
      setAngryReason(null)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isSubmittingChat) return

    const userText = chatInput.trim()
    setChatInput("")
    setLastInputAt(Date.now())

    // Map text to the current section in the right panel immediately
    setSectionTexts(prev => ({ ...prev, [currentSection]: userText }))
    updateWritingMoodFromText(userText)

    // Add user message to chat
    const userMsgId = Date.now()
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }])

    // Test mode shortcut
    if (userText.trim().toLowerCase() === "test") {
      setSectionDone(prev => ({ ...prev, [currentSection]: true }))
      setChatMessages(prev => [...prev, { id: userMsgId + 1, role: 'ai', text: 'Test mode: Section marked as complete! ✓' }])
      const nextSection = currentSection + 1
      if (nextSection < sections.length) {
        setTimeout(() => {
          setCurrentSection(nextSection)
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            role: 'ai',
            text: `Great! Now let's write the **${sections[nextSection]}** section!`
          }])
        }, 500)
      }
      return
    }

    if (userText.trim().length <= 10) {
      setChatMessages(prev => [...prev, {
        id: userMsgId + 1,
        role: 'ai',
        text: "That's a bit short! Try writing a few more sentences for this section."
      }])
      return
    }

    // Add loading indicator
    const loadingId = userMsgId + 1
    setChatMessages(prev => [...prev, { id: loadingId, role: 'ai', text: '', isLoading: true }])
    setIsSubmittingChat(true)

    try {
      const response = await fetch("/api/dify-writing-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userText,
          character: storyState.character,
          plot: storyState.plot,
          structure: storyState.structure,
          current_section: currentSection,
          user_id: userId || "default-user",
          level: getCurrentLevel(),
        }),
      })

      const data = await response.json().catch(() => ({}))

      // Remove loading bubble
      setChatMessages(prev => prev.filter(m => m.id !== loadingId))

      if (!response.ok) {
        const msg =
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          `Could not get feedback (${response.status}). Please try again.`
        setChatMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: msg }])
        toast.error("Cagent could not finish reading your writing. Try again in a moment.")
        return
      }

      if (data.error && !data.evaluation) {
        const msg = (typeof data.message === 'string' && data.message) || String(data.error)
        setChatMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: msg }])
        toast.error("Cagent could not finish reading your writing. Try again in a moment.")
        return
      }

      const evalText = typeof data.evaluation === 'string' ? data.evaluation : ''
      const gibberishRatio =
        data?.quality && typeof data.quality === 'object' && typeof data.quality.gibberishRatio === 'number'
          ? data.quality.gibberishRatio
          : 0
      const isGibberish = Boolean(data.gibberishDetected) || gibberishRatio >= 0.45

      if (isGibberish) {
        setWritingMood("angry")
        setAngryReason("gibberish")
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: evalText || "I cannot understand this text yet. Please rewrite 2–3 clear sentences."
        }])
        return
      }

      if (data.secretCodeDetected && data.secretCode) {
        setGoodEnoughSecret(data.secretCode)
        setWritingMood("like")
        setAngryReason(null)
      }

      // Show AI evaluation in chat
      if (evalText) {
        setChatMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: evalText }])
      }

      const hasMoveOnSentence = /you can move on to the next part of your writing!/i.test(evalText)
      const canMarkDone = !isGibberish && (Boolean(data.done) || Boolean(data.secretCodeDetected) || hasMoveOnSentence)

      if (canMarkDone) {
        setSectionDone(prev => ({ ...prev, [currentSection]: true }))
        const nextSection = currentSection + 1
        if (nextSection < sections.length) {
          setTimeout(() => {
            setCurrentSection(nextSection)
            setChatMessages(prev => [...prev, {
              id: Date.now(),
              role: 'ai',
              text: `Great job on the **${sections[currentSection]}** section! Now let's write the **${sections[nextSection]}** section. Continue your story!`
            }])
            chatInputRef.current?.focus()
          }, 600)
        } else {
          setWritingMood("like")
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            role: 'ai',
            text: '🎉 Amazing work! You have completed all sections! Click "Finish Story" to continue!'
          }])
        }
      }
    } catch (error) {
      console.error("Error fetching AI evaluation:", error)
      setChatMessages(prev => prev.filter(m => m.id !== loadingId))
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        text: "We could not reach the writing coach. Check your network and try again."
      }])
      toast.error("Network error while sending your writing to Cagent.")
    } finally {
      setIsSubmittingChat(false)
    }
  }

  const handlePublish = () => {
    const allSectionsDone = sections.every((_, index) => sectionDone[index])
    if (!allSectionsDone) {
      toast.error("Please complete all sections before finishing the story")
      return
    }
    if (!isTestMode && wordCount < 20) {
      toast.error("Your story needs at least 20 words")
      return
    }
    const fullStory = sections
      .map((_, index) => `${sections[index]}:\n${sectionTexts[index] || ''}`)
      .join('\n\n')
    onStoryWrite(fullStory)
  }

  const bearSrc =
    writingMood === "angry" ? "/Cagentangry.png"
    : writingMood === "like" ? "/Cagentlike.png"
    : writingMood === "hang" ? "/Cagenthang.png"
    : "/Cagentsit.png"

  const allDone = sections.every((_, i) => sectionDone[i])

  return (
    <div
      className="min-h-screen py-8 px-6 bg-gradient-to-br from-green-100 via-emerald-50 via-blue-50 via-purple-50 to-pink-50 relative overflow-hidden"
      style={{ paddingTop: '120px', paddingBottom: '120px' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
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

          {/* LEFT: Chat Panel */}
          <div className="lg:col-span-5">
            <div
              className="bg-white rounded-3xl border-4 border-blue-300 shadow-2xl flex flex-col"
              style={{ height: '680px' }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl shrink-0">
                <button
                  type="button"
                  onClick={() => setWritingMood(prev => prev === "hang" ? "sit" : "hang")}
                  className="focus:outline-none"
                >
                  <img src={bearSrc} alt="Cagent Bear" className="h-14 w-14 object-contain drop-shadow-md" />
                </button>
                <div>
                  <h3 className="font-bold text-blue-700 text-lg">Cagent</h3>
                  <p className="text-xs text-gray-500">
                    {writingMood === "angry"
                      ? angryReason === "gibberish" ? "Confused 🤔" : "Not happy 😠"
                      : writingMood === "like" ? "Impressed 😊"
                      : writingMood === "hang" ? "Waiting... 😴"
                      : "Ready to help ✍️"}
                  </p>
                </div>
                <div className="ml-auto text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  {sections[currentSection] || `Section ${currentSection + 1}`}
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <img src="/Cagentsit.png" alt="" className="h-7 w-7 object-contain shrink-0" />
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.isLoading ? (
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="shrink-0 p-4 border-t-2 border-blue-100 bg-gray-50 rounded-b-3xl">
                {writingMood === "angry" && (
                  <p className="text-xs text-red-600 mb-2 font-medium">
                    {angryReason === "gibberish"
                      ? "Please rewrite with clear, readable sentences."
                      : "Please revise with respectful language."}
                  </p>
                )}
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value)
                      setLastInputAt(Date.now())
                      if (writingMood === "hang") setWritingMood("sit")
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit()
                      }
                    }}
                    placeholder={
                      allDone
                        ? "All sections complete! Click Finish Story →"
                        : `Write your ${sections[currentSection] || 'story'} section here…`
                    }
                    className="flex-1 resize-none rounded-2xl border-2 border-blue-200 p-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white font-serif leading-relaxed"
                    rows={3}
                    disabled={isSubmittingChat || allDone}
                    style={{ fontFamily: 'var(--font-comic-neue)' }}
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isSubmittingChat || allDone}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-4 py-3 h-auto text-lg font-bold shadow-lg disabled:opacity-40"
                  >
                    {isSubmittingChat ? (
                      <span className="animate-spin">⟳</span>
                    ) : '→'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Press Enter to submit • Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Story Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Story sections display */}
            <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl p-6 border-4 border-blue-300 shadow-2xl backdrop-blur-sm flex-1">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  Your Story
                </h3>
                <div className="text-sm font-semibold text-gray-500 bg-white/70 px-3 py-1 rounded-full border border-blue-200">
                  {sections.filter((_, i) => sectionDone[i]).length}/{sections.length} sections • {wordCount} words
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {sections.map((section, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Allow navigating back to done sections
                      if (i <= currentSection || sectionDone[i - 1]) {
                        setCurrentSection(i)
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                      currentSection === i
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white ring-2 ring-blue-300 scale-105'
                        : sectionDone[i]
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105'
                        : 'bg-white border-2 border-gray-200 text-gray-400 cursor-default'
                    }`}
                  >
                    {section} {sectionDone[i] && <span className="ml-1">✓</span>}
                  </button>
                ))}
              </div>

              {/* Section cards */}
              <div className="space-y-3">
                {sections.map((section, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 border-2 transition-all duration-300 ${
                      currentSection === i
                        ? 'border-blue-400 bg-blue-50/80 ring-2 ring-blue-200 shadow-md'
                        : sectionDone[i]
                        ? 'border-green-300 bg-green-50/60'
                        : 'border-gray-200 bg-gray-50/60 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm flex items-center gap-1.5 text-gray-700">
                        {currentSection === i && !sectionDone[i] && <span className="text-blue-500 animate-pulse">✍️</span>}
                        {sectionDone[i] && <span className="text-green-500">✓</span>}
                        {section}
                        {currentSection === i && !sectionDone[i] && (
                          <span className="text-xs font-normal text-blue-500 ml-1">(writing now)</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {countWords(sectionTexts[i] || '')} words
                      </span>
                    </div>
                    <p
                      className={`text-sm font-serif leading-relaxed min-h-[3rem] ${
                        sectionTexts[i] ? 'text-gray-800' : 'text-gray-400 italic'
                      }`}
                      style={{ fontFamily: 'var(--font-comic-neue)' }}
                    >
                      {sectionTexts[i] || (
                        currentSection === i
                          ? 'Your writing will appear here after you submit in the chat…'
                          : 'Not started yet'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress + Finish button */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-5 border-4 border-amber-300 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-amber-700 flex items-center gap-2">
                  <span className="text-xl animate-pulse">🎯</span>
                  Writing Progress
                </h4>
                <span className="text-sm text-gray-600">
                  {sections.filter((_, i) => sectionDone[i]).length}/{sections.length} sections complete
                </span>
              </div>

              <div className="relative w-full bg-gray-200 rounded-full h-5 mb-4 overflow-hidden shadow-inner border border-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${sections.length ? (sections.filter((_, i) => sectionDone[i]).length / sections.length) * 100 : 0}%`
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                  {sections.length ? Math.round((sections.filter((_, i) => sectionDone[i]).length / sections.length) * 100) : 0}%
                </span>
              </div>

              {allDone && wordCount >= 50 && (
                <div className="mb-3 p-2 bg-green-100 rounded-xl border-2 border-green-400 text-center text-sm font-bold text-green-700 animate-pulse">
                  🎊 Ready to Finish! 🎊
                </div>
              )}

              <Button
                onClick={handlePublish}
                disabled={(!isTestMode && wordCount < 50) || !allDone}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white border-0 shadow-2xl py-5 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isTestMode ? (
                    <><span className="text-2xl">🎉</span>Finish Story (Test Mode)</>
                  ) : allDone ? (
                    <><span className="text-2xl">🎉</span>Finish Story</>
                  ) : (
                    <><span>⏳</span>Complete All Sections ({sections.filter((_, i) => sectionDone[i]).length}/{sections.length} done)</>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default GuidedWriting
