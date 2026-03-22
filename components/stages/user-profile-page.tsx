"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import {
  BookOpen,
  FileText,
  Mail,
  MessageCircle,
  User as UserIcon,
  Settings,
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

/** 單棵樹的成長記錄（與 page 的 TreeGrowthDetail 一致） */
export interface TreeGrowthDetailRecord {
  workTitle: string
  workType: "story" | "review" | "letter"
  excerpt: string
  triggerSentence?: string
  overallEvidence?: string
  reason?: string
  timestamp: number
}

const TREE_DIMENSION_NAMES: Record<number, string> = {
  1: "Perseverance",
  2: "Respect for Others",
  3: "Responsibility",
  4: "National Identity",
  5: "Commitment",
  6: "Integrity",
  7: "Benevolence",
  8: "Law-abidingness",
  9: "Empathy",
  10: "Diligence",
  11: "Filial Piety",
  12: "Unity",
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
  treeGrowthDetails?: Record<number, TreeGrowthDetailRecord[]>
  recentGrowthTreeId?: number | null
  recentGrowthDimension?: "vocab" | "detail" | "logic" | null
  farmEntryNonce?: number
  onVisitOthersFarm?: () => void
  isOtherFarm?: boolean
}

type FarmElementId = "farmbacktomap" | "farmsetting" | "farmwrittingboard" | "vistothersfarm"

interface FarmElementConfig {
  id: FarmElementId
  label: string
  imageSrc: string
}

/** 與 object-cover 背景對齊的 overlay 矩形（px），overlay 內 % 即為背景圖上的相對位置/大小 */
interface CoverOverlayRect {
  width: number
  height: number
  left: number
  top: number
}

interface FarmElementState {
  x: number
  y: number
  scale: number
}

const getDefaultFarmButtonStates = (otherFarm: boolean): Record<FarmElementId, FarmElementState> => ({
  farmbacktomap: otherFarm ? { x: 74, y: 43.9, scale: 0.75 } : { x: 74.1, y: 44.0, scale: 0.78 },
  farmsetting: otherFarm ? { x: 34.1, y: 49.6, scale: 0.8 } : { x: 34.3, y: 49.5, scale: 0.8 },
  farmwrittingboard: otherFarm ? { x: 62.8, y: 50.5, scale: 1.1 } : { x: 62.9, y: 51.0, scale: 1.15 },
  vistothersfarm: { x: 73.2, y: 37.0, scale: 0.81 },
})

const DEFAULT_TREE_LAYOUT: FarmElementState[] = [
  { x: 35.2, y: 74.1, scale: 0.4 },
  { x: 42.5, y: 73.2, scale: 0.4 },
  { x: 48.9, y: 73.8, scale: 0.4 },
  { x: 55.9, y: 73.2, scale: 0.4 },
  { x: 63.2, y: 73.5, scale: 0.4 },
  { x: 70.2, y: 73.5, scale: 0.4 },
  { x: 33.7, y: 87.5, scale: 0.4 },
  { x: 41.3, y: 87.8, scale: 0.4 },
  { x: 49.2, y: 87.8, scale: 0.4 },
  { x: 56.5, y: 88.0, scale: 0.4 },
  { x: 63.8, y: 88.1, scale: 0.4 },
  { x: 71.7, y: 87.8, scale: 0.4 },
]

// 视觉上将两排树位对调：上排显示 7-12，下排显示 1-6
const FARM_SLOT_TREE_IDS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]

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
  treeGrowthDetails,
  recentGrowthTreeId,
  recentGrowthDimension,
  farmEntryNonce = 0,
  onVisitOthersFarm,
  isOtherFarm = false,
}: UserProfilePageProps) {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [selectedWorkForReview, setSelectedWorkForReview] = useState<WorkItem | null>(null)
  const [reviewDraft, setReviewDraft] = useState("")
  const [starRatings, setStarRatings] = useState<Record<string, 1 | 2 | 3 | 0>>({
    vocab: 0,
    grammar: 0,
    coherence: 0,
    creativity: 0,
    structure: 0,
  })
  const [dimensionTexts, setDimensionTexts] = useState<Record<string, string>>({
    vocab: "",
    grammar: "",
    coherence: "",
    creativity: "",
    structure: "",
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null)
  const [editingWorkText, setEditingWorkText] = useState("")
  const [savingWorkId, setSavingWorkId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [forest, setForest] = useState<{ id: number; stage: number }[]>([])
  const [highlightTreeId, setHighlightTreeId] = useState<number | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null)
  const [hoveredTreeId, setHoveredTreeId] = useState<number | null>(null)
  const farmContainerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredFarmElement, setHoveredFarmElement] = useState<FarmElementId | null>(null)
  const [viewMode, setViewMode] = useState<"farm" | "writings">("farm")
  // 进入 farm 视图的次数：用于确保每次切回 farm 时都能重新触发闪光动画
  const [farmViewNonce, setFarmViewNonce] = useState(0)

  useEffect(() => {
    if (!isOtherFarm && viewMode === "farm") {
      setFarmViewNonce((n) => n + 1)
    }
  }, [viewMode, isOtherFarm])

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
  const [otherMapChapterImages, setOtherMapChapterImages] = useState<string[]>([])
  const [otherMapChapterIndex, setOtherMapChapterIndex] = useState(0)

  const farmElements: FarmElementConfig[] = isOtherFarm
    ? [
        { id: "farmbacktomap", label: "Back", imageSrc: "/farmbacktomap.png" },
        { id: "farmsetting", label: "Their Map", imageSrc: "/theirmap.png" },
        { id: "farmwrittingboard", label: "Writing Board", imageSrc: "/farmwritingboard.png" },
        { id: "vistothersfarm", label: "Visit Others' Farms", imageSrc: "/visitothersfarm.png" },
      ]
    : [
    { id: "farmbacktomap", label: "Back to Map", imageSrc: "/farmbacktomap.png" },
    { id: "farmsetting", label: "Settings", imageSrc: "/farmsetting.png" },
    { id: "farmwrittingboard", label: "Writing Board", imageSrc: "/farmwritingboard.png" },
    { id: "vistothersfarm", label: "Visit Others' Farms", imageSrc: "/visitothersfarm.png" },
  ]

  const farmElementStates = getDefaultFarmButtonStates(isOtherFarm)
  const farmTreeStates = DEFAULT_TREE_LAYOUT
  const forestById = new Map(forest.map((tree) => [tree.id, tree] as const))

  const farmBackgroundSrc = "/farm.png"
  const farmBackgroundAlt = isOtherFarm ? "Other Student Farm Background" : "My Farm Background"
  const treeCount = 12

  const farmImageRef = useRef<HTMLImageElement | null>(null)
  const [coverOverlayRect, setCoverOverlayRect] = useState<CoverOverlayRect | null>(null)

  const updateCoverOverlayRect = useCallback(() => {
    const container = farmContainerRef.current
    const img = farmImageRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const s = Math.max(cw / iw, ch / ih)
    setCoverOverlayRect({
      width: s * iw,
      height: s * ih,
      left: -(s * iw - cw) / 2,
      top: -(s * ih - ch) / 2,
    })
  }, [])

  useEffect(() => {
    const container = farmContainerRef.current
    const img = farmImageRef.current
    if (!img || !container) return
    if (img.complete && img.naturalWidth) updateCoverOverlayRect()
    img.addEventListener("load", updateCoverOverlayRect)
    window.addEventListener("resize", updateCoverOverlayRect)
    const ro = new ResizeObserver(updateCoverOverlayRect)
    ro.observe(container)
    return () => {
      img.removeEventListener("load", updateCoverOverlayRect)
      window.removeEventListener("resize", updateCoverOverlayRect)
      ro.disconnect()
    }
  }, [updateCoverOverlayRect])

  useEffect(() => {
    if (!isOtherFarm || typeof window === "undefined") return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/user-map-state?user_id=${encodeURIComponent(userId)}`)
        if (res.ok) {
          const json = await res.json()
          const state = json?.state ?? {}
          const rawChapters = Array.isArray(state?.chapters) ? state.chapters : null
          if (rawChapters) {
            const images = rawChapters.map((c: any) => c?.mapImageUrl).filter((v: any) => typeof v === "string" && v.trim())
            if (!cancelled && images.length > 0) {
              setOtherMapChapterImages(images)
              setOtherMapChapterIndex(images.length - 1)
              setOtherMapImageUrl(images[images.length - 1])
              return
            }
          }

          const mapImageUrl = state?.mapImageUrl
          if (!cancelled && typeof mapImageUrl === "string" && mapImageUrl.trim()) {
            setOtherMapChapterImages(mapImageUrl ? [mapImageUrl] : [])
            setOtherMapChapterIndex(0)
            setOtherMapImageUrl(mapImageUrl)
            return
          }
        }
      } catch {
        // ignore and fallback to local storage
      }
      try {
        const raw = localStorage.getItem(`cwriteMapState:${userId}`)
        if (!raw || cancelled) return
        const parsed = JSON.parse(raw) as any
        const rawChapters = Array.isArray(parsed?.chapters) ? parsed.chapters : null
        if (rawChapters) {
          const images = rawChapters.map((c: any) => c?.mapImageUrl).filter((v: any) => typeof v === "string" && v.trim())
          if (images.length > 0 && !cancelled) {
            setOtherMapChapterImages(images)
            setOtherMapChapterIndex(images.length - 1)
            setOtherMapImageUrl(images[images.length - 1])
          }
          return
        }
        if (typeof parsed?.mapImageUrl === "string" && parsed.mapImageUrl.trim()) {
          setOtherMapChapterImages([parsed.mapImageUrl])
          setOtherMapChapterIndex(0)
          setOtherMapImageUrl(parsed.mapImageUrl)
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOtherFarm, userId])

  useEffect(() => {
    if (!isOtherFarm || !showOtherMapDialog) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/user-map-state?user_id=${encodeURIComponent(userId)}`)
        if (!res.ok) return
        const json = await res.json()
        const state = json?.state ?? {}
        const rawChapters = Array.isArray(state?.chapters) ? state.chapters : null
        if (rawChapters) {
          const images = rawChapters.map((c: any) => c?.mapImageUrl).filter((v: any) => typeof v === "string" && v.trim())
          if (!cancelled && images.length > 0) {
            setOtherMapChapterImages(images)
            setOtherMapChapterIndex(images.length - 1)
            setOtherMapImageUrl(images[images.length - 1])
            return
          }
        }

        const latest = state?.mapImageUrl
        if (!cancelled && typeof latest === "string" && latest.trim()) {
          setOtherMapChapterImages([latest])
          setOtherMapChapterIndex(0)
          setOtherMapImageUrl(latest)
        }
      } catch {
        // ignore and fallback to local storage
        try {
          const raw = localStorage.getItem(`cwriteMapState:${userId}`)
          if (!raw || cancelled) return
          const parsed = JSON.parse(raw) as any
          const rawChapters = Array.isArray(parsed?.chapters) ? parsed.chapters : null
          if (rawChapters) {
            const images = rawChapters.map((c: any) => c?.mapImageUrl).filter((v: any) => typeof v === "string" && v.trim())
            if (!cancelled && images.length > 0) {
              setOtherMapChapterImages(images)
              setOtherMapChapterIndex(images.length - 1)
              setOtherMapImageUrl(images[images.length - 1])
              return
            }
          }
          if (typeof parsed?.mapImageUrl === "string" && parsed.mapImageUrl.trim()) {
            setOtherMapChapterImages([parsed.mapImageUrl])
            setOtherMapChapterIndex(0)
            setOtherMapImageUrl(parsed.mapImageUrl)
          }
        } catch {
          // ignore
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOtherFarm, showOtherMapDialog, userId])

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

  // 同步来自主页的小树森林与最近成长信息（仅自己的農場）
  useEffect(() => {
    if (!isOtherFarm && trees && Array.isArray(trees)) {
      setForest(trees.slice(0, 12))
    }
  }, [isOtherFarm, trees])

  // 其他用戶農場：拉取該用戶的 12 棵價值觀樹數據並顯示
  useEffect(() => {
    if (!isOtherFarm || !userId) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/user-profile?user_id=${encodeURIComponent(userId)}`)
        if (!res.ok) return
        const data = await res.json()
        const raw = data?.trees
        if (cancelled) return
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw
            .slice(0, 12)
            .map((item: { id?: number; stage?: number }, idx: number) => ({
              id: Number(item?.id) || idx + 1,
              stage: Math.min(4, Math.max(2, Number(item?.stage) ?? 2)),
            }))
          setForest(normalized)
        } else {
          setForest(Array.from({ length: 12 }, (_, i) => ({ id: i + 1, stage: 2 })))
        }
      } catch {
        if (!cancelled) setForest(Array.from({ length: 12 }, (_, i) => ({ id: i + 1, stage: 2 })))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOtherFarm, userId])

  useEffect(() => {
    if (recentGrowthTreeId && trees && trees.some((t) => t.id === recentGrowthTreeId)) {
      // 强制“重新触发闪光”：
      // 如果这次进入 farm 的 recentGrowthTreeId 和上次相同，React 可能不会触发重新动画，
      // 所以先清空，再立刻设回去让 span 重新挂载/动画重新开始。
      setHighlightTreeId(null)
      const restart = window.setTimeout(() => {
        setHighlightTreeId(recentGrowthTreeId)
      }, 30)

      const timer = window.setTimeout(() => {
        setHighlightTreeId(null)
      }, 4030)

      return () => {
        clearTimeout(restart)
        clearTimeout(timer)
      }
    }
  }, [recentGrowthTreeId, trees, farmEntryNonce, farmViewNonce])

  const teacherReviews = reviews.filter((r) => r.reviewerRole === "teacher")
  const peerReviews = reviews.filter((r) => r.reviewerRole === "student")

  const fetchCagentGuide = useCallback(
    async (userMessage?: string) => {
      setCagentLoading(true)
      if (!userMessage) {
        setCagentGuideText(null)
      } else {
        setCagentGuideText("Cagent is thinking... ✨")
      }
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
        if (!res.ok) throw new Error(`cagent_guide_http_${res.status}`)
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

  const resetPeerReviewForm = useCallback(() => {
    setReviewDraft("")
    setStarRatings({
      vocab: 0,
      grammar: 0,
      coherence: 0,
      creativity: 0,
      structure: 0,
    })
    setDimensionTexts({
      vocab: "",
      grammar: "",
      coherence: "",
      creativity: "",
      structure: "",
    })
  }, [])

  const handleSubmitReview = useCallback(async () => {
    if (!selectedWorkForReview || !currentUsername || !currentUserRole) return
    // 所有維度至少 1 星且有文字
    const dims = ["vocab", "grammar", "coherence", "creativity", "structure"] as const
    for (const key of dims) {
      if (!starRatings[key] || !dimensionTexts[key].trim()) {
        if (typeof window !== "undefined") {
          window.alert("Please rate all 5 dimensions and write a short comment for each one.")
        }
        return
      }
    }
    const combinedContent =
      dims
        .map((key) => {
          const label =
            key === "vocab"
              ? "Vocabulary"
              : key === "grammar"
              ? "Grammar"
              : key === "coherence"
              ? "Coherence"
              : key === "creativity"
              ? "Creativity"
              : "Structure"
          const stars = "★".repeat(starRatings[key]) + "☆".repeat(3 - starRatings[key])
          return `${label} (${stars}):\n${dimensionTexts[key].trim()}`
        })
        .join("\n\n") + (reviewDraft.trim() ? `\n\nOverall:\n${reviewDraft.trim()}` : "")
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
          content: combinedContent,
          work_title: selectedWorkForReview.title,
          work_content: selectedWorkForReview.content,
        }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to submit review")
      }
      resetPeerReviewForm()
      setSelectedWorkForReview(null)
      const refreshed = await fetch(`/api/reviews?user_id=${userId}`).then((r) => r.json())
      setReviews(refreshed.reviews || [])
      setUnreadCount(refreshed.unreadCount ?? 0)
      } catch (error) {
      console.error("Submit review failed:", error)
    } finally {
      setReviewSubmitting(false)
    }
  }, [selectedWorkForReview, reviewDraft, currentUsername, currentUserRole, userId, starRatings, dimensionTexts, resetPeerReviewForm])

  const handleStartEditWork = useCallback((work: WorkItem) => {
    setEditingWorkId(work.id)
    setEditingWorkText(work.content || "")
  }, [])

  const handleSaveWork = useCallback(
    async (work: WorkItem) => {
      if (!currentUsername || currentUsername !== userId) return
      setSavingWorkId(work.id)
      try {
        const res = await fetch("/api/user-works", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            work_type: work.type,
            work_id: work.id,
            content: editingWorkText,
          }),
        })
        const data = await res.json()
        if (!res.ok || data?.error) {
          throw new Error(data?.error || "Failed to save")
        }
        setWorks((prev) => prev.map((item) => (item.id === work.id ? { ...item, content: editingWorkText } : item)))
        setEditingWorkId(null)
      } catch (error) {
        console.error("Save work failed:", error)
      } finally {
        setSavingWorkId(null)
      }
    },
    [currentUsername, userId, editingWorkText]
  )

  if (viewMode === "writings") {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-purple-50/80"
        style={{ paddingTop: "128px", paddingBottom: "120px" }}
        data-stage="userProfile"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 pl-16 lg:pl-20">
          <BackButton onClick={() => setViewMode("farm")} variant="amber" aria-label="Back to Farm" />
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
                                    {!isOtherFarm && currentUsername === userId && (
                                      <div className="flex items-center gap-2">
                                        {editingWorkId === w.id ? (
                                          <>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingWorkId(null)
                                                setEditingWorkText("")
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                              disabled={savingWorkId === w.id}
                                              onClick={() => handleSaveWork(w)}
                                            >
                                              {savingWorkId === w.id ? "Saving..." : "Save"}
                                            </Button>
                                          </>
                                        ) : (
                                          <Button type="button" size="sm" variant="outline" onClick={() => handleStartEditWork(w)}>
                                            Edit
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                    {isOtherFarm && currentUsername && currentUsername !== userId && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                                        onClick={() => {
                                          setSelectedWorkForReview(w)
                                          resetPeerReviewForm()
                                        }}
                                      >
                                        Evaluate
                                      </Button>
                                    )}
                                  </div>
                                  <div className="max-h-56 overflow-y-auto rounded-lg border border-amber-200 bg-white/80 p-2">
                                    {editingWorkId === w.id && !isOtherFarm && currentUsername === userId ? (
                                      <textarea
                                        value={editingWorkText}
                                        onChange={(e) => setEditingWorkText(e.target.value)}
                                        className="min-h-[180px] w-full rounded-lg border border-amber-200 bg-white p-2 text-sm focus:outline-none"
                                      />
                                    ) : (
                                      <pre className="whitespace-pre-wrap break-words font-hand text-sm text-foreground">
                                        {w.content || "(No content)"}
                                      </pre>
                                    )}
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
              onClick={() => {
                resetPeerReviewForm()
                setSelectedWorkForReview(null)
              }}
            >
              <div
                className="w-full max-w-4xl rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-hand text-xl font-bold text-foreground">Evaluate: {selectedWorkForReview.title} ✨</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetPeerReviewForm()
                      setSelectedWorkForReview(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Reviewer: {currentUsername || "unknown"} / Target: {userId}. Please rate each dimension with 1-3 stars and write comments.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { key: "vocab", label: "Vocabulary", placeholder: "I think the vocabulary in this writing is very rich and interesting." },
                    { key: "grammar", label: "Grammar", placeholder: "The grammar in this writing is mostly correct and clear." },
                    { key: "coherence", label: "Coherence", placeholder: "The ideas are connected in a way that is easy to follow." },
                    { key: "creativity", label: "Creativity", placeholder: "The story ideas are creative and make me excited to read." },
                    { key: "structure", label: "Structure", placeholder: "The beginning, middle, and end are clear and well organized." },
                  ].map((dim) => (
                    <div key={dim.key} className={`rounded-2xl border p-3 shadow-sm transition-transform duration-200 hover:scale-[1.01] ${
                      dim.key === "vocab"
                        ? "border-pink-200 bg-pink-50/80"
                        : dim.key === "grammar"
                        ? "border-blue-200 bg-blue-50/80"
                        : dim.key === "coherence"
                        ? "border-violet-200 bg-violet-50/80"
                        : dim.key === "creativity"
                        ? "border-amber-200 bg-amber-50/80"
                        : "border-emerald-200 bg-emerald-50/80"
                    }`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-hand text-sm font-bold text-foreground">{dim.label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`text-xl leading-none transition-transform duration-150 hover:scale-125 ${starRatings[dim.key as keyof typeof starRatings] >= star ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                              onClick={() =>
                                setStarRatings((prev) => ({
                                  ...prev,
                                  [dim.key]: star as 1 | 2 | 3,
                                }))
                              }
                              aria-label={`${dim.label} ${star} star`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={dimensionTexts[dim.key as keyof typeof dimensionTexts]}
                        onChange={(e) =>
                          setDimensionTexts((prev) => ({
                            ...prev,
                            [dim.key]: e.target.value,
                          }))
                        }
                        placeholder={dim.placeholder}
                        className="min-h-[56px] w-full rounded-xl border border-purple-200 bg-white/90 p-2 text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="rounded-2xl border border-purple-200 bg-white/80 p-3 md:col-span-2">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Overall comment (optional)</p>
                    <textarea
                      value={reviewDraft}
                      onChange={(e) => setReviewDraft(e.target.value)}
                      placeholder="Write your overall feeling about this writing..."
                      className="min-h-[64px] w-full rounded-xl border border-purple-200 bg-white/90 p-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetPeerReviewForm()
                      setSelectedWorkForReview(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
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
      {/* My Farm - 固定視窗鋪滿，背景 object-cover 不露 firstmap，前景用 % 鎖定相對位置 */}
      <div ref={farmContainerRef} className="fixed inset-0 w-full h-full overflow-hidden">
        <img
          ref={farmImageRef}
          src={farmBackgroundSrc}
          alt={farmBackgroundAlt}
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />

        {/* 與 object-cover 背景同尺度、同裁切，內層 % 即為背景圖上的相對位置與大小，不穿幫 */}
        <div
          className="absolute"
          style={
            coverOverlayRect
              ? {
                  width: coverOverlayRect.width,
                  height: coverOverlayRect.height,
                  left: coverOverlayRect.left,
                  top: coverOverlayRect.top,
                }
              : { left: 0, top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
          }
        >
            {Array.from({ length: treeCount }).map((_, index) => {
                const treeState = farmTreeStates[index] || DEFAULT_TREE_LAYOUT[index]
                const slotTreeId = FARM_SLOT_TREE_IDS[index] ?? index + 1
                const treeData = forestById.get(slotTreeId)
                const isHighlightedTree = treeData && highlightTreeId === treeData.id
                const isHoveredTree = treeData && hoveredTreeId === treeData.id
                const treeStage = Math.max(2, Math.min(4, Number(treeData?.stage ?? 2)))
                const treeImageSrc = treeStage >= 4 ? "/tree4.png" : treeStage >= 3 ? "/tree3.png" : "/tree2.png"
                const treeBaseSizePercent = treeStage >= 4 ? 11.2 : 8
                const treeTop = treeStage >= 4 ? treeState.y + 3.6 : treeState.y
                const treeLeft = treeStage >= 4 ? treeState.x + 1.2 : treeState.x
                const treeId = treeData?.id ?? slotTreeId
                const canClickTree = !isOtherFarm && treeGrowthDetails != null
                const hoverScale = isHighlightedTree ? 1.14 : isHoveredTree ? 1.08 : 1
                const Wrapper = canClickTree ? "button" : "div"
                return (
                  <Wrapper
                    key={`farm-tree-${index}`}
                    type={canClickTree ? "button" : undefined}
                    className="absolute -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                    style={{
                      left: `${treeLeft}%`,
                      top: `${treeTop}%`,
                      width: `${treeBaseSizePercent}%`,
                      aspectRatio: "698 / 850",
                      zIndex: isHoveredTree || isHighlightedTree ? 8 : 5,
                      cursor: canClickTree ? "pointer" : "default",
                      filter: isHighlightedTree || isHoveredTree ? "drop-shadow(0 0 18px rgba(250, 204, 21, 1)) drop-shadow(0 0 28px rgba(255, 215, 0, 0.8))" : "none",
                      transform: `translate(-50%, -50%) scale(${treeState.scale * hoverScale})`,
                      transformOrigin: "center center",
                      transition: "transform 0.25s ease, filter 0.25s ease",
                    }}
                    onClick={canClickTree ? () => setSelectedTreeId(treeId) : undefined}
                    aria-label={canClickTree ? `View growth record for tree ${treeId}` : undefined}
                    onMouseEnter={() => setHoveredTreeId(treeId)}
                    onMouseLeave={() => setHoveredTreeId((prev) => (prev === treeId ? null : prev))}
                  >
                    {isHighlightedTree && (
                      <span className="absolute inset-0 pointer-events-none rounded-full animate-pulse opacity-60" style={{ boxShadow: "inset 0 0 30px 8px rgba(255, 215, 0, 0.4)" }} aria-hidden />
                    )}
                    <img
                      src={treeImageSrc}
                      alt={`Farm tree ${index + 1}`}
                      className="h-full w-full object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                  </Wrapper>
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
                    else if (element.id === "vistothersfarm") {
                      if (typeof onVisitOthersFarm === "function") onVisitOthersFarm()
                      else if (isOtherFarm) onBack()
                    }
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

            {/* Tree growth record modal: only on own farm when a tree is clicked */}
            {selectedTreeId != null && !isOtherFarm && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tree-growth-dialog-title"
              >
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setSelectedTreeId(null)}
                  aria-hidden
                />
                <div
                  className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-3xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/98 via-orange-50/98 to-yellow-50/98 shadow-2xl shadow-amber-200/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-amber-200/60 bg-white/50 px-5 py-4">
                    <h2 id="tree-growth-dialog-title" className="text-lg font-bold text-amber-900 flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>🌱</span>
                      {TREE_DIMENSION_NAMES[selectedTreeId] ?? `Tree ${selectedTreeId}`} Growth Record
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSelectedTreeId(null)}
                      className="rounded-full p-2 text-amber-700 hover:bg-amber-200/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      aria-label="Close"
                    >
                      <span className="text-xl leading-none">×</span>
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(85vh-4.5rem)]">
                    {(treeGrowthDetails?.[selectedTreeId] ?? []).length === 0 ? (
                      <p className="text-amber-800/80 text-center py-6">This little tree has no growth records yet. Keep writing to water it!</p>
                    ) : (
                      [...(treeGrowthDetails?.[selectedTreeId] ?? [])]
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((record, i) => (
                          <div
                            key={`${record.timestamp}-${i}`}
                            className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 shadow-sm"
                          >
                            <p className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                              <span className="text-base">
                                {record.workType === "story" ? "📖" : record.workType === "review" ? "⭐" : "✉️"}
                              </span>
                              {record.workTitle}
                            </p>
                            {record.triggerSentence && (
                              <>
                                <p className="text-xs font-semibold text-amber-700 mt-2">Trigger sentence</p>
                                <p className="text-sm text-amber-900 italic border-l-2 border-amber-300/70 pl-3 mt-1">
                                  「{record.triggerSentence}」
                                </p>
                              </>
                            )}
                            {!record.triggerSentence && record.overallEvidence && (
                              <>
                                <p className="text-xs font-semibold text-amber-700 mt-2">Overall evidence</p>
                                <p className="text-sm text-amber-900 border-l-2 border-amber-300/70 pl-3 mt-1 leading-relaxed">
                                  {record.overallEvidence}
                                </p>
                              </>
                            )}
                            {record.reason && (
                              <>
                                <p className="text-xs font-semibold text-amber-700 mt-3">Why this shows {TREE_DIMENSION_NAMES[selectedTreeId] ?? "this value"}</p>
                                <p className="text-sm text-amber-800/95 leading-relaxed mt-1">
                                  {record.reason}
                                </p>
                              </>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

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
                className={`absolute z-50 max-w-md rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 px-5 py-4 shadow-xl ${
                  isOtherFarm ? "animate-pulse" : ""
                }`}
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
                  <p className="font-hand text-base text-purple-800">
                    {otherFarmBubbleStep === "intro"
                      ? `Hello... Wait, you are not ${userId}, who are you?`
                      : `You can click the writing board below to review ${userId}'s work. Leave your review and head out - ${userId} doesn't let me talk to strangers.`}
                  </p>
                ) : cagentBubbleOpen ? (
                  <div className="flex items-start gap-2 text-base text-foreground">
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
                          className="flex-1 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-0"
                        />
                        <button
                          type="submit"
                          onClick={handleCagentSend}
                          disabled={!cagentUserInput.trim() || cagentSending}
                          className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
                        >
                          {cagentSending ? "Sending..." : "Send"}
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
                  <p className="font-hand text-base text-purple-800">Hello there!</p>
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
                {otherMapChapterImages.length > 1 && (
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={otherMapChapterIndex <= 0}
                      onClick={() => {
                        const nextIndex = Math.max(0, otherMapChapterIndex - 1)
                        setOtherMapChapterIndex(nextIndex)
                        setOtherMapImageUrl(otherMapChapterImages[nextIndex] ?? null)
                      }}
                    >
                      move to last chapter
                    </Button>
                    <span className="font-hand text-sm font-bold text-foreground/80">
                      Chapter {otherMapChapterIndex + 1}/{otherMapChapterImages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={otherMapChapterIndex >= otherMapChapterImages.length - 1}
                      onClick={() => {
                        const nextIndex = Math.min(otherMapChapterImages.length - 1, otherMapChapterIndex + 1)
                        setOtherMapChapterIndex(nextIndex)
                        setOtherMapImageUrl(otherMapChapterImages[nextIndex] ?? null)
                      }}
                    >
                      move to next chapter
                    </Button>
                  </div>
                )}
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
  )
}
