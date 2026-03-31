"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { toast } from "sonner"
import { Wand2, Check, HelpCircle } from "lucide-react"

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
  onEdit: (stage: "character" | "plot" | "structure" | "writing") => void
  onBack: () => void
  userId?: string
  workId?: string | null
}

export default function StoryReview({ storyState, onReset, onEdit, onBack, userId, workId }: StoryReviewProps) {
  const hasSavedRef = useRef(false)
  const savedStoryRef = useRef<string>("")
  
  const [isReviewing, setIsReviewing] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null)
  const [clickedErrorIndex, setClickedErrorIndex] = useState<number | null>(null)
  const [hoveredCorrectionIndex, setHoveredCorrectionIndex] = useState<number | null>(null)
  const [currentStory, setCurrentStory] = useState(storyState.story || "")

  useEffect(() => {
    if (storyState.story && userId && (!hasSavedRef.current || savedStoryRef.current !== storyState.story)) {
      hasSavedRef.current = true
      savedStoryRef.current = storyState.story
      
      fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      .then(res => res.json())
      .then(data => {
        console.log('Story saved successfully:', data)
        if (data.success) {
          console.log('Story saved to database')
        }
      })
      .catch((error) => {
        console.error("Error saving story to interactions:", error)
        hasSavedRef.current = false
      })
    }
  }, [storyState.story, userId, storyState.character, storyState.plot, storyState.structure])

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

    const result: JSX.Element[] = []

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
