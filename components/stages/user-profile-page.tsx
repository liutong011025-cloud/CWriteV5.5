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

type FarmElementId = "farmbacktomap" | "farmsetting" | "farmwrittingboard" | "vistothersfarm"

interface FarmElementConfig {
  id: FarmElementId
  label: string
  imageSrc: string
}

/** 背景圖在容器內實際顯示的區域（object-contain 後的矩形），用於鎖定元素與背景的相對位置 */
interface ImageOverlayRect {
  left: number
  top: number
  width: number
  height: number
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
  ]

  const [farmElementStates, setFarmElementStates] = useState<Record<FarmElementId, FarmElementState>>({
    farmbacktomap: { x: 74.1, y: 43.7, scale: 0.7 },
    farmsetting: { x: 34.8, y: 50.0, scale: 0.8 },
    farmwrittingboard: { x: 63.2, y: 50.6, scale: 1.1 },
    vistothersfarm: { x: 73.1, y: 37.0, scale: 0.75 },
  })

  const farmImageRef = useRef<HTMLImageElement | null>(null)
  const [imageOverlayRect, setImageOverlayRect] = useState<ImageOverlayRect | null>(null)
  const imageOverlayRectRef = useRef<ImageOverlayRect | null>(null)
  imageOverlayRectRef.current = imageOverlayRect

  const updateImageOverlayRect = () => {
    const container = farmContainerRef.current
    const img = farmImageRef.current
    if (!container || !img) return
    const cr = container.getBoundingClientRect()
    const ir = img.getBoundingClientRect()
    setImageOverlayRect({
      left: ir.left - cr.left,
      top: ir.top - cr.top,
      width: ir.width,
      height: ir.height,
    })
  }

  useEffect(() => {
    const container = farmContainerRef.current
    const img = farmImageRef.current
    if (!img || !container) return
    if (img.complete) updateImageOverlayRect()
    img.addEventListener("load", updateImageOverlayRect)
    window.addEventListener("resize", updateImageOverlayRect)
    const vv = typeof window !== "undefined" ? window.visualViewport : null
    if (vv) {
      vv.addEventListener("resize", updateImageOverlayRect)
      vv.addEventListener("scroll", updateImageOverlayRect)
    }
    const ro = new ResizeObserver(updateImageOverlayRect)
    ro.observe(container)
    return () => {
      img.removeEventListener("load", updateImageOverlayRect)
      window.removeEventListener("resize", updateImageOverlayRect)
      if (vv) {
        vv.removeEventListener("resize", updateImageOverlayRect)
        vv.removeEventListener("scroll", updateImageOverlayRect)
      }
      ro.disconnect()
    }
  }, [])


  useEffect(() => {
    if (!draggingFarmElement) return

    const handleMouseMove = (event: MouseEvent) => {
      const container = farmContainerRef.current
      const overlay = imageOverlayRectRef.current
      if (!container) return
      const cr = container.getBoundingClientRect()
      let xPercent: number
      let yPercent: number
      if (overlay && overlay.width > 0 && overlay.height > 0) {
        const imgLeft = cr.left + overlay.left
        const imgTop = cr.top + overlay.top
        xPercent = ((event.clientX - imgLeft) / overlay.width) * 100
        yPercent = ((event.clientY - imgTop) / overlay.height) * 100
      } else {
        xPercent = ((event.clientX - cr.left) / cr.width) * 100
        yPercent = ((event.clientY - cr.top) / cr.height) * 100
      }
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
      className="min-h-screen bg-transparent"
      style={{ paddingTop: 0, paddingBottom: 0 }}
      data-stage="userProfile"
    >
      <div className="w-full h-screen">
        {/* My Farm - 全屏農場圖片 + 可拖拽元素 */}
        <div ref={farmContainerRef} className="relative w-full h-full overflow-hidden">
          <img
            ref={farmImageRef}
            src="/farm.png"
            alt="My Farm Background"
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />

          {/* 疊在背景圖實際顯示區域上，使元素座標與大小都相對背景圖，瀏覽器縮放時一齊變化 */}
          <div
            className="absolute pointer-events-none"
            style={
              imageOverlayRect
                ? {
                    left: imageOverlayRect.left,
                    top: imageOverlayRect.top,
                    width: imageOverlayRect.width,
                    height: imageOverlayRect.height,
                    pointerEvents: "auto",
                  }
                : { left: 0, top: 0, right: 0, bottom: 0, width: "100%", height: "100%", pointerEvents: "auto" }
            }
          >
            {farmElements.map((element) => {
              const state = farmElementStates[element.id]
              if (!state) return null
              const isHovered = hoveredFarmElement === element.id
              const sizePercent = Math.min(25, 8 * state.scale)
              return (
                <button
                  key={element.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none origin-center"
                  style={{
                    left: `${state.x}%`,
                    top: `${state.y}%`,
                    width: `${sizePercent}%`,
                    height: "auto",
                    aspectRatio: "1",
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.08 : 1})`,
                    transformOrigin: "center center",
                    transition: draggingFarmElement === element.id ? "none" : "transform 0.25s ease-in-out",
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
                  <img
                    src={element.imageSrc}
                    alt={element.label}
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                </button>
              )
            })}
          </div>
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
