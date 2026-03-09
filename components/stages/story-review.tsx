"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { toast } from "sonner"
import { Loader2, Wand2, Check, HelpCircle } from "lucide-react"

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
  workId?: string | null // 如果提供，表示正在编辑已保存的作品
}

export default function StoryReview({ storyState, onReset, onEdit, onBack, userId, workId }: StoryReviewProps) {
  // 使用ref来跟踪是否已经保存过，避免重复保存
  const hasSavedRef = useRef(false)
  const savedStoryRef = useRef<string>("")
  
  // 视频生成相关状态
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const videoGeneratedRef = useRef(false)

  // 语法检查相关状态
  const [isReviewing, setIsReviewing] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null)
  const [clickedErrorIndex, setClickedErrorIndex] = useState<number | null>(null)
  const [hoveredCorrectionIndex, setHoveredCorrectionIndex] = useState<number | null>(null)
  const [currentStory, setCurrentStory] = useState(storyState.story || "")

  // 保存故事内容到interactions API
  useEffect(() => {
    // 只有当故事内容改变且还没有保存过时，才保存
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
          story: currentStory, // 保存完整故事内容（使用修正后的版本）
          character: storyState.character, // 需要在顶层传递
          plot: storyState.plot, // 需要在顶层传递
          structure: storyState.structure, // 需要在顶层传递
          workId: workId || undefined, // 如果正在编辑，传递 workId
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
        // 如果保存失败，重置标记以便重试
        hasSavedRef.current = false
      })
    }
  }, [storyState.story, userId, storyState.character, storyState.plot, storyState.structure])

  // 同步story变化并自动进行语法检查
  useEffect(() => {
    if (storyState.story) {
      setCurrentStory(storyState.story)
      setGrammarErrors([])
      
      // 自动进行语法检查
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
                toast.success(`Found ${data.errors.length} potential issue(s) 📝`)
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

  // 应用语法修正
  const handleApplyCorrection = (errorIndex: number) => {
    const error = grammarErrors[errorIndex]
    if (!error) return

    // 使用AI返回的位置（已经是完整单词）
    const actualStart = error.start
    const actualEnd = error.end

    // 直接替换完整单词
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
    setClickedErrorIndex(null) // 关闭修正建议
    toast.success("Correction applied! ✨")
  }

  // 渲染带高亮的文本
  const renderHighlightedText = () => {
    if (grammarErrors.length === 0) {
      return <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base font-serif" style={{ overflowWrap: 'break-word' }}>{currentStory}</p>
    }

    const parts: Array<{ text: string; isError: boolean; errorIndex?: number }> = []
    let lastIndex = 0
    
    // 使用AI返回的位置（已经是完整单词）
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
        errorIndex: error.originalIndex, // 使用保存的原始索引
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
                className="bg-red-200 text-red-900 underline decoration-red-500 decoration-2 cursor-pointer rounded px-1"
                style={{ backgroundColor: isHovered ? '#fecaca' : '#fee2e2' }}
              >
                {line}
              </span>
              {/* 悬停提示 */}
              {isHovered && !isClicked && (
                <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                  <div>Click to see correction</div>
                  <div className="absolute bottom-0 left-4 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
              {/* 点击后显示错误详情和修正建议 */}
              {isClicked && (
                <div className="absolute z-50 bottom-full left-0 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs">
                  {error.issue.includes(':') ? (
                    <>
                      <div className="font-bold mb-1 text-red-300">{error.issue.split(':')[0]}</div>
                      <div className="text-gray-300 text-xs mb-2">{error.issue.split(':').slice(1).join(':').trim()}</div>
                    </>
                  ) : (
                    <div className="font-bold mb-2 text-red-300">Issue: {error.issue}</div>
                  )}
                  <div className="mb-2">
                    <span className="text-gray-400">Original: </span>
                    <span className="text-gray-300">{error.original}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Suggestion: </span>
                    <span className="text-green-400 font-semibold">{error.corrected}</span>
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
                        <span className="flex items-center gap-1 text-green-400 hover:text-green-300">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-green-500 opacity-70 hover:opacity-100 transition-opacity">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      {hoveredCorrectionIndex === part.errorIndex && (
                        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                          <div>Apply correction?</div>
                          <div className="absolute bottom-0 left-4 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-4 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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

    return <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base font-serif">{result}</p>
  }

  // 自动生成视频 - 暂时关闭
  useEffect(() => {
    // 暂时关闭视频生成功能
    // if (storyState.story && !videoGeneratedRef.current) {
    //   videoGeneratedRef.current = true
    //   setIsGeneratingVideo(true)
    //   
    //   const generateVideo = async () => {
    //     if (!storyState.story) {
    //       return
    //     }
    //
    //     setIsGeneratingVideo(true)
    //     try {
    //       const response = await fetch("/api/generate-story-video", {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //           story: storyState.story,
    //           character: storyState.character,
    //           plot: storyState.plot,
    //           user_id: userId,
    //         }),
    //       })
    //
    //       const data = await response.json()
    //
    //       if (data.error) {
    //         console.error("Video generation failed:", data.error)
    //         setIsGeneratingVideo(false)
    //         return
    //       }
    //
    //       if (data.videoUrl) {
    //         setVideoUrl(data.videoUrl)
    //         setIsGeneratingVideo(false)
    //       } else {
    //         setIsGeneratingVideo(false)
    //       }
    //     } catch (error: any) {
    //       console.error("Error generating video:", error)
    //       setIsGeneratingVideo(false)
    //     }
    //   }
    //   
    //   generateVideo()
    // }
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

  // 检查是否有有效的图片URL（不是占位符）
  const hasValidImage = storyState.structure?.imageUrl && 
    !storyState.structure.imageUrl.includes('dicebear.com') &&
    !storyState.structure.imageUrl.includes('placeholder')

  return (
    <div className="min-h-screen py-8 px-6 relative" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景：如果有有效图片则显示图片，否则显示彩色渐变背景 */}
      {hasValidImage ? (
        <div className="fixed inset-0 z-0">
          <img
            src={storyState.structure.imageUrl}
            alt="Story background"
            className="w-full h-full object-cover"
            style={{
              filter: 'blur(8px) brightness(0.85)',
              transform: 'scale(1.05)',
            }}
          />
        </div>
      ) : (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50">
          {/* 彩色渐变背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
            <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader stage={5} title="Your Story is Complete!" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          {/* 左侧：视频容器 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-purple-100/95 via-pink-100/95 to-orange-100/95 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-300 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Story Video
              </h3>
              
              {isGeneratingVideo ? (
                <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-8 border-2 border-purple-200 min-h-[400px] flex items-center justify-center">
                  {/* 有趣的加载动画 */}
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 w-24 h-24">
                      {/* 旋转的圆圈 */}
                      <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-4 border-pink-200 rounded-full"></div>
                      <div className="absolute inset-2 border-4 border-transparent border-t-pink-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      {/* 中心图标 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl animate-pulse">🎬</span>
                      </div>
                    </div>
                    
                    {/* 文字动画 */}
                    <div className="space-y-2">
                      <p className="text-purple-700 text-lg font-semibold animate-pulse">
                        Generating Video...
                      </p>
                      <p className="text-gray-600 text-sm">
                        This may take a few minutes
                      </p>
                      
                      {/* 跳动的点 */}
                      <div className="flex justify-center gap-2 mt-4">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-xl">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support video playback
                    </video>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 border-2 border-gray-300 min-h-[400px] flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Video will appear here once generated
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 中间：故事内容 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-purple-100/95 via-pink-100/95 to-orange-100/95 backdrop-blur-md rounded-2xl p-10 border-2 border-purple-300 shadow-2xl">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                {storyState.character?.name}'s Adventure
              </h2>
              <p className="text-lg text-gray-700 mb-8 font-semibold">
                {storyState.plot?.setting} • {storyState.structure?.type}
              </p>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-200 shadow-inner" style={{ overflowWrap: 'break-word' }}>
                {isReviewing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mx-auto mb-6 w-16 h-16">
                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-pink-200 rounded-full"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-t-pink-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-purple-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-purple-700 text-lg font-semibold animate-pulse">
                        Loading article...
                      </p>
                      <p className="text-gray-600 text-sm mt-2">
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-xl py-6 text-lg font-bold"
              >
                Download Story
              </Button>
              <Button 
                onClick={() => onEdit("storyEdit")} 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0 shadow-xl py-6 text-lg font-bold"
              >
                Edit Story
              </Button>
            </div>
          </div>

          {/* 右侧：Story Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200 shadow-xl">
              <h3 className="text-lg font-bold mb-3 text-indigo-700">Story Summary</h3>
              <div className="space-y-2">
                <div className="bg-white/80 rounded-lg p-2.5 border-2 border-indigo-200">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Character</p>
                  <p className="text-sm font-bold text-indigo-700">{storyState.character?.name}</p>
                </div>
                {storyState.character?.species && (
                  <div className="bg-white/80 rounded-lg p-2.5 border-2 border-purple-200">
                    <p className="text-xs text-gray-600 font-semibold mb-0.5">Species</p>
                    <p className="text-sm font-bold text-purple-700">{storyState.character.species}</p>
                  </div>
                )}
                <div className="bg-white/80 rounded-lg p-2.5 border-2 border-pink-200">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Setting</p>
                  <p className="text-sm font-bold text-pink-700">{storyState.plot?.setting}</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2.5 border-2 border-orange-200">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Type</p>
                  <p className="text-sm font-bold text-orange-700 capitalize">{storyState.structure?.type}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onReset(currentStory)} 
              size="lg" 
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-xl py-4 text-sm font-bold"
            >
              Back to Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

