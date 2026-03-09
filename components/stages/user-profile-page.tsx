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
  currentUsername?: string
  currentUserRole?: string
  avatarUrl?: string | null
  avatarEmoji?: string | null
  onBack: () => void
  onOpenSettings: () => void
  trees?: { id: number; stage: number }[] | null
  recentGrowthTreeId?: number | null
  recentGrowthDimension?: "vocab" | "detail" | "logic" | null
  onVisitOthersFarm?: () => void
  isOtherFarm?: boolean
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

const getDefaultFarmButtonStates = (otherFarm: boolean): Record<FarmElementId, FarmElementState> => ({
  farmbacktomap: otherFarm ? { x: 74.0, y: 43.9, scale: 0.71 } : { x: 74.1, y: 43.7, scale: 0.7 },
  farmsetting: otherFarm ? { x: 34.7, y: 49.6, scale: 0.8 } : { x: 34.8, y: 50.0, scale: 0.8 },
  farmwrittingboard: otherFarm ? { x: 63.2, y: 50.6, scale: 1.1 } : { x: 63.2, y: 50.6, scale: 1.1 },
  vistothersfarm: otherFarm ? { x: 73.1, y: 37.0, scale: 0.0 } : { x: 73.1, y: 37.0, scale: 0.75 },
})

const DEFAULT_TREE_LAYOUT: FarmElementState[] = [
  { x: 22.0, y: 54.0, scale: 1.0 },
  { x: 29.5, y: 59.0, scale: 0.95 },
  { x: 37.0, y: 55.5, scale: 1.05 },
  { x: 44.2, y: 60.2, scale: 0.9 },
  { x: 51.3, y: 56.8, scale: 1.0 },
  { x: 58.6, y: 60.0, scale: 0.92 },
  { x: 65.8, y: 56.4, scale: 1.02 },
  { x: 73.0, y: 60.5, scale: 0.9 },
  { x: 27.0, y: 69.0, scale: 0.9 },
  { x: 39.5, y: 71.0, scale: 0.95 },
  { x: 52.0, y: 69.3, scale: 0.92 },
  { x: 64.5, y: 71.2, scale: 0.9 },
]

const FARM_LAYOUT_STORAGE_KEY = "cwriteFarmLayoutV1"

export default function UserProfilePage({
  userId,
  userRole,
  currentUsername,
  currentUserRole,
  avatarUrl,
  avatarEmoji,
  onBack,
  onOpenSettings,
  trees,
  recentGrowthTreeId,
  recentGrowthDimension,
  onVisitOthersFarm,
  isOtherFarm = false,
}: UserProfilePageProps) {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [selectedWorkForReview, setSelectedWorkForReview] = useState<WorkItem | null>(null)
  const [reviewDraft, setReviewDraft] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [forest, setForest] = useState<{ id: number; stage: number }[]>([])
  const [highlightTreeId, setHighlightTreeId] = useState<number | null>(null)
  const farmContainerRef = useRef<HTMLDivElement | null>(null)
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
  const [cagentHoverTrigger, setCagentHoverTrigger] = useState(false)
  const [otherFarmBubbleStep, setOtherFarmBubbleStep] = useState<"intro" | "warning">("intro")
  const [bearLogoPosition, setBearLogoPosition] = useState({ x: 49.7, y: 43.7, scale: 0.5, rotation: -11 })
  const [showOtherMapDialog, setShowOtherMapDialog] = useState(false)
  const [otherMapImageUrl, setOtherMapImageUrl] = useState<string | null>(null)

  const farmElements: FarmElementConfig[] = isOtherFarm
    ? [
        { id: "farmbacktomap", label: "Back", imageSrc: "/farmbacktomap.png" },
        { id: "farmsetting", label: "Their Map", imageSrc: "/theirmap.png" },
        { id: "farmwrittingboard", label: "Writing Board", imageSrc: "/farmwritingboard.png" },
      ]
    : [
    { id: "farmbacktomap", label: "Back to Map", imageSrc: "/farmbacktomap.png" },
    { id: "farmsetting", label: "Settings", imageSrc: "/farmsetting.png" },
    { id: "farmwrittingboard", label: "Writing Board", imageSrc: "/farmwritingboard.png" },
    { id: "vistothersfarm", label: "Visit Others' Farms", imageSrc: "/visitothersfarm.png" },
  ]

  const [farmElementStates, setFarmElementStates] = useState<Record<FarmElementId, FarmElementState>>({
    ...getDefaultFarmButtonStates(isOtherFarm),
  })
  const [farmTreeStates, setFarmTreeStates] = useState<FarmElementState[]>(DEFAULT_TREE_LAYOUT)
  const [layoutToolOpen, setLayoutToolOpen] = useState(false)
  const [layoutTarget, setLayoutTarget] = useState<string>("button:farmsetting")

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


  const farmBackgroundSrc = isOtherFarm ? "/farm2.png" : "/farm.png"
  const farmBackgroundAlt = isOtherFarm ? "Other Student Farm Background" : "My Farm Background"
  const treeCount = 12

  const selectedLayoutState = (() => {
    if (layoutTarget.startsWith("button:")) {
      const id = layoutTarget.replace("button:", "") as FarmElementId
      return farmElementStates[id]
    }
    const index = Number(layoutTarget.replace("tree:", ""))
    return Number.isNaN(index) ? null : farmTreeStates[index] || null
  })()

  const updateSelectedLayoutState = (field: keyof FarmElementState, value: number) => {
    if (layoutTarget.startsWith("button:")) {
      const id = layoutTarget.replace("button:", "") as FarmElementId
      setFarmElementStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value },
      }))
      return
    }
    const index = Number(layoutTarget.replace("tree:", ""))
    if (Number.isNaN(index)) return
    setFarmTreeStates((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const resetSelectedLayoutState = () => {
    if (layoutTarget.startsWith("button:")) {
      const id = layoutTarget.replace("button:", "") as FarmElementId
      const defaults = getDefaultFarmButtonStates(false)
      setFarmElementStates((prev) => ({
        ...prev,
        [id]: defaults[id],
      }))
      return
    }
    const index = Number(layoutTarget.replace("tree:", ""))
    if (Number.isNaN(index)) return
    setFarmTreeStates((prev) => prev.map((item, i) => (i === index ? { ...DEFAULT_TREE_LAYOUT[i] } : item)))
  }

  const resetAllLayoutState = () => {
    setFarmElementStates(getDefaultFarmButtonStates(false))
    setFarmTreeStates(DEFAULT_TREE_LAYOUT.map((item) => ({ ...item })))
  }

  useEffect(() => {
    if (!isOtherFarm || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(`cwriteMapState:${userId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as { mapImageUrl?: string }
        if (typeof parsed.mapImageUrl === "string" && parsed.mapImageUrl.trim()) {
          setOtherMapImageUrl(parsed.mapImageUrl)
        }
      }
    } catch {
      // ignore
    }
  }, [isOtherFarm, userId])

  useEffect(() => {
    setFarmElementStates(getDefaultFarmButtonStates(isOtherFarm))
    if (!isOtherFarm) setFarmTreeStates(DEFAULT_TREE_LAYOUT.map((item) => ({ ...item })))
  }, [isOtherFarm])

  useEffect(() => {
    if (isOtherFarm || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(`${FARM_LAYOUT_STORAGE_KEY}:${userId}`)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        buttons?: Partial<Record<FarmElementId, Partial<FarmElementState>>>
        trees?: Partial<FarmElementState>[]
      }
      if (parsed.buttons) {
        const defaults = getDefaultFarmButtonStates(false)
        const nextButtons = { ...defaults }
        ;(Object.keys(defaults) as FarmElementId[]).forEach((id) => {
          const cfg = parsed.buttons?.[id]
          if (!cfg) return
          nextButtons[id] = {
            x: typeof cfg.x === "number" ? cfg.x : defaults[id].x,
            y: typeof cfg.y === "number" ? cfg.y : defaults[id].y,
            scale: typeof cfg.scale === "number" ? cfg.scale : defaults[id].scale,
          }
        })
        setFarmElementStates(nextButtons)
      }
      if (Array.isArray(parsed.trees)) {
        const nextTrees = DEFAULT_TREE_LAYOUT.map((item, index) => {
          const cfg = parsed.trees?.[index]
          if (!cfg) return { ...item }
          return {
            x: typeof cfg.x === "number" ? cfg.x : item.x,
            y: typeof cfg.y === "number" ? cfg.y : item.y,
            scale: typeof cfg.scale === "number" ? cfg.scale : item.scale,
          }
        })
        setFarmTreeStates(nextTrees)
      }
    } catch {
      // ignore
    }
  }, [isOtherFarm, userId])

  useEffect(() => {
    if (isOtherFarm || typeof window === "undefined") return
    localStorage.setItem(
      `${FARM_LAYOUT_STORAGE_KEY}:${userId}`,
      JSON.stringify({
        buttons: farmElementStates,
        trees: farmTreeStates,
      })
    )
  }, [isOtherFarm, userId, farmElementStates, farmTreeStates])

  useEffect(() => {
    if (!isOtherFarm) return
    setOtherFarmBubbleStep("intro")
    setCagentBubbleOpen(false)
  }, [isOtherFarm, userId])

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
    if (isOtherFarm) {
      setOtherFarmBubbleStep("warning")
      return
    }
    setCagentBubbleOpen(true)
    if (!cagentGuideText && !cagentLoading) fetchCagentGuide()
  }, [isOtherFarm, cagentGuideText, cagentLoading, fetchCagentGuide])

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

  const handleSubmitReview = useCallback(async () => {
    if (!selectedWorkForReview || !reviewDraft.trim() || !currentUsername || !currentUserRole) return
    setReviewSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_type: selectedWorkForReview.type,
          work_interaction_id: selectedWorkForReview.interactionId || null,
          author_username: userId,
          reviewer_username: currentUsername,
          reviewer_role: currentUserRole,
          content: reviewDraft.trim(),
          work_title: selectedWorkForReview.title,
          work_content: selectedWorkForReview.content,
        }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to submit review")
      }
      setReviewDraft("")
      setSelectedWorkForReview(null)
      const refreshed = await fetch(`/api/reviews?user_id=${userId}`).then((r) => r.json())
      setReviews(refreshed.reviews || [])
      setUnreadCount(refreshed.unreadCount ?? 0)
    } catch (error) {
      console.error("Submit review failed:", error)
    } finally {
      setReviewSubmitting(false)
    }
  }, [selectedWorkForReview, reviewDraft, currentUsername, currentUserRole, userId])

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
                  <div className="space-y-4">
                    {([
                      { type: "story", label: "Stories", icon: <BookOpen className="h-4 w-4 text-amber-600" /> },
                      { type: "review", label: "Book Reviews", icon: <FileText className="h-4 w-4 text-blue-600" /> },
                      { type: "letter", label: "Letters", icon: <Mail className="h-4 w-4 text-green-600" /> },
                    ] as const).map((section) => {
                      const items = works.filter((w) => w.type === section.type)
                      return (
                        <div key={section.type} className="rounded-xl border border-amber-100 bg-white/70 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            {section.icon}
                            <h4 className="font-hand text-sm font-bold text-foreground">{section.label}</h4>
                          </div>
                          {items.length === 0 ? (
                            <p className="font-hand text-xs text-muted-foreground">No {section.label.toLowerCase()} yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              {items.map((w) => (
                                <li
                                  key={w.id}
                                  className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2 font-hand"
                                >
                                  <div className="mb-2 flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-foreground">{w.title}</p>
                                      <p className="text-xs text-muted-foreground">{new Date(w.timestamp).toLocaleDateString("en-US")}</p>
                                    </div>
                                    {isOtherFarm && currentUsername && currentUsername !== userId && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                                        onClick={() => {
                                          setSelectedWorkForReview(w)
                                          setReviewDraft("")
                                        }}
                                      >
                                        Evaluate
                                      </Button>
                                    )}
                                  </div>
                                  <div className="max-h-56 overflow-y-auto rounded-lg border border-amber-200 bg-white/80 p-2">
                                    <pre className="whitespace-pre-wrap break-words font-hand text-sm text-foreground">
                                      {w.content || "(No content)"}
                                    </pre>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
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

          {isOtherFarm && selectedWorkForReview && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setSelectedWorkForReview(null)}
            >
              <div
                className="w-full max-w-2xl rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-hand text-lg font-bold text-foreground">Evaluate: {selectedWorkForReview.title}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedWorkForReview(null)}>Close</Button>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Reviewer: {currentUsername || "unknown"} / Target: {userId}
                </p>
                <textarea
                  value={reviewDraft}
                  onChange={(e) => setReviewDraft(e.target.value)}
                  placeholder="Write your evaluation feedback..."
                  className="min-h-[180px] w-full rounded-xl border border-purple-200 bg-purple-50/30 p-3 text-sm focus:outline-none"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedWorkForReview(null)}>Cancel</Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!reviewDraft.trim() || reviewSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
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
            src={farmBackgroundSrc}
            alt={farmBackgroundAlt}
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
            {!isOtherFarm &&
              Array.from({ length: treeCount }).map((_, index) => {
                const treeState = farmTreeStates[index] || DEFAULT_TREE_LAYOUT[index]
                const isHighlightedTree = forest[index] && highlightTreeId === forest[index].id
                const treeSizePercent = Math.min(24, Math.max(8, 8 * treeState.scale))
                return (
                  <div
                    key={`farm-tree-${index}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${treeState.x}%`,
                      top: `${treeState.y}%`,
                      width: `${treeSizePercent}%`,
                      aspectRatio: "698 / 850",
                      zIndex: 5,
                      filter: isHighlightedTree ? "drop-shadow(0 0 14px rgba(250, 204, 21, 0.95))" : "none",
                      transform: `translate(-50%, -50%) ${isHighlightedTree ? "scale(1.06)" : "scale(1)"}`,
                      transition: "transform 0.25s ease, filter 0.25s ease",
                    }}
                  >
                    <img
                      src="/tree2.png"
                      alt={`Farm tree ${index + 1}`}
                      className="h-full w-full object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                  </div>
                )
              })}

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
                    transition: "transform 0.25s ease-in-out",
                    zIndex: 20,
                  }}
                  onMouseEnter={() => setHoveredFarmElement(element.id)}
                  onMouseLeave={() => setHoveredFarmElement((prev) => (prev === element.id ? null : prev))}
                  onClick={() => {
                    if (element.id === "farmbacktomap") onBack()
                    else if (element.id === "farmsetting") {
                      if (isOtherFarm) setShowOtherMapDialog(true)
                      else onOpenSettings()
                    } else if (element.id === "farmwrittingboard") setViewMode("writings")
                    else if (element.id === "vistothersfarm" && !isOtherFarm && typeof onVisitOthersFarm === "function") onVisitOthersFarm()
                  }}
                >
                  <img
                    src={element.imageSrc}
                    alt={element.label}
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                  {element.id === "farmwrittingboard" && !isOtherFarm && unreadCount > 0 && (
                    <span
                      className="absolute right-[6%] top-[10%] h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white"
                      aria-label="Unread review notifications"
                    />
                  )}
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
            {isOtherFarm || (cagentHoverTrigger && !cagentBubbleOpen) || cagentBubbleOpen ? (
              <div
                className="absolute z-50 max-w-xs rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 px-4 py-3 shadow-xl"
                style={{
                  left: isOtherFarm
                    ? `${cagentHelloBubblePosition.x}%`
                    : cagentBubbleOpen
                      ? `${cagentBubblePosition.x}%`
                      : `${cagentHelloBubblePosition.x}%`,
                  top: isOtherFarm
                    ? `${cagentHelloBubblePosition.y}%`
                    : cagentBubbleOpen
                      ? `${cagentBubblePosition.y}%`
                      : `${cagentHelloBubblePosition.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {isOtherFarm ? (
                  <p className="font-hand text-sm text-purple-800">
                    {otherFarmBubbleStep === "intro"
                      ? `Hello... Wait, you are not ${userId}, who are you?`
                      : `You can click the writing board below to review ${userId}'s work. Leave your review and head out - ${userId} doesn't let me talk to strangers.`}
                  </p>
                ) : cagentBubbleOpen ? (
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

            {/* Bear sweater logo overlay (whitelogo.png) */}
            <div
              className="pointer-events-none absolute z-40"
              style={{
                left: `${bearLogoPosition.x}%`,
                top: `${bearLogoPosition.y}%`,
                transform: `translate(-50%, -50%) rotate(${bearLogoPosition.rotation}deg) scale(${bearLogoPosition.scale})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src="/whitelogo.png"
                alt="Sweater logo"
                className="w-10 h-10 object-contain select-none"
                draggable={false}
              />
            </div>
          </div>

          {!isOtherFarm && (
            <>
              <button
                type="button"
                onClick={() => setLayoutToolOpen((prev) => !prev)}
                className="absolute right-4 top-4 z-[70] rounded-xl border border-purple-200 bg-white/90 px-3 py-2 text-xs font-semibold text-purple-700 shadow-md hover:bg-white"
              >
                {layoutToolOpen ? "关闭布局工具" : "打开布局工具"}
              </button>
              {layoutToolOpen && (
                <div className="absolute right-4 top-16 z-[70] w-72 rounded-2xl border border-purple-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-sm">
                  <p className="mb-2 font-semibold text-foreground">农场布局调整</p>
                  <label className="mb-1 block text-muted-foreground">目标元素</label>
                  <select
                    value={layoutTarget}
                    onChange={(e) => setLayoutTarget(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="button:farmbacktomap">按钮：Back to Map</option>
                    <option value="button:farmsetting">按钮：Settings</option>
                    <option value="button:farmwrittingboard">按钮：Writing Board</option>
                    <option value="button:vistothersfarm">按钮：Visit Others' Farms</option>
                    {Array.from({ length: treeCount }).map((_, index) => (
                      <option key={`layout-tree-option-${index}`} value={`tree:${index}`}>
                        {`树：tree${index + 1}`}
                      </option>
                    ))}
                  </select>
                  {selectedLayoutState && (
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span>X 位置</span>
                          <span>{selectedLayoutState.x.toFixed(1)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          value={selectedLayoutState.x}
                          onChange={(e) => updateSelectedLayoutState("x", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span>Y 位置</span>
                          <span>{selectedLayoutState.y.toFixed(1)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          value={selectedLayoutState.y}
                          onChange={(e) => updateSelectedLayoutState("y", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span>缩放</span>
                          <span>{selectedLayoutState.scale.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0.3}
                          max={2.2}
                          step={0.01}
                          value={selectedLayoutState.scale}
                          onChange={(e) => updateSelectedLayoutState("scale", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={resetSelectedLayoutState} className="h-8 px-2 text-xs">
                      重置当前
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={resetAllLayoutState} className="h-8 px-2 text-xs">
                      重置全部
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">布局会自动保存到当前浏览器。</p>
                </div>
              )}
            </>
          )}

          {isOtherFarm && showOtherMapDialog && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
              onClick={() => setShowOtherMapDialog(false)}
            >
              <div
                className="w-full max-w-3xl rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-hand text-lg font-bold text-foreground">{userId}'s Map</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowOtherMapDialog(false)}>Close</Button>
                </div>
                <img
                  src={otherMapImageUrl || "/firstmap.png"}
                  alt={`${userId} map`}
                  className="w-full h-auto rounded-xl border border-purple-100 object-contain"
                />
              </div>
            </div>
          )}
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
