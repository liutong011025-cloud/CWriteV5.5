"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import StageHeader from "@/components/stage-header"
import { Sparkles, Mail, Heart, Star } from "lucide-react"
import { getCurrentLevel } from "@/lib/current-level"
import PixelPage from "@/components/pixel/pixel-page"

interface LetterAdventureProps {
  onStart: (recipient: string, occasion: string, guidance: string | null, readerImageUrl: string | null) => void
  onBack: () => void
  userId?: string
  noAi?: boolean
}

export default function LetterAdventure({ onStart, onBack, userId, noAi = false }: LetterAdventureProps) {
  const [recipient, setRecipient] = useState("")
  const [occasion, setOccasion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [guidance, setGuidance] = useState("")
  const [showGuidance, setShowGuidance] = useState(false)

  const handleStart = async () => {
    if (!recipient.trim()) {
      toast.error("Please tell us who you're writing to! 💌")
      return
    }
    if (!occasion.trim()) {
      toast.error("Please tell us why you're writing! ✨")
      return
    }
    
    setIsLoading(true)
    try {
      if (noAi) {
        // 无 AI 版本：直接跳转，不需要 AI 指导
        onStart(recipient.trim(), occasion.trim(), null, null)
        setIsLoading(false)
        return
      }

      // 同时获取 AI 指导和生成照片
      const [guidanceResponse, imageResponse] = await Promise.all([
        fetch("/api/dify-letter-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: recipient.trim(),
            occasion: occasion.trim(),
            user_id: userId || "student",
            level: getCurrentLevel(),
          }),
        }),
        fetch("/api/generate-letter-reader", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: recipient.trim(),
            occasion: occasion.trim(),
          }),
        }),
      ])

      const guidanceData = await guidanceResponse.json()
      const imageData = await imageResponse.json()

      if (guidanceData.error) {
        toast.error(guidanceData.error)
        setIsLoading(false)
        return
      }

      const aiGuidance = guidanceData.guidance || "Write from your heart! Be kind and honest. ✨"
      setGuidance(aiGuidance)
      setShowGuidance(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Error starting letter adventure:", error)
      toast.error("Failed to start. Please try again.")
      setIsLoading(false)
    }
  }

  if (showGuidance) {
    return (
      <PixelPage style={{ paddingTop: "120px", paddingBottom: "120px" }} className="py-6 px-4">
        <div className="max-w-4xl mx-auto relative">
          <StageHeader onBack={onBack} />

          <div className="text-center mb-12">
            <div className="mb-6 flex justify-center items-center gap-4">
              <Sparkles className="w-16 h-16 animate-pulse" style={{ color: "#e8c547" }} />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 pixel-title" style={{ color: "#6b5210", textShadow: "3px 3px 0 rgba(0,0,0,0.2)" }}>
              ✨ AI Writing Guide ✨
            </h1>
          </div>

          <div className="pixel-panel p-8 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-2xl font-bold mb-4 pixel-text" style={{ color: "#6b5210" }}>Here's how to write your letter:</p>
              <div className="pixel-card p-6" style={{ background: "#f5e6c8" }}>
                <p className="text-lg leading-relaxed whitespace-pre-wrap pixel-text" style={{ color: "#5a4a2a" }}>
                  {guidance}
                </p>
              </div>
            </div>
            <div className="text-center">
              <Button
                onClick={() => {
                  onStart(recipient.trim(), occasion.trim(), guidance, null) // imageUrl will be loaded in letter-game
                }}
                className="pixel-btn pixel-btn-green shadow-2xl py-6 px-12 text-2xl font-black hover:scale-110 transition-all duration-300"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Continue to Writing
                <Sparkles className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </PixelPage>
    )
  }

  return (
    <PixelPage style={{ paddingTop: "120px", paddingBottom: "120px" }} className="py-6 px-4">
      <div className="max-w-4xl mx-auto relative">
        <StageHeader onBack={onBack} />

        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center items-center gap-4">
            <Mail className="w-16 h-16 text-pink-600 animate-bounce" />
            <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
            <Heart className="w-16 h-16 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 pixel-title" style={{ color: "#6b5210", textShadow: "3px 3px 0 rgba(0,0,0,0.2)" }}>
            ✨ Letter Adventure ✨
          </h1>
          <p className="text-xl mb-2 pixel-text" style={{ color: "#5a4a2a" }}>
            Create a magical letter for someone special! 💌
          </p>
          <p className="text-lg pixel-text" style={{ color: "#6b5210" }}>
            Let's start your letter writing journey! 🚀
          </p>
        </div>

        {/* 输入卡片 */}
        <div className="pixel-panel p-8 shadow-2xl mb-6">
          <div className="space-y-6">
            {/* 收信人输入 */}
            <div className="relative">
              <label className="block text-2xl font-bold mb-4 flex items-center gap-3 pixel-text" style={{ color: "#6b5210" }}>
                <span className="text-4xl animate-bounce">👤</span>
                <span>Who are you writing to?</span>
              </label>
              <Input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., My best friend Sarah, Mom, Teacher Johnson..."
                className="w-full p-5 text-lg border-3 border-pink-200 rounded-2xl focus:border-pink-400 focus:ring-4 focus:ring-pink-300 focus:outline-none shadow-lg transition-all"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && recipient.trim() && occasion.trim() && !isLoading) {
                    handleStart()
                  }
                }}
              />
              <p className="text-sm mt-3 flex items-center gap-2 pixel-text" style={{ color: "#6b5210" }}>
                <Star className="w-4 h-4" style={{ color: "#e8c547" }} />
                <span>Who will receive this special letter?</span>
              </p>
            </div>

            {/* 写作契机输入 */}
            <div className="relative">
              <label className="block text-2xl font-bold mb-4 flex items-center gap-3 pixel-text" style={{ color: "#6b5210" }}>
                <span className="text-4xl animate-bounce">💭</span>
                <span>Why are you writing?</span>
              </label>
              <Input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., To say thank you, To share good news, To apologize..."
                className="w-full p-5 text-lg border-3 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-300 focus:outline-none shadow-lg transition-all"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && recipient.trim() && occasion.trim() && !isLoading) {
                    handleStart()
                  }
                }}
              />
              <p className="text-sm mt-3 flex items-center gap-2 pixel-text" style={{ color: "#6b5210" }}>
                <Heart className="w-4 h-4" style={{ color: "#e66767" }} />
                <span>What's the special reason for this letter?</span>
              </p>
            </div>
          </div>
        </div>

        {/* 开始按钮 */}
        <div className="text-center">
          <Button
            onClick={handleStart}
            disabled={!recipient.trim() || !occasion.trim() || isLoading}
            className="pixel-btn pixel-btn-green shadow-2xl py-6 px-12 text-2xl font-black hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Getting AI guidance...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2" />
                Start Your Letter Adventure!
                <Sparkles className="w-6 h-6 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </PixelPage>
  )
}
