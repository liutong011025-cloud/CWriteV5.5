"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { toast } from "sonner"
import { Wand2, Check, HelpCircle } from "lucide-react"

interface GrammarError {
  start: number
  end: number
  original: string
  corrected: string
  issue: string
}

interface BookReviewCompleteProps {
  reviewType: "recommendation" | "critical" | "literary"
  bookTitle: string
  review: string
  bookCoverUrl?: string
  bookSummary?: string
  structure?: {
    type: "recommendation" | "critical" | "literary"
    outline: string[]
  } | null
  onReset: (finalReview: string) => void
  onBack: () => void
  onEdit?: () => void
  userId?: string
  isNoAi?: boolean
  workId?: string | null // 如果提供，表示正在编辑已保存的作品
}

const reviewTypeNames = {
  recommendation: "Recommendation Review",
  critical: "Critical Review",
  literary: "Literary Review",
}

export default function BookReviewComplete({
  reviewType,
  bookTitle,
  review,
  bookCoverUrl,
  bookSummary,
  structure,
  onReset,
  onBack,
  onEdit,
  userId,
  isNoAi = false,
  workId,
}: BookReviewCompleteProps) {
  const [copied, setCopied] = useState(false)
  const hasSavedRef = useRef(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null)
  const [clickedErrorIndex, setClickedErrorIndex] = useState<number | null>(null)
  const [hoveredCorrectionIndex, setHoveredCorrectionIndex] = useState<number | null>(null)
  const [currentReview, setCurrentReview] = useState(review)

  // 同步review变化并自动进行语法检查
  useEffect(() => {
    if (review) {
      setCurrentReview(review)
      setGrammarErrors([])
      
      // 自动进行语法检查
      if (review.trim().length > 0) {
        const handleAutoReview = async () => {
          setIsReviewing(true)
          setGrammarErrors([])
          try {
            const response = await fetch("/api/dify-letter-grammar-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: review,
                type: 'review',
                bookTitle,
                reviewType,
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
            console.error("Error reviewing book review:", error)
          } finally {
            setIsReviewing(false)
          }
        }
        
        handleAutoReview()
      }
    }
  }, [review, bookTitle, reviewType, userId])

  // 应用语法修正
  const handleApplyCorrection = (errorIndex: number) => {
    const error = grammarErrors[errorIndex]
    if (!error) return

    // 使用AI返回的位置（已经是完整单词）
    const actualStart = error.start
    const actualEnd = error.end

    // 直接替换完整单词
    const before = currentReview.substring(0, actualStart)
    const after = currentReview.substring(actualEnd)
    const corrected = error.corrected.trim()
    
    const newReview = before + corrected + after

    setCurrentReview(newReview)

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
      return <pre className="whitespace-pre-wrap text-gray-800 text-lg leading-relaxed font-serif" style={{ fontFamily: 'var(--font-comic-neue)', overflowWrap: 'break-word' }}>{currentReview}</pre>
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
        parts.push({ text: currentReview.substring(lastIndex, error.start), isError: false })
      }
      parts.push({
        text: currentReview.substring(error.start, error.end),
        isError: true,
        errorIndex: error.originalIndex, // 使用保存的原始索引
      })
      lastIndex = error.end
    })

    if (lastIndex < currentReview.length) {
      parts.push({ text: currentReview.substring(lastIndex), isError: false })
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

    return <pre className="whitespace-pre-wrap text-gray-800 text-lg leading-relaxed font-serif" style={{ fontFamily: 'var(--font-comic-neue)', overflowWrap: 'break-word' }}>{result}</pre>
  }

  // 自动保存到 gallery
  useEffect(() => {
    if (review && !hasSavedRef.current) {
      hasSavedRef.current = true
      console.log('Saving book review to gallery:', {
        userId,
        reviewType,
        bookTitle,
        hasReview: !!review,
        hasCover: !!bookCoverUrl
      })
      
      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "default-user",
          stage: "bookReviewComplete",
          review,
          reviewType,
          bookTitle,
          bookCoverUrl,
          bookSummary: bookSummary || "", // 传递 bookSummary
          review, // 传递 review 内容
          workId: workId || undefined, // 如果正在编辑，传递 workId
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('Book review saved successfully:', data)
        if (data.success) {
          toast.success("Review saved to gallery!")
        }
      })
      .catch((error) => {
        console.error("Error saving review to interactions:", error)
        hasSavedRef.current = false
        toast.error("Failed to save review to gallery")
      })
    }
  }, [review, reviewType, bookTitle, bookCoverUrl, userId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentReview)
      setCopied(true)
      toast.success("Review copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy review")
    }
  }

  const handleSave = async () => {
    try {
      // 保存到后端
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "default-user",
          stage: "bookReviewComplete",
          type: "bookReview",
          data: {
            review: currentReview,
            reviewType,
            bookTitle,
            bookCoverUrl,
          },
          review: currentReview,
          reviewType,
          bookTitle,
          bookCoverUrl,
        }),
      })

      if (response.ok) {
        toast.success("Review saved successfully!")
      }
    } catch (error) {
      console.error("Error saving review:", error)
      toast.error("Failed to save review")
    }
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
            🎉 Your Review is Complete! 🎉
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            {reviewTypeNames[reviewType]} for <strong>{bookTitle}</strong>
          </p>
        </div>

        <div className={isNoAi ? "max-w-4xl mx-auto" : "grid lg:grid-cols-12 gap-8"}>
          {/* 左侧：书封面 - 非AI用户不显示 */}
          {!isNoAi && (
            <div className="lg:col-span-4">
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-amber-300 shadow-2xl backdrop-blur-sm sticky top-8">
                <h2 className="text-2xl font-bold mb-6 text-amber-700 flex items-center gap-2">
                  <span className="text-3xl">📖</span>
                  Book Cover
                </h2>
                {bookCoverUrl ? (
                  <div className="relative w-full max-w-[200px] mx-auto aspect-[2/3] rounded-xl overflow-hidden border-4 border-amber-400 shadow-xl">
                    <Image
                      src={bookCoverUrl}
                      alt={`Cover of ${bookTitle}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="relative w-full aspect-[2/3] rounded-xl bg-gray-200 flex items-center justify-center border-4 border-amber-400 shadow-xl">
                    <p className="text-gray-500">Cover generating...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 右侧：完成的review */}
          <div className={isNoAi ? "" : "lg:col-span-8"}>
            <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl p-10 border-4 border-purple-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              {/* 纸张纹理效果 */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}></div>

              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6 text-purple-700 flex items-center gap-3">
                  <span className="text-4xl">✨</span>
                  Your Complete Review
                </h2>

                <div className="bg-white/90 rounded-2xl p-8 border-3 border-purple-200 shadow-lg mb-6" style={{ overflowWrap: 'break-word' }}>
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

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    onClick={handleCopy}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-xl py-6 px-8 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300"
                  >
                    {copied ? (
                      <>
                        <span className="text-2xl mr-2">✓</span>
                        Copied!
                      </>
                    ) : (
                      <>
                        <span className="text-xl mr-2">📋</span>
                        Copy Review
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-xl py-6 px-8 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300"
                  >
                    <span className="text-xl mr-2">💾</span>
                    Save Review
                  </Button>

                  <Button
                    onClick={() => onReset(currentReview)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-xl py-6 px-8 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300"
                  >
                    <span className="text-xl mr-2">🏠</span>
                    Back to Map
                  </Button>

                  <Button
                    onClick={() => {
                      if (onEdit) {
                        onEdit()
                      } else {
                        onBack()
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="bg-white/80 backdrop-blur-lg border-3 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg py-6 px-8 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300"
                  >
                    <span className="text-xl mr-2">←</span>
                    Edit Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

