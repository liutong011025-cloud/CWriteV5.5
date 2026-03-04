"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  FileText,
  Mail,
  MessageCircle,
  User as UserIcon,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface WorkItem {
  id: string
  type: "story" | "review" | "letter"
  title: string
  content: string
  timestamp: number
  interactionId?: string
}

export interface ReviewItem {
  id: string
  workType: string
  workTitle: string | null
  workContent: string | null
  reviewerUsername: string
  reviewerRole: string
  content: string
  readAt: number | null
  createdAt: number
}

interface UserProfilePageProps {
  userId: string
  userRole: string
  avatarUrl?: string | null
  avatarEmoji?: string | null
  onBack: () => void
  onOpenSettings: () => void
  trees?: { id: number; stage: number }[] | null
  recentGrowthTreeId?: number | null
  recentGrowthDimension?: "vocab" | "detail" | "logic" | null
}

type FarmElementId = "farmbacktomap" | "farmsetting" | "farmwrittingboard" | "vistothersfarm" | "farmfile"

interface FarmElementConfig {
  id: FarmElementId
  label: string
  imageSrc: string
}

interface FarmElementState {
  x: number
  y: number
  scale: number
}

export default function UserProfilePage({
  userId,
  userRole,
  avatarUrl,
  avatarEmoji,
  onBack,
  onOpenSettings,
  trees,
  recentGrowthTreeId,
  recentGrowthDimension,
}: UserProfilePageProps) {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [forest, setForest] = useState<{ id: number; stage: number }[]>([])
  const [highlightTreeId, setHighlightTreeId] = useState<number | null>(null)
  const farmContainerRef = useRef<HTMLDivElement | null>(null)
  const [draggingFarmElement, setDraggingFarmElement] = useState<FarmElementId | null>(null)
  const [hoveredFarmElement, setHoveredFarmElement] = useState<FarmElementId | null>(null)

  const farmElements: FarmElementConfig[] = [
    { id: "farmbacktomap", label: "Back to Map", imageSrc: "/farmbacktomap.png" },
    { id: "farmsetting", label: "Settings", imageSrc: "/farmsetting.png" },
    { id: "farmwrittingboard", label: "Writing Board", imageSrc: "/farmwritingboard.png" },
    { id: "vistothersfarm", label: "Visit Others' Farms", imageSrc: "/visitothersfarm.png" },
    { id: "farmfile", label: "Work File", imageSrc: "/farmfile.png" },
  ]

  const [farmElementStates, setFarmElementStates] = useState<Record<FarmElementId, FarmElementState>>({
    farmbacktomap: { x: 10, y: 10, scale: 1.5 },
    farmsetting: { x: 22.1, y: 47.4, scale: 1.55 },
    farmwrittingboard: { x: 50, y: 50, scale: 1 },
    vistothersfarm: { x: 15, y: 80, scale: 1 },
    farmfile: { x: 85, y: 80, scale: 1 },
  })

  useEffect(() => {
    if (!draggingFarmElement) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!farmContainerRef.current) return
      const rect = farmContainerRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const xPercent = ((event.clientX - rect.left) / rect.width) * 100
      const yPercent = ((event.clientY - rect.top) / rect.height) * 100
      const clampedX = Math.min(100, Math.max(0, xPercent))
      const clampedY = Math.min(100, Math.max(0, yPercent))
      setFarmElementStates((prev) => ({
        ...prev,
        [draggingFarmElement]: {
          ...prev[draggingFarmElement],
          x: clampedX,
          y: clampedY,
        },
      }))
    }

    const handleMouseUp = () => {
      setDraggingFarmElement(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingFarmElement])

  useEffect(() => {
    Promise.all([
      fetch(`/api/user-works?user_id=${userId}&type=all`).then((r) => r.json()),
      fetch(`/api/reviews?user_id=${userId}`).then((r) => r.json()),
    ])
      .then(([worksRes, reviewsRes]) => {
        const list: WorkItem[] = []
        if (worksRes.stories) {
          worksRes.stories.forEach((s: any) =>
            list.push({
              id: s.id,
              type: "story",
              title: s.character?.name ? `${s.character.name}'s Adventure` : "Story",
              content: s.content || "",
              timestamp: s.timestamp ? new Date(s.timestamp).getTime() : new Date(s.updatedAt || 0).getTime(),
              interactionId: s.interactionId,
            })
          )
        }
        if (worksRes.reviews) {
          worksRes.reviews.forEach((r: any) =>
            list.push({
              id: r.id,
              type: "review",
              title: `Review: ${r.bookTitle || "Book"}`,
              content: r.content || "",
              timestamp: r.timestamp ? new Date(r.timestamp).getTime() : new Date(r.updatedAt || 0).getTime(),
              interactionId: r.interactionId,
            })
          )
        }
        if (worksRes.letters) {
          worksRes.letters.forEach((l: any) =>
            list.push({
              id: l.id,
              type: "letter",
              title: `Letter to ${l.recipient || "Someone"}`,
              content: l.content || "",
              timestamp: l.timestamp ? new Date(l.timestamp).getTime() : new Date(l.updatedAt || 0).getTime(),
              interactionId: l.interactionId,
            })
          )
        }
        list.sort((a, b) => b.timestamp - a.timestamp)
        setWorks(list)
        setReviews(reviewsRes.reviews || [])
        setUnreadCount(reviewsRes.unreadCount ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  // 同步来自主页的小树森林与最近成长信息
  useEffect(() => {
    if (trees && Array.isArray(trees)) {
      setForest(trees.slice(0, 12))
    }
  }, [trees])

  useEffect(() => {
    if (recentGrowthTreeId && trees && trees.some((t) => t.id === recentGrowthTreeId)) {
      setHighlightTreeId(recentGrowthTreeId)
      const timer = setTimeout(() => {
        setHighlightTreeId(null)
      }, 2600)
      return () => clearTimeout(timer)
    }
  }, [recentGrowthTreeId, trees])

  const teacherReviews = reviews.filter((r) => r.reviewerRole === "teacher")
  const peerReviews = reviews.filter((r) => r.reviewerRole === "student")

  const handleReviewClick = (r: ReviewItem) => {
    setSelectedReview(r)
    fetch("/api/reviews/mark-read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, review_ids: [r.id] }),
    })
      .then(() => {
        setUnreadCount((c) => Math.max(0, c - 1))
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("headerRefreshUserInfo"))
        }
      })
      .catch(console.error)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-purple-50/80"
      style={{ paddingTop: "128px", paddingBottom: "120px" }}
      data-stage="userProfile"
    >
            <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 rounded-xl font-hand text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary/20 shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt={userId} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-lg text-primary">
                {avatarEmoji || userId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-hand text-lg font-bold text-foreground">{userId}</p>
              <p className="font-hand text-xs text-muted-foreground">My writings & reviews</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="gap-1.5 rounded-xl font-hand border-primary/30"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* My Farm - 測試版：全屏農場圖片 + 可拖拽元素 */}
        <div
          ref={farmContainerRef}
          className="relative w-full h-[calc(100vh-200px)] rounded-2xl overflow-hidden border-2 border-emerald-300 bg-emerald-100/60 shadow-inner"
        >
          <img
            src="/farm.png"
            alt="My Farm Background"
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />

          {farmElements.map((element) => {
            const state = farmElementStates[element.id]
            if (!state) return null
            const isHovered = hoveredFarmElement === element.id
            const scale = state.scale * (isHovered ? 1.08 : 1)
            return (
              <button
                key={element.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{
                  left: `${state.x}%`,
                  top: `${state.y}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  transition: draggingFarmElement === element.id ? "none" : "transform 150ms ease-out",
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDraggingFarmElement(element.id)
                }}
                onMouseEnter={() => setHoveredFarmElement(element.id)}
                onMouseLeave={() => setHoveredFarmElement((prev) => (prev === element.id ? null : prev))}
                onClick={() => {
                  console.log("[MyFarm click]", element.id, farmElementStates[element.id])
                }}
              >
                <div className="rounded-xl bg-white/0 shadow-lg">
                  <img
                    src={element.imageSrc}
                    alt={element.label}
                    className="h-16 w-16 md:h-20 md:w-20 object-contain select-none"
                    draggable={false}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Modal: selected review + work content（暫時用不到，但保留代碼） */}
        {false && selectedReview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedReview(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-hand text-lg font-bold text-foreground">
                  {selectedReview.workTitle || "Review"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReview(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Review by {selectedReview.reviewerUsername}</p>
                  <p className="whitespace-pre-wrap font-hand text-sm text-foreground">
                    {selectedReview.content}
                  </p>
                </div>
                {selectedReview.workContent && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Your work</p>
                    <pre className="whitespace-pre-wrap font-hand text-sm text-foreground">
                      {selectedReview.workContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
