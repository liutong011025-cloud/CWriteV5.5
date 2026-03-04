"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const [viewMode, setViewMode] = useState<"farm" | "writings">("farm")

  // Writing Board 界面：Cagent 僅氣泡，無小熊圖片
  const [cagentBubbleOpen, setCagentBubbleOpen] = useState(false)
  const [cagentGuideText, setCagentGuideText] = useState<string | null>(null)
  const [cagentLoading, setCagentLoading] = useState(false)
  const [cagentUserInput, setCagentUserInput] = useState("")
  const [cagentSending, setCagentSending] = useState(false)
  const [cagentTriggerPosition, setCagentTriggerPosition] = useState({ x: 50, y: 42 })
  const [cagentBubblePosition, setCagentBubblePosition] = useState({ x: 56, y: 30 })
  const [cagentHelloBubblePosition, setCagentHelloBubblePosition] = useState({ x: 50, y: 32 })
  const [showBubblePositionTool, setShowBubblePositionTool] = useState(false)
  const [cagentHoverTrigger, setCagentHoverTrigger] = useState(false)

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

  const fetchCagentGuide = useCallback(
    async (userMessage?: string) => {
      setCagentLoading(true)
      if (!userMessage) setCagentGuideText(null)
      try {
        const res = await fetch("/api/dify-cagent-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: "userProfileFarm",
            contextSummary: "User is on the farm interface (writing board, settings, etc.).",
            user_id: userId,
            userMessage: userMessage || null,
          }),
        })
        const data = await res.json()
        if (data.error) {
          setCagentGuideText("Oops, Cagent is resting. Try again in a bit! 🧸")
          return
        }
        setCagentGuideText(data.message || data.answer || "Keep going! You're doing great! ✨")
      } catch {
        setCagentGuideText("Something went wrong. Try again! 🌟")
      } finally {
        setCagentLoading(false)
      }
    },
    [userId]
  )

  const handleCagentOpen = useCallback(() => {
    setCagentBubbleOpen(true)
    if (!cagentGuideText && !cagentLoading) fetchCagentGuide()
  }, [cagentGuideText, cagentLoading, fetchCagentGuide])

  const handleCagentSend = useCallback(
    async (e?: { preventDefault: () => void }) => {
      if (e) e.preventDefault()
      const message = cagentUserInput.trim()
      if (!message || cagentSending) return
      setCagentSending(true)
      try {
        await fetchCagentGuide(message)
        setCagentUserInput("")
      } finally {
        setCagentSending(false)
      }
    },
    [cagentUserInput, cagentSending, fetchCagentGuide]
  )

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

  if (viewMode === "writings") {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-purple-50/80"
        style={{ paddingTop: "128px", paddingBottom: "120px" }}
        data-stage="userProfile"
      >
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("farm")}
            className="mb-6 gap-1.5 rounded-xl font-hand text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Farm
          </Button>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: My Writings */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border-2 border-amber-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-amber-600" />
                  <h2 className="font-hand text-xl font-bold text-foreground">My Writings</h2>
                </div>
                {loading ? (
                  <p className="font-hand text-sm text-muted-foreground">Loading...</p>
                ) : works.length === 0 ? (
                  <p className="font-hand text-sm text-muted-foreground">No writings yet. Start writing from the map!</p>
                ) : (
                  <ul className="space-y-3">
                    {works.map((w) => (
                      <li
                        key={w.id}
                        className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 font-hand"
                      >
                        {w.type === "story" && <BookOpen className="h-5 w-5 text-amber-600" />}
                        {w.type === "review" && <FileText className="h-5 w-5 text-blue-600" />}
                        {w.type === "letter" && <Mail className="h-5 w-5 text-green-600" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-foreground">{w.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(w.timestamp).toLocaleDateString("en-US")}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: Teacher Reviews & Peer Reviews */}
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-blue-200/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-hand font-bold text-foreground">Teacher Reviews</h3>
                </div>
                {teacherReviews.length === 0 ? (
                  <p className="font-hand text-xs text-muted-foreground">No teacher reviews yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {teacherReviews.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => handleReviewClick(r)}
                          className={`w-full rounded-xl border px-3 py-2 text-left font-hand text-sm transition hover:border-blue-300 ${
                            !r.readAt ? "border-blue-300 bg-blue-50/50 font-semibold" : "border-blue-100 bg-white"
                          }`}
                        >
                          <span className="block truncate text-foreground">{r.workTitle || "Review"}</span>
                          <span className="text-xs text-muted-foreground">by {r.reviewerUsername}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border-2 border-green-200/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-hand font-bold text-foreground">Peer Reviews</h3>
                </div>
                {peerReviews.length === 0 ? (
                  <p className="font-hand text-xs text-muted-foreground">No peer reviews yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {peerReviews.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => handleReviewClick(r)}
                          className={`w-full rounded-xl border px-3 py-2 text-left font-hand text-sm transition hover:border-green-300 ${
                            !r.readAt ? "border-green-300 bg-green-50/50 font-semibold" : "border-green-100 bg-white"
                          }`}
                        >
                          <span className="block truncate text-foreground">{r.workTitle || "Review"}</span>
                          <span className="text-xs text-muted-foreground">by {r.reviewerUsername}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {selectedReview && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setSelectedReview(null)}
            >
              <div
                className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-hand text-lg font-bold text-foreground">{selectedReview.workTitle || "Review"}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReview(null)} className="rounded-xl">
                    Close
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Review by {selectedReview.reviewerUsername}</p>
                    <p className="whitespace-pre-wrap font-hand text-sm text-foreground">{selectedReview.content}</p>
                  </div>
                  {selectedReview.workContent && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="mb-1 font-hand text-xs font-bold text-muted-foreground">Your work</p>
                      <pre className="whitespace-pre-wrap font-hand text-sm text-foreground">{selectedReview.workContent}</pre>
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
                    if (element.id === "farmbacktomap") onBack()
                    else if (element.id === "farmsetting") onOpenSettings()
                    else if (element.id === "farmwrittingboard") setViewMode("writings")
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

            {/* Cagent: invisible trigger (larger), no visible region; hover shows bubble with "Hello there!", click opens conversation in same bubble */}
            <button
              type="button"
              className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 border-0 focus:outline-none bg-transparent cursor-pointer"
              style={{
                left: `${cagentTriggerPosition.x}%`,
                top: `${cagentTriggerPosition.y}%`,
              }}
              onMouseEnter={() => setCagentHoverTrigger(true)}
              onMouseLeave={() => setCagentHoverTrigger(false)}
              onClick={handleCagentOpen}
              aria-label="Open Cagent"
            />

            {/* Single bubble: "Hello there!" uses left position, conversation uses cagentBubblePosition */}
            {(cagentHoverTrigger && !cagentBubbleOpen) || cagentBubbleOpen ? (
              <div
                className="absolute z-50 max-w-xs rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 px-4 py-3 shadow-xl"
                style={{
                  left: cagentBubbleOpen ? `${cagentBubblePosition.x}%` : `${cagentHelloBubblePosition.x}%`,
                  top: cagentBubbleOpen ? `${cagentBubblePosition.y}%` : `${cagentHelloBubblePosition.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {cagentBubbleOpen ? (
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <div className="flex-1">
                      <p
                        className="whitespace-pre-wrap"
                        style={{ fontFamily: '"Comic Neue", var(--font-comic-neue), "Comic Sans MS", cursive' }}
                      >
                        {cagentLoading ? "..." : cagentGuideText || "Loading..."}
                      </p>
                      <form onSubmit={handleCagentSend} className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={cagentUserInput}
                          onChange={(e) => setCagentUserInput(e.target.value)}
                          placeholder="Talk to Cagent..."
                          className="flex-1 rounded-full border border-purple-200 bg-white/80 px-3 py-1 text-xs focus:outline-none focus:ring-0"
                        />
                        <button
                          type="submit"
                          disabled={!cagentUserInput.trim() || cagentSending}
                          className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCagentBubbleOpen(false)}
                      className="text-xs text-purple-500 hover:text-purple-700"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="font-hand text-sm text-purple-800">Hello there!</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Bubble position adjustment tool (farm) */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBubblePositionTool((b) => !b)}
              className="rounded-xl font-hand text-xs bg-white/90 shadow"
            >
              {showBubblePositionTool ? "Hide bubble position tool" : "Bubble position adjustment"}
            </Button>
            {showBubblePositionTool && (
              <div className="mt-2 rounded-xl border border-purple-200 bg-white/95 p-3 space-y-2 text-xs shadow-lg">
                <p className="font-hand font-semibold text-purple-800">Trigger (bear position) %</p>
                <div className="flex gap-2 items-center">
                  <label className="font-hand">x</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentTriggerPosition.x}
                    onChange={(e) => setCagentTriggerPosition((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                  <label className="font-hand">y</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentTriggerPosition.y}
                    onChange={(e) => setCagentTriggerPosition((p) => ({ ...p, y: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                </div>
                <p className="font-hand font-semibold text-purple-800 mt-2">Bubble position % (conversation)</p>
                <div className="flex gap-2 items-center">
                  <label className="font-hand">x</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentBubblePosition.x}
                    onChange={(e) => setCagentBubblePosition((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                  <label className="font-hand">y</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentBubblePosition.y}
                    onChange={(e) => setCagentBubblePosition((p) => ({ ...p, y: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                </div>
                <p className="font-hand font-semibold text-purple-800 mt-2">Hello bubble position %</p>
                <div className="flex gap-2 items-center">
                  <label className="font-hand">x</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentHelloBubblePosition.x}
                    onChange={(e) => setCagentHelloBubblePosition((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                  <label className="font-hand">y</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cagentHelloBubblePosition.y}
                    onChange={(e) => setCagentHelloBubblePosition((p) => ({ ...p, y: Number(e.target.value) }))}
                    className="w-16 rounded border border-purple-200 px-1 py-0.5"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: selected review + work content */}
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
