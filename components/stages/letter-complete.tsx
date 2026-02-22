"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import StageHeader from "@/components/stage-header"
import { Mail, Copy, Download, Send, CheckCircle2, Sparkles, Loader2, Wand2, Check, HelpCircle } from "lucide-react"

interface GrammarError {
  start: number
  end: number
  original: string
  corrected: string
  issue: string
}

interface LetterCompleteProps {
  recipient: string
  occasion: string
  letter: string
  guidance?: string | null
  readerImageUrl?: string | null
  sections?: string[]
  onReset: () => void
  onBack: () => void
  onEdit?: () => void
  userId?: string
  workId?: string | null // 如果提供，表示正在编辑已保存的作品
}

export default function LetterComplete({
  recipient,
  occasion,
  letter,
  guidance,
  readerImageUrl,
  sections,
  onReset,
  onBack,
  onEdit,
  userId,
  workId,
}: LetterCompleteProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null)
  const [clickedErrorIndex, setClickedErrorIndex] = useState<number | null>(null)
  const [hoveredCorrectionIndex, setHoveredCorrectionIndex] = useState<number | null>(null)
  const [currentLetter, setCurrentLetter] = useState(letter)
  const hasSavedRef = useRef(false)
  const savedLetterRef = useRef<string>("")
  const uploadPromptShownRef = useRef(false)

  // 同步letter变化并自动进行语法检查
  useEffect(() => {
    setCurrentLetter(letter)
    setGrammarErrors([]) // 重置错误列表
    
    // 自动进行语法检查
    if (letter && letter.trim().length > 0) {
      const handleAutoReview = async () => {
        setIsReviewing(true)
        setGrammarErrors([])
        try {
          const response = await fetch("/api/dify-letter-grammar-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: letter,
              type: 'letter',
              recipient,
              occasion,
              user_id: userId || "student",
            }),
          })

          const data = await response.json()
          console.log("Grammar review response:", data)

          if (data.success && data.errors) {
            console.log("Grammar errors found:", data.errors.length, data.errors)
            // 验证错误数据，确保有有效的start和end
            const validErrors = data.errors.filter((err: any) => {
              const isValid = err && err.original && err.corrected && 
                             typeof err.start === 'number' && typeof err.end === 'number' &&
                             err.start >= 0 && err.end > err.start
              if (!isValid) {
                console.warn("Invalid error data:", err)
              }
              return isValid
            })
            console.log("Valid errors after filtering:", validErrors.length, validErrors)
            setGrammarErrors(validErrors)
            if (validErrors.length === 0) {
              // 没有错误时不显示提示，静默完成
            } else {
              toast.success(`Found ${validErrors.length} potential issue(s) 📝`)
            }
          } else {
            // 静默失败，不显示错误提示
            console.error("Grammar review failed:", data.error)
            console.error("Full response:", data)
          }
        } catch (error) {
          console.error("Error reviewing letter:", error)
          // 静默失败，不显示错误提示
        } finally {
          setIsReviewing(false)
        }
      }
      
      handleAutoReview()
    }
  }, [letter, recipient, occasion, userId])

  // 显示上传确认弹窗（只显示一次）
  useEffect(() => {
    if (letter && userId && !uploadPromptShownRef.current && !workId) {
      uploadPromptShownRef.current = true
      setShowUploadDialog(true)
    }
  }, [letter, userId, workId])

  // 保存信件内容到interactions API（上传到library）
  const handleUploadToLibrary = async () => {
    setIsUploading(true)
    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          stage: "letterComplete",
          input: {
            recipient,
            occasion,
            sections: sections || [],
          },
          output: {
            letter: currentLetter,
            guidance: guidance || null,
            readerImageUrl: readerImageUrl || null,
          },
          letter: currentLetter, // 保存完整信件内容（使用修正后的版本）
          recipient,
          occasion,
          guidance: guidance || null,
          readerImageUrl: readerImageUrl || null,
          workId: workId || undefined, // 如果正在编辑，传递 workId
        }),
      })
      
      const data = await response.json()
      console.log('Letter saved successfully:', data)
      if (data.success) {
        console.log('Letter saved to database')
        toast.success("Letter uploaded to Luminai Library! ✨")
        hasSavedRef.current = true
        savedLetterRef.current = currentLetter
      } else {
        toast.error("Failed to upload letter to library")
      }
    } catch (error) {
      console.error("Error saving letter to interactions:", error)
      toast.error("Failed to upload letter to library")
    } finally {
      setIsUploading(false)
      setShowUploadDialog(false)
    }
  }

  // 如果正在编辑已存在的作品，自动保存（不显示弹窗）
  useEffect(() => {
    if (currentLetter && userId && workId && (!hasSavedRef.current || savedLetterRef.current !== currentLetter)) {
      hasSavedRef.current = true
      savedLetterRef.current = currentLetter
      
      fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          stage: "letterComplete",
          input: {
            recipient,
            occasion,
            sections: sections || [],
          },
          output: {
            letter: currentLetter,
            guidance: guidance || null,
            readerImageUrl: readerImageUrl || null,
          },
          letter: currentLetter,
          recipient,
          occasion,
          guidance: guidance || null,
          readerImageUrl: readerImageUrl || null,
          workId: workId,
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('Letter saved successfully:', data)
        if (data.success) {
          console.log('Letter saved to database')
        }
      })
      .catch((error) => {
        console.error("Error saving letter to interactions:", error)
        hasSavedRef.current = false
      })
    }
  }, [currentLetter, userId, recipient, occasion, workId, sections, guidance, readerImageUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentLetter)
      setCopied(true)
      toast.success("Letter copied to clipboard! 📋✨")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy letter")
    }
  }

  const handleDownload = () => {
    const content = `
LETTER TO: ${recipient}
OCCASION: ${occasion}

---

${currentLetter}

---

Created with CWrite
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `letter-to-${recipient.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Letter downloaded! 📥")
  }

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address! 📧")
      return
    }

    // 简单的邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address! 📧")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/send-letter-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          recipient,
          occasion,
          letter: currentLetter,
          user_id: userId || "student",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailSent(true)
        toast.success("Letter sent successfully! 📧✨")
      } else {
        toast.error(data.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }


  // 应用语法修正
  const handleApplyCorrection = (errorIndex: number) => {
    const error = grammarErrors[errorIndex]
    if (!error) return

    // 使用AI返回的位置（已经是完整单词）
    const actualStart = error.start
    const actualEnd = error.end

    // 直接替换完整单词
    const before = currentLetter.substring(0, actualStart)
    const after = currentLetter.substring(actualEnd)
    const corrected = error.corrected.trim() // 只移除修正文本两端的空格
    
    const newLetter = before + corrected + after

    setCurrentLetter(newLetter)

    // 更新错误列表中的索引（因为文本长度可能改变）
    const lengthDiff = corrected.length - (actualEnd - actualStart)
    const updatedErrors = grammarErrors
      .map((err, idx) => {
        if (idx === errorIndex) return null // 移除已修正的错误
        if (err.start >= actualEnd) {
          // 错误在修正位置之后，需要调整索引
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
    console.log("Rendering text, grammarErrors:", grammarErrors.length, grammarErrors, "currentLetter length:", currentLetter.length)
    if (grammarErrors.length === 0) {
      // 没有错误时，正常显示
      return currentLetter.split('\n').map((line, lineIndex) => {
        const previousChars = currentLetter.split('\n').slice(0, lineIndex).join('\n').length + lineIndex
        return (
          <div key={lineIndex} className="relative" style={{ overflowWrap: 'break-word' }}>
            {line.split('').map((char, charIndex) => {
              const totalCharIndex = previousChars + charIndex
              return (
                <span
                  key={`${lineIndex}-${charIndex}`}
                  className="animate-typewriter inline-block"
                  style={{
                    animationDelay: `${totalCharIndex * 0.03}s`,
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              )
            })}
            {lineIndex < currentLetter.split('\n').length - 1 && <br />}
          </div>
        )
      })
    }

    // 有错误时，高亮显示
    const parts: Array<{ text: string; isError: boolean; errorIndex?: number }> = []
    let lastIndex = 0

    // 按开始位置排序错误，使用AI返回的位置（已经是完整单词）
    const sortedErrors = [...grammarErrors]
      .map((error, originalIndex) => {
        return {
          ...error,
          start: error.start,
          end: error.end,
          originalIndex, // 保存原始索引
        }
      })
      .sort((a, b) => a.start - b.start)

    sortedErrors.forEach((error) => {
      console.log("Processing error:", error, "start:", error.start, "end:", error.end, "currentLetter length:", currentLetter.length)
      
      // 验证错误位置是否有效
      if (error.start < 0 || error.end > currentLetter.length || error.start >= error.end) {
        console.warn("Invalid error position, skipping:", error)
        return
      }
      
      // 添加错误前的文本
      if (error.start > lastIndex) {
        parts.push({
          text: currentLetter.substring(lastIndex, error.start),
          isError: false,
        })
      }

      // 添加错误文本（已扩展为完整单词）
      const errorText = currentLetter.substring(error.start, error.end)
      if (errorText) {
        parts.push({
          text: errorText,
          isError: true,
          errorIndex: error.originalIndex, // 使用保存的原始索引
        })
        lastIndex = error.end
      } else {
        console.warn("Empty error text, skipping:", error)
      }
    })

    // 添加最后剩余的文本
    if (lastIndex < currentLetter.length) {
      parts.push({
        text: currentLetter.substring(lastIndex),
        isError: false,
      })
    }

    // 渲染parts，处理换行 - 只highlight错误，不显示修正建议在文本中
    const result: JSX.Element[] = []
    
    console.log("Parts to render:", parts.length, parts)

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
                style={{
                  backgroundColor: isHovered ? '#fecaca' : '#fee2e2',
                }}
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
              <span
                key={`normal-${partIndex}-${lineIdx}-${charIdx}`}
                className="animate-typewriter inline-block"
                style={{
                  animationDelay: `${(partIndex * 100 + lineIdx * 50 + charIdx) * 0.03}s`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })
        }
      })
    })

    return <div className="relative" style={{ overflowWrap: 'break-word' }}>{result}</div>
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* 上传确认弹窗 */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadDialog(false)}>
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-4 border-purple-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
                <h2 className="text-3xl font-bold text-purple-700 mb-2">Upload to Luminai Library?</h2>
                <p className="text-gray-600 text-lg">
                  Would you like to save this letter to your Luminai Library? Your letter will be preserved and you can access it later.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleUploadToLibrary}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg py-3 px-8 text-lg font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
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
                  onClick={() => {
                    setShowUploadDialog(false)
                    hasSavedRef.current = true
                    savedLetterRef.current = letter
                  }}
                  disabled={isUploading}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold py-3 px-8 text-lg rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <StageHeader onBack={onBack} />

        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 animate-scale-in" />
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              🎉 Your Letter is Complete! 🎉
            </h1>
            <Sparkles className="w-16 h-16 text-purple-600 animate-pulse" />
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-xl px-6 py-3 inline-block border-2 border-pink-200 shadow-lg">
            <p className="text-lg text-gray-700">
              To: <span className="font-bold text-pink-700">{recipient}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              💭 {occasion}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* 左侧：信件展示 */}
          <div className="lg:col-span-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border-4 border-pink-300 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-8 h-8 text-pink-600" />
                <h2 className="text-3xl font-bold text-pink-700">Your Letter</h2>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200 shadow-inner relative overflow-hidden" style={{ overflowWrap: 'break-word' }}>
                {isReviewing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mx-auto mb-6 w-16 h-16">
                        <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-pink-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-pink-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-pink-700 text-lg font-semibold animate-pulse">
                        Loading article...
                      </p>
                      <p className="text-gray-600 text-sm mt-2">
                        Please wait
                      </p>
                    </div>
                ) : (
                  <div 
                    className="text-base text-gray-800 leading-relaxed"
                    style={{ 
                      fontFamily: 'Patrick Hand, Kalam, cursive',
                    }}
                  >
                    {renderHighlightedText()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 操作按钮 */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-4 border-purple-300 shadow-xl">
              <h3 className="text-xl font-bold text-purple-700 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleCopy}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg py-3 text-lg font-bold rounded-xl hover:scale-105 transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Copied! 🎉
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Letter
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold py-3 text-lg rounded-xl hover:scale-105 transition-all"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Letter
                </Button>
                
                {onEdit && (
                  <Button
                    onClick={onEdit}
                    variant="outline"
                    className="w-full bg-white/80 backdrop-blur-lg border-2 border-purple-300 hover:bg-purple-50 text-purple-700 shadow-lg font-bold py-3 text-lg rounded-xl hover:scale-105 transition-all"
                  >
                    <span className="text-xl mr-2">✏️</span>
                    Edit Letter
                  </Button>
                )}
              </div>
            </div>

            {/* 发邮件功能 */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-4 border-green-300 shadow-xl">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Send by Email
              </h3>
              
              {emailSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-bold">Email sent successfully! 📧✨</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">
                      Recipient's Email
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 border-2 border-green-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-300"
                      disabled={isSending}
                    />
                  </div>
                  <Button
                    onClick={handleSendEmail}
                    disabled={isSending || !email.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg py-3 text-lg font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Letter
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* 重置按钮 */}
            <Button
              onClick={onReset}
              variant="outline"
              className="w-full bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold py-3 text-lg rounded-xl hover:scale-105 transition-all"
            >
              ✨ Write Another Letter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

