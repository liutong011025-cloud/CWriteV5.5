"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { toast } from "sonner"
import { Wand2, Check, HelpCircle, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { PixelStarRating } from "@/components/ui/pixel-star-rating"

interface GrammarError {
  start: number
  end: number
  original: string
  corrected: string
  issue: string
}

interface StoryReviewProps {
  language: Language
  storyState: StoryState
  onReset: (finalStory: string) => void
  onEdit: (stage: "character" | "plot" | "structure" | "writing" | "storyEdit") => void
  onBack: () => void
  userId?: string
  workId?: string | null
}

export default function StoryReview({ storyState, onReset, onEdit, onBack, userId, workId }: StoryReviewProps) {
  const uploadPromptShownRef = useRef(false)
  
  const [isReviewing, setIsReviewing] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null)
  const [clickedErrorIndex, setClickedErrorIndex] = useState<number | null>(null)
  const [hoveredCorrectionIndex, setHoveredCorrectionIndex] = useState<number | null>(null)
  const [currentStory, setCurrentStory] = useState(storyState.story || "")

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  type Dim = "Vocabulary" | "Grammar" | "Coherence" | "Creativity" | "Structure"
  const [aiScores, setAiScores] = useState<Record<Dim, number> | null>(null)
  const [aiPraise, setAiPraise] = useState<string>("")
  const [aiImprovements, setAiImprovements] = useState<string[]>([])
  const [aiRatingLoading, setAiRatingLoading] = useState(false)

  useEffect(() => {
    // 首次进入完成页：询问是否上传到 Luminai Library（仅对新作品弹一次；编辑旧作品不弹）
    if (!storyState.story || !userId) return
    if (workId) return
    if (uploadPromptShownRef.current) return
    uploadPromptShownRef.current = true
    setShowUploadDialog(true)
  }, [storyState.story, userId, workId])

  useEffect(() => {
    if (storyState.story) {
      setCurrentStory(storyState.story)
      setGrammarErrors([])
      
      if (storyState.story.trim().length > 0) {
        const handleAutoReview = async () => {
          setIsReviewing(true)
          setGrammarErrors([])
          try {
            const response = await fetch("/api/dify-letter-grammar-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: storyState.story,
                type: 'story',
                user_id: userId || "student",
              }),
            })

            const data = await response.json()

            if (data.success && data.errors) {
              setGrammarErrors(data.errors)
              if (data.errors.length > 0) {
                toast.success(`Found ${data.errors.length} potential issue(s)`)
              }
            }
          } catch (error) {
            console.error("Error reviewing story:", error)
          } finally {
            setIsReviewing(false)
          }
        }
        
        handleAutoReview()
      }
    }
  }, [storyState.story, userId])

  useEffect(() => {
    if (!storyState.story || !userId) return
    let cancelled = false
    setAiRatingLoading(true)
    fetch("/api/story-ai-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: storyState.story,
        character: storyState.character,
        plot: storyState.plot,
        structure: storyState.structure,
        user_id: userId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.scores) {
          setAiScores(data.scores)
          setAiPraise(String(data.praise || ""))
          setAiImprovements(Array.isArray(data.improvements) ? data.improvements : [])
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiRatingLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storyState.story, userId])

  const handleUploadToLibrary = async () => {
    if (!userId || !storyState.story) return
    setIsUploading(true)
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          stage: "review",
          input: {
            character: storyState.character,
            plot: storyState.plot,
            structure: storyState.structure,
          },
          output: {
            story: currentStory,
          },
          story: currentStory,
          character: storyState.character,
          plot: storyState.plot,
          structure: storyState.structure,
          workId: workId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed")
      toast.success("Story uploaded to Luminai Library! ✨")
      setShowUploadDialog(false)
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleApplyCorrection = (errorIndex: number) => {
    const error = grammarErrors[errorIndex]
    if (!error) return

    const actualStart = error.start
    const actualEnd = error.end

    const before = currentStory.substring(0, actualStart)
    const after = currentStory.substring(actualEnd)
    const corrected = error.corrected.trim()
    
    const newStory = before + corrected + after

    setCurrentStory(newStory)

    const lengthDiff = corrected.length - (actualEnd - actualStart)
    const updatedErrors = grammarErrors
      .map((err: GrammarError, idx: number) => {
        if (idx === errorIndex) return null
        if (err.start >= actualEnd) {
          return {
            ...err,
            start: err.start + lengthDiff,
            end: err.end + lengthDiff,
          }
        }
        return err
      })
      .filter((err): err is GrammarError => err !== null)

    setGrammarErrors(updatedErrors)
    setClickedErrorIndex(null)
    toast.success("Correction applied!")
  }

  const renderHighlightedText = () => {
    if (grammarErrors.length === 0) {
      return <p className="leading-relaxed whitespace-pre-wrap text-base" style={{ overflowWrap: 'break-word', color: "#5a4a2a" }}>{currentStory}</p>
    }

    const parts: Array<{ text: string; isError: boolean; errorIndex?: number }> = []
    let lastIndex = 0
    
    const sortedErrors = [...grammarErrors]
      .map((error, originalIndex) => {
        return {
          ...error,
          start: error.start,
          end: error.end,
          originalIndex,
        }
      })
      .sort((a, b) => a.start - b.start)

    sortedErrors.forEach((error) => {
      if (error.start > lastIndex) {
        parts.push({ text: currentStory.substring(lastIndex, error.start), isError: false })
      }
      parts.push({
        text: currentStory.substring(error.start, error.end),
        isError: true,
        errorIndex: error.originalIndex,
      })
      lastIndex = error.end
    })

    if (lastIndex < currentStory.length) {
      parts.push({ text: currentStory.substring(lastIndex), isError: false })
    }

    const result: ReactNode[] = []

    parts.forEach((part, partIndex) => {
      const lines = part.text.split('\n')
      lines.forEach((line: string, lineIdx: number) => {
        if (lineIdx > 0) {
          result.push(<br key={`br-${partIndex}-${lineIdx}`} />)
        }

        if (part.isError && part.errorIndex !== undefined) {
          const error = grammarErrors[part.errorIndex]
          const isHovered = hoveredErrorIndex === part.errorIndex
          const isClicked = clickedErrorIndex === part.errorIndex

          result.push(
            <span
              key={`error-${partIndex}-${lineIdx}`}
              className="relative inline-block"
              onMouseEnter={() => setHoveredErrorIndex(part.errorIndex!)}
              onMouseLeave={() => setHoveredErrorIndex(null)}
              onClick={() => setClickedErrorIndex(clickedErrorIndex === part.errorIndex ? null : part.errorIndex!)}
            >
              <span
                className="cursor-pointer px-1"
                style={{ 
                  backgroundColor: isHovered ? '#e74c3c' : '#c0392b',
                  color: '#fff',
                  textDecoration: 'underline',
                  textDecorationColor: '#fff'
                }}
              >
                {line}
              </span>
              {isHovered && !isClicked && (
                <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 text-sm whitespace-nowrap" style={{
                  background: "#5a4a2a",
                  color: "#f5e6c8",
                  border: "3px solid #8b6914"
                }}>
                  <div>Click to see correction</div>
                </div>
              )}
              {isClicked && (
                <div className="absolute z-50 bottom-full left-0 mb-2 px-4 py-3 text-sm max-w-xs" style={{
                  background: "#5a4a2a",
                  color: "#f5e6c8",
                  border: "3px solid #8b6914"
                }}>
                  {error.issue.includes(':') ? (
                    <>
                      <div className="font-bold mb-1" style={{ color: "#e74c3c" }}>{error.issue.split(':')[0]}</div>
                      <div className="text-xs mb-2" style={{ color: "#d9c9a6" }}>{error.issue.split(':').slice(1).join(':').trim()}</div>
                    </>
                  ) : (
                    <div className="font-bold mb-2" style={{ color: "#e74c3c" }}>Issue: {error.issue}</div>
                  )}
                  <div className="mb-2">
                    <span style={{ color: "#8b6914" }}>Original: </span>
                    <span style={{ color: "#d9c9a6" }}>{error.original}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#8b6914" }}>Suggestion: </span>
                    <span className="font-bold" style={{ color: "#7ec850" }}>{error.corrected}</span>
                    <span
                      className="relative inline-flex items-center cursor-pointer ml-2"
                      onMouseEnter={() => setHoveredCorrectionIndex(part.errorIndex!)}
                      onMouseLeave={() => setHoveredCorrectionIndex(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApplyCorrection(part.errorIndex!)
                      }}
                    >
                      {hoveredCorrectionIndex === part.errorIndex ? (
                        <span className="flex items-center gap-1" style={{ color: "#7ec850" }}>
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span style={{ color: "#5a9a32", opacity: 0.7 }}>
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      {hoveredCorrectionIndex === part.errorIndex && (
                        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 text-sm whitespace-nowrap" style={{
                          background: "#5a9a32",
                          color: "#fff",
                          border: "2px solid #3d8a3d"
                        }}>
                          <div>Apply correction?</div>
                        </div>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </span>
          )
        } else {
          line.split('').forEach((char, charIdx) => {
            result.push(
              <span key={`normal-${partIndex}-${lineIdx}-${charIdx}`}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })
        }
      })
    })

    return <p className="leading-relaxed whitespace-pre-wrap text-base" style={{ color: "#5a4a2a" }}>{result}</p>
  }

  useEffect(() => {
    // no-op: preserved for future extension
  }, [storyState.story, userId, storyState.character, storyState.plot])


  const handleDownload = () => {
    if (!currentStory) return

    const content = `
STORY: ${storyState.character?.name}'s Adventure

CHARACTER: ${storyState.character?.name}
${storyState.character?.species ? `Species: ${storyState.character.species}` : ''}
Traits: ${storyState.character?.traits.join(", ")}

SETTING: ${storyState.plot?.setting}
CONFLICT: ${storyState.plot?.conflict}
GOAL: ${storyState.plot?.goal}

STORY TYPE: ${storyState.structure?.type}

---

${currentStory}

---
Created with Story Writer
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${storyState.character?.name}-story.txt`
    a.click()
  }

  const hasValidImage = storyState.structure?.imageUrl && 
    !storyState.structure.imageUrl.includes('dicebear.com') &&
    !storyState.structure.imageUrl.includes('placeholder')

  return (
    <div className="min-h-screen py-8 px-6 relative overflow-hidden pixel-theme" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 上传确认弹窗（隐私管理） */}
      {showUploadDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowUploadDialog(false)}
        >
          <div
            className="relative pixel-panel p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: "#e8c547" }} />
                <h2 className="text-3xl font-bold mb-2 pixel-text" style={{ color: "#6b5210" }}>
                  Upload to Luminai Library?
                </h2>
                <p className="text-lg pixel-text" style={{ color: "#5a4a2a" }}>
                  Would you like to save this story to your Luminai Library? You can edit it later.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleUploadToLibrary}
                  disabled={isUploading}
                  className="pixel-btn pixel-btn-green shadow-lg py-3 px-8 text-lg font-bold hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Yes, Upload
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isUploading}
                  variant="outline"
                  className="pixel-btn pixel-btn-wood shadow-lg font-bold py-3 px-8 text-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
        <StageHeader stage={5} title="Your Story is Complete!" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          {/* Story content with grammar highlights */}
          <div className="lg:col-span-8 space-y-6">
            <div className="pixel-panel p-8">
              <h2 
                className="text-3xl font-extrabold mb-4"
                style={{ 
                  color: "#5a4a2a",
                  textShadow: "2px 2px 0 rgba(0,0,0,0.2)"
                }}
              >
                {storyState.character?.name}&apos;s Adventure
              </h2>
              <p className="text-base font-bold mb-6" style={{ color: "#6b5210" }}>
                {storyState.plot?.setting} | {storyState.structure?.type}
              </p>
              <div className="p-6" style={{ 
                background: "#fff",
                border: "4px solid #8b6914",
                boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.1), inset 3px 3px 0 rgba(255,255,255,0.3)"
              }}>
                {isReviewing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mx-auto mb-6 w-16 h-16">
                        <div className="absolute inset-0" style={{ border: "4px solid #d9c9a6" }}></div>
                        <div className="absolute inset-0 animate-spin" style={{ 
                          border: "4px solid transparent",
                          borderTopColor: "#7ec850"
                        }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 animate-pulse" style={{ color: "#7ec850" }} />
                        </div>
                      </div>
                      <p className="text-lg font-bold animate-pulse" style={{ color: "#5a4a2a" }}>
                        Loading article...
                      </p>
                      <p className="text-sm mt-2 font-bold" style={{ color: "#6b5210" }}>
                        Please wait
                      </p>
                    </div>
                ) : (
                  renderHighlightedText()
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={handleDownload} 
                size="lg"
                className="pixel-btn pixel-btn-green py-6 text-lg font-bold"
              >
                Download Story
              </Button>
              <Button 
                onClick={() => onEdit("storyEdit")} 
                size="lg"
                className="pixel-btn py-6 text-lg font-bold"
                style={{
                  background: "linear-gradient(180deg, #e67e22 0%, #d35400 100%)",
                  border: "4px solid #c0392b",
                  color: "#fff",
                  boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2), 4px 4px 0 rgba(0,0,0,0.25)"
                }}
              >
                Edit Story
              </Button>
            </div>
          </div>

          {/* Story Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="pixel-panel p-5">
              <h3 className="text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
                Story Summary
              </h3>
              <div className="space-y-2">
                {/* AI评分（像素风星星）- 放在最上面 */}
                <div
                  className="p-4 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, #fff 0%, #f5e6c8 100%)",
                    border: "3px solid #8b6914",
                    boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.6), 3px 3px 0 rgba(0,0,0,0.15)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span />
                    <span className="ai-score-sparkle text-lg" aria-hidden="true">✦</span>
                  </div>
                  {aiRatingLoading && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold" style={{ color: "#6b5210" }}>Scoring...</p>
                      <div className="h-2 w-full" style={{ background: "#d9c9a6", border: "2px solid #8b6914" }}>
                        <div className="ai-score-bar h-full" style={{ background: "#7ec850" }} />
                      </div>
                    </div>
                  )}
                  {!aiRatingLoading && aiScores && (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        {(Object.keys(aiScores) as Array<keyof typeof aiScores>).map((k) => (
                          <div key={String(k)} className="flex items-center justify-between gap-3">
                            <span className="text-xs font-extrabold" style={{ color: "#6b5210" }}>
                              {String(k)}
                            </span>
                            <div className="ai-star-wrap">
                              <PixelStarRating value={aiScores[k] as number} pixel={3} gap={6} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {!!aiPraise && (
                        <div
                          className="mt-2 p-3"
                          style={{
                            background: "#d4e8b4",
                            border: "2px solid #5a9a32",
                            boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.35)",
                          }}
                        >
                          <p className="text-sm font-bold leading-relaxed" style={{ color: "#2d5016" }}>
                            {aiPraise}
                          </p>
                        </div>
                      )}

                      {aiImprovements.length > 0 && (
                        <div
                          className="mt-2 p-3 ai-tips"
                          style={{
                            background: "#c5e4f5",
                            border: "2px solid #5bc0de",
                            boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.35)",
                          }}
                        >
                          <p className="text-sm font-extrabold mb-2" style={{ color: "#1a4a6a" }}>
                            Tips to improve
                          </p>
                          <div className="space-y-1.5">
                            {aiImprovements.slice(0, 4).map((tip, idx) => (
                              <div key={idx} className="flex gap-2 items-start ai-tip-line">
                                <span className="mt-0.5" aria-hidden="true" style={{ color: "#e8c547" }}>✶</span>
                                <p className="text-sm leading-relaxed" style={{ color: "#2a5a7a" }}>
                                  {tip}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <style jsx>{`
                        .ai-score-sparkle {
                          color: #e8c547;
                          text-shadow: 2px 2px 0 rgba(0,0,0,0.25);
                          animation: sparkle 1.6s ease-in-out infinite;
                        }
                        .ai-score-bar {
                          width: 35%;
                          animation: loadingbar 1.05s ease-in-out infinite;
                        }
                        .ai-tip-line {
                          animation: tipin 420ms ease both;
                        }
                        .ai-tip-line:nth-child(2) { animation-delay: 70ms; }
                        .ai-tip-line:nth-child(3) { animation-delay: 140ms; }
                        .ai-tip-line:nth-child(4) { animation-delay: 210ms; }
                        @keyframes sparkle {
                          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
                          50% { transform: translateY(-2px) rotate(6deg); opacity: 1; }
                        }
                        @keyframes loadingbar {
                          0% { transform: translateX(-10%); width: 20%; }
                          50% { transform: translateX(60%); width: 40%; }
                          100% { transform: translateX(-10%); width: 20%; }
                        }
                        @keyframes tipin {
                          from { opacity: 0; transform: translateY(3px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                    </div>
                  )}
                </div>

                <div className="p-2.5" style={{ background: "#d4e8b4", border: "3px solid #5a9a32" }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "#3d5a1f" }}>Character</p>
                  <p className="text-sm font-extrabold" style={{ color: "#2d5016" }}>{storyState.character?.name}</p>
                </div>
                {storyState.character?.species && (
                  <div className="p-2.5" style={{ background: "#c5e4f5", border: "3px solid #5bc0de" }}>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#2a5a7a" }}>Species</p>
                    <p className="text-sm font-extrabold" style={{ color: "#1a4a6a" }}>{storyState.character.species}</p>
                  </div>
                )}
                <div className="p-2.5" style={{ background: "#f5e6c8", border: "3px solid #c4a020" }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "#8b6914" }}>Setting</p>
                  <p className="text-sm font-extrabold" style={{ color: "#6b5210" }}>{storyState.plot?.setting}</p>
                </div>
                <div className="p-2.5" style={{ background: "#e8d4f5", border: "3px solid #9b59b6" }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "#7b3f96" }}>Type</p>
                  <p className="text-sm font-extrabold capitalize" style={{ color: "#5a2f76" }}>{storyState.structure?.type}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onReset(currentStory)} 
              size="lg" 
              className="w-full pixel-btn pixel-btn-blue py-4 text-sm font-bold"
            >
              Back to Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
