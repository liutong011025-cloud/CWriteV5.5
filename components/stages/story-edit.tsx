"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import StageHeader from "@/components/stage-header"
import { Sparkles, Save, ArrowLeft } from "lucide-react"
import Image from "next/image"
import type { Language, StoryState } from "@/app/page"
import { getCurrentLevel } from "@/lib/current-level"
import { CheckCircle2, Loader2 } from "lucide-react"
import { getStoryCopy, getSpeciesLabel, getStructureLabel } from "@/lib/story-i18n"

interface StoryEditProps {
  language: Language
  storyState: StoryState
  onSave: (updatedStory: StoryState) => void
  onBack: () => void
  onNavigateToGallery?: () => void
  userId?: string
  workId?: string | null
}

export default function StoryEdit({
  language,
  storyState,
  onSave,
  onBack,
  onNavigateToGallery,
  userId,
  workId,
}: StoryEditProps) {
  const t = getStoryCopy(language)
  const [editedStory, setEditedStory] = useState(storyState.story || "")
  const [originalStory, setOriginalStory] = useState(storyState.story || "")
  const [isSaving, setIsSaving] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const lastModifiedRef = useRef<string>("")
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openedRef = useRef(false)

  const getAISuggestion = useCallback(async (intent: "open" | "revise" = "revise") => {
    if (!editedStory.trim()) return
    if (intent === "revise" && editedStory === originalStory) return

    setIsLoadingSuggestion(true)
    if (intent === "revise") setAiSuggestion(null)

    try {
      const response = await fetch("/api/dify-edit-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_type: "story",
          original_content: originalStory || editedStory,
          modified_content: editedStory,
          intent,
          user_id: userId || "default-user",
          level: getCurrentLevel(),
          language,
        }),
      })

      const data = await response.json()
      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion)
      } else {
        console.error("Failed to get AI suggestion:", data.error)
        setAiSuggestion((prev) => prev || t.editHelpFallback)
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error)
      setAiSuggestion((prev) => prev || t.editHelpFallback)
    } finally {
      setIsLoadingSuggestion(false)
    }
  }, [editedStory, originalStory, userId, language, t.editHelpFallback])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    if (editedStory.trim()) {
      void getAISuggestion("open")
    }
    // Initial coaching when Edit Story opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 当内容改变时，延迟调用AI获取建议
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    if (editedStory !== originalStory && editedStory !== lastModifiedRef.current) {
      suggestionTimeoutRef.current = setTimeout(() => {
        void getAISuggestion("revise")
        lastModifiedRef.current = editedStory
      }, 1500)
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedStory, originalStory])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedStoryState: StoryState = {
        ...storyState,
        story: editedStory,
      }

      // 保存到数据库
      const response = await fetch("/api/interactions", {
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
            story: editedStory,
          },
          story: editedStory,
          character: storyState.character,
          plot: storyState.plot,
          structure: storyState.structure,
          workId: workId || undefined,
          save_edit_revision: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(t.savedOk)
        onSave(updatedStoryState)
        setShowUploadDialog(false)
      } else {
        toast.error(t.saveFail)
      }
    } catch (error) {
      console.error("Error saving story:", error)
      toast.error(t.saveFail)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClickSave = () => {
    // 保存前先确认是否上传到 Luminai Library（隐私管理）
    setShowUploadDialog(true)
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 relative" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <StageHeader stage={5} title={t.editPageTitle} onBack={onBack} language={language} />

      {/* 上传确认弹窗 */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadDialog(false)}>
          <div className="relative pixel-panel p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: "#e8c547" }} />
                <h2 className="text-3xl font-bold mb-2 pixel-text" style={{ color: "#6b5210" }}>{t.uploadTitle}</h2>
                <p className="text-lg pixel-text" style={{ color: "#5a4a2a" }}>
                  {t.uploadBody}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="pixel-btn pixel-btn-green shadow-lg py-3 px-8 text-lg font-bold hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.uploading}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {t.yesUpload}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadDialog(false)
                    // 本地先更新（不上传）
                    onSave({ ...storyState, story: editedStory })
                    toast.success(t.savedLocal)
                  }}
                  disabled={isSaving}
                  variant="outline"
                  className="pixel-btn pixel-btn-wood shadow-lg font-bold py-3 px-8 text-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {t.maybeLater}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.editPageTitle}
          </h1>
          <p className="text-gray-600">{t.editPageHint}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* 左侧：故事信息 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">{t.storyInfo}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">{t.character}</p>
                  <p className="text-lg font-bold text-indigo-700">{storyState.character?.name || 'N/A'}</p>
                </div>
                {storyState.character?.species && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">{t.species}</p>
                    <p className="text-lg font-bold text-purple-700">{getSpeciesLabel(storyState.character.species, language)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">{t.setting}</p>
                  <p className="text-lg font-bold text-pink-700">{storyState.plot?.setting || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">{t.type}</p>
                  <p className="text-lg font-bold text-orange-700 capitalize">{getStructureLabel(storyState.structure?.type || "", language, storyState.structure?.type || "N/A")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 中间：编辑区域 */}
          <div className="lg:col-span-5">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 border-2 border-purple-200 shadow-xl">
              <label className="block text-lg font-bold mb-3 text-purple-700">
                {t.yourStory}
              </label>
              <Textarea
                value={editedStory}
                onChange={(e) => setEditedStory(e.target.value)}
                className="min-h-[400px] text-base leading-relaxed border-2 border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-300 rounded-xl p-4 w-full"
                placeholder={t.editPlaceholder}
              />
              <div className="mt-4">
                <Button
                  onClick={() => {
                    if (onNavigateToGallery) {
                      onNavigateToGallery()
                    }
                  }}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 border-2 border-purple-300 shadow-md"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.needInspiration}
                </Button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleClickSave}
                disabled={isSaving || editedStory === originalStory}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-xl py-6 text-lg font-bold disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? t.saving : t.saveChanges}
              </Button>
            </div>
          </div>

          {/* 右侧：AI 辅导，始终在布局内可见 */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-5 border-4 border-pink-200 sticky top-28">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Image
                    src="/muse-avatar.webp"
                    alt="Luna"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm">
                      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">C</span>
                      <span className="text-purple-700">agent</span>
                    </span>
                    {isLoadingSuggestion && (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                  </div>
                  {isLoadingSuggestion ? (
                    <p className="text-sm text-purple-600">Reading your story...</p>
                  ) : aiSuggestion ? (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {aiSuggestion}
                    </p>
                  ) : (
                    <p className="text-sm text-purple-600">
                      I will share editing tips here. Change a sentence and I will help you improve it!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

