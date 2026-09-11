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
    const sources = ["/Cagentsit.webp", "/Cagenthang.webp", "/Cagentlike.webp", "/Cagentangry.webp"]
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
      setChatMessages(prev => [...prev, { id: userMsgId + 1, role: 'ai', text: 'Test mode: Section marked as complete!' }])
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
            text: 'Amazing work! You have completed all sections! Click "Finish Story" to continue!'
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
    writingMood === "angry" ? "/Cagentangry.webp"
    : writingMood === "like" ? "/Cagentlike.webp"
    : writingMood === "hang" ? "/Cagenthang.webp"
    : "/Cagentsit.webp"

  const allDone = sections.every((_, i) => sectionDone[i])

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
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
        
        {/* Pixel decorative elements */}
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
          {[...Array(8)].map((_, i) => (
            <div
              key={`flower-${i}`}
              className="absolute bottom-4"
              style={{
                left: `${10 + i * 12}%`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{
                background: ["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4],
                boxShadow: `3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, -3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 -3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}`
              }} />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-6">
        <StageHeader stage={4} title="Write Your Story" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">

          {/* LEFT: Chat Panel */}
          <div className="lg:col-span-5">
            <div
              className="pixel-panel flex flex-col"
              style={{ height: '680px' }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 shrink-0" style={{
                borderBottom: "4px solid #8b6914",
                background: "linear-gradient(180deg, #e8c547 0%, #c9a82e 100%)"
              }}>
                <button
                  type="button"
                  onClick={() => setWritingMood(prev => prev === "hang" ? "sit" : "hang")}
                  className="focus:outline-none"
                >
                  <img src={bearSrc} alt="Cagent Bear" className="h-14 w-14 object-contain drop-shadow-md" />
                </button>
                <div>
                  <h3 className="font-bold text-lg pixel-text" style={{ color: "#5a4a2a" }}>Cagent</h3>
                  <p className="text-xs" style={{ color: "#6b5210" }}>
                    {writingMood === "angry"
                      ? angryReason === "gibberish" ? "Confused" : "Not happy"
                      : writingMood === "like" ? "Impressed"
                      : writingMood === "hang" ? "Waiting..."
                      : "Ready to help"}
                  </p>
                </div>
                <div className="ml-auto text-sm font-bold pixel-chip" style={{ color: "#5a4a2a" }}>
                  {sections[currentSection] || `Section ${currentSection + 1}`}
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f5e6c8" }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <img src="/Cagentsit.webp" alt="" className="h-7 w-7 object-contain shrink-0" />
                    )}
                    <div
                      className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'pixel-btn-green text-white'
                          : 'pixel-card'
                      }`}
                      style={{
                        border: msg.role === 'user' ? '3px solid #3d8a3d' : '3px solid #8b6914',
                        boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
                        color: msg.role === 'user' ? '#fff' : '#5a4a2a'
                      }}
                    >
                      {msg.isLoading ? (
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-[#8b6914] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="inline-block w-2 h-2 bg-[#8b6914] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="inline-block w-2 h-2 bg-[#8b6914] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="shrink-0 p-4" style={{
                borderTop: "4px solid #8b6914",
                background: "#d9c9a6"
              }}>
                {writingMood === "angry" && (
                  <p className="text-xs mb-2 font-bold" style={{ color: "#c94b4b" }}>
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
                        ? "All sections complete! Click Finish Story"
                        : `Write your ${sections[currentSection] || 'story'} section here...`
                    }
                    className="flex-1 resize-none p-3 text-sm leading-relaxed pixel-input"
                    rows={3}
                    disabled={isSubmittingChat || allDone}
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isSubmittingChat || allDone}
                    className="pixel-btn pixel-btn-green px-4 py-3 h-auto text-lg font-bold disabled:opacity-40"
                  >
                    {isSubmittingChat ? (
                      <span className="animate-spin">*</span>
                    ) : '>'}
                  </Button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#6b5210" }}>Press Enter to submit - Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Story Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Story sections display */}
            <div className="pixel-panel p-6 flex-1">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center gap-2 pixel-title" style={{ color: "#8b6914" }}>
                  <span className="text-2xl">*</span>
                  Your Story
                </h3>
                <div className="text-sm font-bold pixel-chip" style={{ color: "#5a4a2a" }}>
                  {sections.filter((_, i) => sectionDone[i]).length}/{sections.length} sections - {wordCount} words
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
                    className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-all pixel-btn ${
                      currentSection === i
                        ? 'pixel-btn-blue pixel-selected'
                        : sectionDone[i]
                        ? 'pixel-btn-green'
                        : 'pixel-btn-wood opacity-60 cursor-default'
                    }`}
                  >
                    {section} {sectionDone[i] && <span className="ml-1">+</span>}
                  </button>
                ))}
              </div>

              {/* Section cards */}
              <div className="space-y-3">
                {sections.map((section, i) => (
                  <div
                    key={i}
                    className={`p-4 transition-all duration-300 ${
                      currentSection === i
                        ? 'pixel-selected'
                        : sectionDone[i]
                        ? ''
                        : 'opacity-50'
                    }`}
                    style={{
                      background: currentSection === i ? "#e8f4e8" : sectionDone[i] ? "#e8f4e8" : "#f5e6c8",
                      border: `3px solid ${currentSection === i ? "#5bc0de" : sectionDone[i] ? "#7ec850" : "#d9c9a6"}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: "#5a4a2a" }}>
                        {currentSection === i && !sectionDone[i] && <span style={{ color: "#5bc0de" }}>*</span>}
                        {sectionDone[i] && <span style={{ color: "#7ec850" }}>+</span>}
                        {section}
                        {currentSection === i && !sectionDone[i] && (
                          <span className="text-xs font-normal ml-1" style={{ color: "#5bc0de" }}>(writing now)</span>
                        )}
                      </span>
                      <span className="text-xs" style={{ color: "#8b6914" }}>
                        {countWords(sectionTexts[i] || '')} words
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed min-h-[3rem]"
                      style={{ color: sectionTexts[i] ? "#5a4a2a" : "#9a7b4f", fontStyle: sectionTexts[i] ? "normal" : "italic" }}
                    >
                      {sectionTexts[i] || (
                        currentSection === i
                          ? 'Your writing will appear here after you submit in the chat...'
                          : 'Not started yet'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress + Finish button */}
            <div className="pixel-panel p-5" style={{ background: "linear-gradient(180deg, #e8c547 0%, #c9a82e 100%)" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold flex items-center gap-2 pixel-text" style={{ color: "#5a4a2a" }}>
                  <span className="text-xl pixel-bounce">*</span>
                  Writing Progress
                </h4>
                <span className="text-sm" style={{ color: "#6b5210" }}>
                  {sections.filter((_, i) => sectionDone[i]).length}/{sections.length} sections complete
                </span>
              </div>

              {/* Pixel progress bar - crop growth style */}
              <div className="pixel-progress mb-4">
                <div
                  className="pixel-progress-bar"
                  style={{
                    width: `${sections.length ? (sections.filter((_, i) => sectionDone[i]).length / sections.length) * 100 : 0}%`
                  }}
                />
              </div>

              {allDone && wordCount >= 50 && (
                <div className="mb-3 p-2 text-center text-sm font-bold pixel-bounce" style={{
                  background: "#7ec850",
                  border: "3px solid #5a9a32",
                  color: "#fff"
                }}>
                  Ready to Finish!
                </div>
              )}

              <Button
                onClick={handlePublish}
                disabled={(!isTestMode && wordCount < 50) || !allDone}
                size="lg"
                className="w-full pixel-btn pixel-btn-green py-5 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {isTestMode ? (
                    <>* Finish Story (Test Mode)</>
                  ) : allDone ? (
                    <>* Finish Story</>
                  ) : (
                    <>... Complete All Sections ({sections.filter((_, i) => sectionDone[i]).length}/{sections.length} done)</>
                  )}
                </span>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default GuidedWriting
