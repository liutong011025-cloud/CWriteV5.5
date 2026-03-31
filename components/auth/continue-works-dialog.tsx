"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sparkles, BookOpen, Mail, FileText, Clock, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Work {
  id: string
  type: 'story' | 'review' | 'letter'
  title: string
  preview: string
  updatedAt: string
  data: any
}

interface ContinueWorksDialogProps {
  open: boolean
  userId: string
  onStartNew: () => void
  onContinue: (work: Work) => void
  onClose: () => void
}

export default function ContinueWorksDialog({
  open,
  userId,
  onStartNew,
  onContinue,
  onClose,
}: ContinueWorksDialogProps) {
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !userId) return
    fetchUserWorks()

    // 同時拉取用戶頭像資料，讓這裡顯示和 header 一樣的頭像
    fetch(`/api/user-profile?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setAvatarUrl(data.avatarUrl ?? null)
          setAvatarEmoji(data.avatarEmoji ?? null)
        }
      })
      .catch(() => {
        // 如果失敗就保持使用縮寫 fallback
      })
  }, [open, userId])

  const fetchUserWorks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/user-works?user_id=${userId}&type=all`)
      const data = await response.json()

      if (data.success) {
        const allWorks: Work[] = []

        // 处理故事
        if (data.stories && data.stories.length > 0) {
          data.stories.forEach((story: any) => {
            allWorks.push({
              id: story.id,
              type: 'story',
              title: `Story: ${(story.character as any)?.name || 'Untitled'}`,
              preview: story.content?.substring(0, 100) || 'No content yet',
              updatedAt: story.updatedAt,
              data: story,
            })
          })
        }

        // 处理书评
        if (data.reviews && data.reviews.length > 0) {
          data.reviews.forEach((review: any) => {
            allWorks.push({
              id: review.id,
              type: 'review',
              title: `${review.reviewType || 'Review'}: ${review.bookTitle || 'Untitled'}`,
              preview: review.content?.substring(0, 100) || 'No content yet',
              updatedAt: review.updatedAt,
              data: review,
            })
          })
        }

        // 处理信件
        if (data.letters && data.letters.length > 0) {
          data.letters.forEach((letter: any) => {
            allWorks.push({
              id: letter.id,
              type: 'letter',
              title: `Letter to ${letter.recipient || 'Unknown'}`,
              preview: letter.content?.substring(0, 100) || 'No content yet',
              updatedAt: letter.updatedAt,
              data: letter,
            })
          })
        }

        // 按更新时间排序
        allWorks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        setWorks(allWorks)
      }
    } catch (error) {
      console.error('Error fetching user works:', error)
      toast.error('Failed to load your works')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <FileText className="w-5 h-5" />
      case 'review':
        return <BookOpen className="w-5 h-5" />
      case 'letter':
        return <Mail className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'story':
        return 'from-blue-500 to-cyan-500'
      case 'review':
        return 'from-purple-500 to-pink-500'
      case 'letter':
        return 'from-orange-500 to-red-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden pixel-theme border-0 shadow-none mx-4 sm:mx-0 p-0">
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, #b8e4f9 0%, #87ceeb 28%, #7ec850 68%, #5a9a32 100%)`,
          }}
        >
          {/* Pixel grass */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none opacity-80">
            {[...Array(22)].map((_, i) => (
              <div
                key={`dlg-grass-${i}`}
                className="absolute bottom-0"
                style={{
                  left: `${i * 5 + Math.random() * 2}%`,
                  width: "8px",
                  height: `${18 + Math.random() * 14}px`,
                  background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
                  imageRendering: "pixelated",
                }}
              />
            ))}
          </div>

          <div className="p-6 md:p-8">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-4">
            {/* 左側用戶頭像，大小約等於標題行高 */}
            <Avatar className="h-16 w-16 border-4 shadow-md bg-white" style={{ borderColor: "#8b6914", borderRadius: 0 }}>
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={userId} />
              )}
              <AvatarFallback className="bg-gradient-to-br text-white text-xl font-bold" style={{ borderRadius: 0, background: "linear-gradient(180deg, #e8c547 0%, #c9a82e 100%)" }}>
                {avatarEmoji || userId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <DialogTitle className="text-3xl md:text-4xl font-black flex items-center gap-2 pixel-text" style={{ color: "#5a4a2a", textShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}>
                <Sparkles className="w-7 h-7" style={{ color: "#e8c547" }} />
                Welcome Back!
              </DialogTitle>
              <DialogDescription className="text-left text-base md:text-lg mt-1 pixel-text" style={{ color: "#6b5210" }}>
                Would you like to start a new writing project or continue with your previous work?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* 开始新的按钮 */}
          <Button
            onClick={onStartNew}
            className="w-full py-7 text-xl font-extrabold pixel-btn pixel-btn-green"
          >
            <Sparkles className="w-6 h-6 mr-3" />
            Start New Writing Project
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>

          {/* 继续之前的作品 */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your works...</p>
            </div>
          ) : works.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-center mb-4 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>
                Continue Your Previous Work
              </h3>
              <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                {works.map((work) => (
                  <button
                    key={work.id}
                    onClick={() => onContinue(work)}
                    className="pixel-card p-5 text-left transition hover:-translate-y-0.5"
                    style={{ border: "4px solid #8b6914" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3" style={{ background: "#87ceeb", border: "3px solid #5bc0de" }}>
                          {getTypeIcon(work.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-extrabold mb-2 truncate pixel-text" style={{ color: "#5a4a2a" }}>{work.title}</h4>
                          <p className="text-sm mb-3 line-clamp-2 pixel-text" style={{ color: "#6b5210" }}>{work.preview}...</p>
                          <div className="flex items-center gap-2 text-xs pixel-text" style={{ color: "#8b6914" }}>
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(work.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 flex-shrink-0" style={{ color: "#8b6914" }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg pixel-text" style={{ color: "#6b5210" }}>No previous works found. Start a new project!</p>
            </div>
          )}
        </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

