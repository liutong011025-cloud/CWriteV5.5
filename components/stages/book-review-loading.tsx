"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

interface BookReviewLoadingProps {
  reviewType: "recommendation" | "critical" | "literary"
  bookTitle: string
  onComplete: (structure: { type: "recommendation" | "critical" | "literary"; outline: string[]; shuffledToOriginal?: number[] }, bookCoverUrl: string, bookSummary: string) => void
  onBack: () => void
}

const WRITING_TIPS = {
  recommendation: {
    title: "Writing Tips for Recommendation Review",
    tips: [
      "✨ Start with what made you pick up this book - hook your readers!",
      "💝 Share specific parts you loved (characters, plot twists, emotions)",
      "🌟 Be genuine - tell readers why YOU think they should read it",
      "📚 Mention who might enjoy this book (age, interests, reading style)",
      "🎯 End with a clear recommendation that makes readers excited!",
    ],
    color: "from-blue-500 via-indigo-500 to-purple-500",
  },
  critical: {
    title: "Writing Tips for Critical Review",
    tips: [
      "🔍 Look at both strengths AND weaknesses - be fair and balanced",
      "💪 Mention what worked well (characters, writing style, themes)",
      "⚠️ Point out what didn't work (plot holes, pacing, confusing parts)",
      "📝 Use examples from the book to support your points",
      "🎯 Give an honest overall assessment - what's your final verdict?",
    ],
    color: "from-orange-500 via-red-500 to-pink-500",
  },
  literary: {
    title: "Writing Tips for Literary Review",
    tips: [
      "📖 Explore the deeper meanings - what themes does the book explore?",
      "🎨 Look for symbols, metaphors, and literary devices the author uses",
      "👥 Analyze how characters develop and what they represent",
      "✍️ Examine the writing style - how does the author craft sentences?",
      "💭 Connect the book's message to bigger ideas about life and society",
    ],
    color: "from-purple-500 via-pink-500 to-rose-500",
  },
}

// 固定打乱顺序：24351（即索引 1,3,2,4,0）
// 原始顺序：0,1,2,3,4 -> 打乱后：1,3,2,4,0
const fixedShuffle = <T,>(array: T[]): T[] => {
  if (array.length !== 5) {
    // 如果不是5个元素，使用随机打乱
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  // 固定顺序：24351（原始索引 0,1,2,3,4 -> 新索引 1,3,2,4,0）
  // 这意味着：第2个(索引1) -> 位置0, 第4个(索引3) -> 位置1, 第3个(索引2) -> 位置2, 第5个(索引4) -> 位置3, 第1个(索引0) -> 位置4
  const order = [1, 3, 2, 4, 0] // 对应原始索引
  const result = order.map(idx => array[idx])
  console.log('fixedShuffle - Input:', array)
  console.log('fixedShuffle - Order indices:', order)
  console.log('fixedShuffle - Output:', result)
  return result
}

// 根据 reviewType 生成结构（打乱顺序用于测试）
const getStructureForReviewType = (reviewType: "recommendation" | "critical" | "literary") => {
  const baseStructures = {
    recommendation: {
      type: "recommendation" as const,
      outline: [
        "Introduction - Hook your readers",
        "What I Loved - Share your favorite parts",
        "Why You Should Read It - Make your case",
        "Who Would Enjoy This - Help readers decide",
        "Conclusion - Final recommendation"
      ]
    },
    critical: {
      type: "critical" as const,
      outline: [
        "Introduction - Set the stage",
        "Strengths - What worked well",
        "Weaknesses - What didn't work",
        "Examples - Support your points",
        "Conclusion - Overall assessment"
      ]
    },
    literary: {
      type: "literary" as const,
      outline: [
        "Introduction - Present the book",
        "Themes - Explore deeper meanings",
        "Literary Devices - Analyze techniques",
        "Character Analysis - Understand development",
        "Conclusion - Reflect on significance"
      ]
    }
  }
  
  const baseStructure = baseStructures[reviewType]
  // 保持正常顺序，不再打乱
  // 注意：如果将来需要测试打乱功能，可以取消注释下面的代码
  // const shuffledOutline = fixedShuffle(baseStructure.outline)
  
  console.log('=== Section Order Debug ===')
  console.log('Original outline:', baseStructure.outline)
  console.log('Using original order (not shuffled)')
  console.log('==========================')
  
  return {
    ...baseStructure,
    outline: baseStructure.outline, // 使用原始顺序，不打乱
    originalOutline: baseStructure.outline // 保存原始顺序（与outline相同）
  }
}

export default function BookReviewLoading({
  reviewType,
  bookTitle,
  onComplete,
  onBack,
}: BookReviewLoadingProps) {
  const tips = WRITING_TIPS[reviewType]
  const structure = getStructureForReviewType(reviewType)
  const hasGeneratedRef = useRef(false) // 防止重复调用

  useEffect(() => {
    // 防止重复调用：如果已经生成过，或者没有bookTitle，直接返回
    if (hasGeneratedRef.current || !bookTitle) {
      return
    }

    hasGeneratedRef.current = true // 标记为已生成
    console.log("=== Generating Cover and Summary (ONCE) ===")
    
    const generateCoverAndSummary = async () => {
      try {
        // 同时生成封面和书摘要
        const [coverResponse, summaryResponse] = await Promise.all([
          fetch("/api/generate-book-cover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookTitle, user_id: 'student' }),
          }),
          fetch("/api/dify-book-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookTitle, user_id: 'student' }),
          })
        ])

        let coverImageUrl = ""
        
        if (!coverResponse.ok) {
          const errorData = await coverResponse.json().catch(() => ({}))
          console.error("Book cover generation failed:", coverResponse.status, errorData)
        } else {
          const coverData = await coverResponse.json()
          console.log("Cover API Response:", JSON.stringify(coverData, null, 2))
          
          // 尝试多种可能的字段名
          coverImageUrl = coverData.imageUrl || coverData.url || coverData.images?.[0]?.url || coverData.image?.url || ""
          console.log("Extracted cover image URL:", coverImageUrl)
        }
        
        let summaryData = { message: "" }
        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json().catch(() => ({ error: summaryResponse.statusText }))
          console.error("Book summary generation failed:", summaryResponse.status, errorData)
          // 如果summary失败，使用空字符串，不阻止流程继续
        } else {
          summaryData = await summaryResponse.json()
          console.log("Summary data:", summaryData)
          if (summaryData.error) {
            console.error("Book summary API returned error:", summaryData.error)
            summaryData.message = "" // 如果API返回错误，使用空字符串
          }
        }

        // 生成后调用 onComplete，传递 structure、封面URL和书摘要
        // 由于现在使用正常顺序，outline和originalOutline相同，映射就是[0,1,2,3,4]
        const shuffledToOriginal: number[] = structure.outline.map((_, index) => index)
        
        const structureWithMapping = {
          ...structure,
          shuffledToOriginal // 保存映射关系（现在是[0,1,2,3,4]）
        }
        
        console.log("=== onComplete Structure Debug ===")
        console.log("Structure outline (should be shuffled):", structureWithMapping.outline)
        console.log("Structure originalOutline:", structureWithMapping.originalOutline)
        console.log("Structure shuffledToOriginal mapping:", shuffledToOriginal)
        console.log("==================================")
        
        onComplete(structureWithMapping, coverImageUrl, summaryData.message || "")
      } catch (error) {
        console.error("Error generating cover or summary:", error)
        // 生成失败也跳转，使用默认值
        onComplete(structure, "", "")
      }
    }

    generateCoverAndSummary()
    // 只依赖bookTitle，避免因为onComplete和structure的引用变化导致重复调用
  }, [bookTitle])

  return (
    <div className="min-h-screen py-6 px-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 relative" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col pl-16 lg:pl-20">
        {onBack && <BackButton onClick={onBack} variant="blue" />}

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Preparing Your Writing Space
          </h1>
          <p className="text-base text-gray-600 mb-2">
            Reviewing: <strong>{bookTitle}</strong>
          </p>
        </div>

        <div className="max-w-4xl mx-auto flex-1 flex items-start justify-center py-8">
          {/* 写作秘诀 - 向右填充，占据更大空间 */}
          <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl p-8 border-4 border-purple-300 shadow-2xl backdrop-blur-sm relative w-full">
            {/* 加载转圈 - 放在右上角 */}
            <div className="absolute top-6 right-6">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>

            <h2 className={`text-2xl font-bold mb-6 bg-gradient-to-r ${tips.color} bg-clip-text text-transparent pr-16`}>
              {tips.title}
            </h2>
            <div className="space-y-3 pr-16">
              {tips.tips.map((tip, index) => (
                <div
                  key={index}
                  className="bg-white/90 rounded-xl p-4 border-2 border-purple-200 shadow-lg backdrop-blur-sm animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="text-base text-gray-800 leading-relaxed" style={{ fontFamily: 'var(--font-comic-neue)' }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>

            {/* 结构预览 - 显示正常顺序 */}
            <div className="mt-6 bg-white/90 rounded-xl p-5 border-2 border-purple-200 shadow-lg pr-16">
              <h3 className="text-lg font-bold text-purple-700 mb-3">Your Review Sections 📦:</h3>
              <div className="space-y-2">
                {(() => {
                  // 使用原始顺序显示
                  const sectionsToDisplay = structure.originalOutline || structure.outline
                  console.log('=== Displaying Sections ===')
                  console.log('Structure outline (shuffled for writing):', structure.outline)
                  console.log('Structure originalOutline (for display):', structure.originalOutline)
                  return sectionsToDisplay.map((section, index) => {
                    console.log(`Section ${index}: ${section}`)
                    return (
                      <div key={index} className="flex items-center gap-3 text-gray-700">
                        <span className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                          📦
                        </span>
                        <span className="text-base font-medium">{section}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

