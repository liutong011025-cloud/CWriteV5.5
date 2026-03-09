"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import HomePage from "@/components/stages/home-page"
import WelcomePage from "@/components/stages/welcome-page"
import BookReviewWelcome from "@/components/stages/book-review-welcome"
import CharacterCreation from "@/components/stages/character-creation"
import CharacterCreationNoAi from "@/components/stages/character-creation-no-ai"
import PlotBrainstorm from "@/components/stages/plot-brainstorm"
import PlotBrainstormNoAi from "@/components/stages/plot-brainstorm-no-ai"
import StoryStructure from "@/components/stages/story-structure"
import StoryStructureNoAi from "@/components/stages/story-structure-no-ai"
import GuidedWriting from "@/components/stages/guided-writing"
import GuidedWritingNoAi from "@/components/stages/guided-writing-no-ai"
import StoryReview from "@/components/stages/story-review"
import LoginPage from "@/components/auth/login-page"
import Dashboard from "@/components/teacher/dashboard"
import PlanTest from "@/components/stages/plan-test"
import JourneyTicket, { type JourneyType } from "@/components/stages/journey-ticket"
import JourneyMap from "@/components/stages/journey-map"
import WriteTypeSelection from "@/components/stages/write-type-selection"
import BookReviewTypeSelection from "@/components/stages/book-review-type-selection"
import BookSelection from "@/components/stages/book-selection"
import BookSelectionNoAi from "@/components/stages/book-selection-no-ai"
import BookReviewLoading from "@/components/stages/book-review-loading"
import BookReviewWriting from "@/components/stages/book-review-writing"
import BookReviewWritingNoAi from "@/components/stages/book-review-writing-no-ai"
import BookReviewComplete from "@/components/stages/book-review-complete"
import AboutPage from "@/components/stages/about-page"
import GalleryPage from "@/components/stages/gallery-page"
import UserProfilePage from "@/components/stages/user-profile-page"
import UserSettingsPage from "@/components/stages/user-settings-page"
import LevelBadge from "@/components/level-badge"
import LetterAdventure from "@/components/stages/letter-adventure"
import LetterGame from "@/components/stages/letter-game"
import LetterGameNoAi from "@/components/stages/letter-game-no-ai"
import LetterPuzzle from "@/components/stages/letter-puzzle"
import LetterComplete from "@/components/stages/letter-complete"
import ContinueWorksDialog from "@/components/auth/continue-works-dialog"
import StoryEdit from "@/components/stages/story-edit"
import BookReviewEdit from "@/components/stages/book-review-edit"
import LetterEdit from "@/components/stages/letter-edit"
import DramaWriting from "@/components/stages/drama-writing"
import PoetryWriting from "@/components/stages/poetry-writing"
import ResearchRoom from "@/components/stages/research-room"
import NavigationPage from "@/components/stages/navigation-page"
import { useDramaStore } from "@/lib/drama-store"
import { usePoetryStore } from "@/lib/poetry-store"
import Cagent, { type CagentMood } from "@/components/cagent/Cagent"
import RedFlashOverlay from "@/components/cagent/RedFlashOverlay"
import {
  buildContextSummary,
  buildValuesCheckContent,
  VALUES_CHECK_STAGES,
} from "@/lib/cagent-context"

export type Language = "en" | "zh"

export interface StoryState {
  character: {
    name: string
    age: number
    traits: string[]
    description: string
    imageUrl?: string
    species?: string
  } | null
  plot: {
    setting: string
    conflict: string
    goal: string
  } | null
  structure: {
    type: "freytag" | "threeAct" | "fichtean"
    outline: string[]
    imageUrl?: string
  } | null
  story: string
}

export interface BookReviewState {
  reviewType: "recommendation" | "critical" | "literary" | null
  bookTitle: string | null
  structure: {
    type: "recommendation" | "critical" | "literary"
    outline: string[]
  } | null
  review: string
  bookCoverUrl?: string
  bookSummary?: string
}

export interface LetterState {
  recipient: string | null
  occasion: string | null
  guidance: string | null
  readerImageUrl: string | null
  sections: string[]
  letter: string
}

type TreeGrowthDimension = "vocab" | "detail" | "logic"

interface WritingMetricsSnapshot {
  vocabRichness: number
  descriptiveAccuracy: number
  logicalCoherence: number
}

interface WritingAssessment {
  score: number
  level: number
  mapImageUrl?: string
  mapImageStatus: "idle" | "loading" | "ready" | "error"
}

interface PersistedMapState {
  mapImageUrl?: string
  mapFlags: { id: string; x: number; y: number; title: string }[]
  currentPin: { x: number; y: number } | null
  journeySelection: { type: JourneyType; difficulty: number } | null
  journeyActive: boolean
  levelBadgeUnlocked: boolean
}

const getMapStateKey = (username: string) => `cwriteMapState:${username}`
const getPlanTestResultKey = (username: string) => `cwritePlanTestResult:${username}`
const VALUES_DIMENSION_COUNT = 12

const normalizeTreeStage = (stage: number) => {
  if (stage >= 4) return 4
  if (stage >= 3) return 3
  return 2
}

const createDefaultValuesTrees = () =>
  Array.from({ length: VALUES_DIMENSION_COUNT }, (_, i) => ({ id: i + 1, stage: 2 }))

const normalizeValuesTrees = (rawTrees: { id: number; stage: number }[] | null | undefined) => {
  if (!rawTrees || rawTrees.length === 0) return createDefaultValuesTrees()
  const byId = new Map<number, { id: number; stage: number }>()
  rawTrees.forEach((tree, idx) => {
    const id = Number(tree?.id) || idx + 1
    byId.set(id, { id, stage: normalizeTreeStage(Number(tree?.stage) || 2) })
  })
  return Array.from({ length: VALUES_DIMENSION_COUNT }, (_, i) => {
    const id = i + 1
    return byId.get(id) || { id, stage: 2 }
  })
}

export default function Home() {
  const [user, setUser] = useState<{ username: string; role: 'teacher' | 'student'; noAi?: boolean } | null>(null)
  const [stage, setStage] = useState<"login" | "home" | "planTest" | "journeyTicket" | "journeyMap" | "writeTypeSelection" | "bookReviewWelcome" | "bookReviewTypeSelection" | "bookSelection" | "bookReviewLoading" | "bookReviewWriting" | "bookReviewComplete" | "bookReviewWritingNoAi" | "bookReviewCompleteNoAi" | "letterAdventure" | "letterGame" | "letterPuzzle" | "letterComplete" | "welcome" | "character" | "plot" | "structure" | "writing" | "review" | "dashboard" | "about" | "gallery" | "userProfile" | "userSettings" | "storyEdit" | "bookReviewEdit" | "letterEdit" | "dramaWriting" | "dramaBook" | "poetryWriting" | "poetryForm" | "poetryTopic" | "poetryEditor" | "poetryReview" | "research" | "navigation" | "otherFarm">("login")
  const [language, setLanguage] = useState<Language>("en")
  const [writingAssessment, setWritingAssessment] = useState<WritingAssessment | null>(null)
  const [journeySelection, setJourneySelection] = useState<{ type: JourneyType; difficulty: number } | null>(null)
  const [journeyActive, setJourneyActive] = useState(false)
  const [storyState, setStoryState] = useState<StoryState>({
    character: null,
    plot: null,
    structure: null,
    story: "",
  })
  const [bookReviewState, setBookReviewState] = useState<BookReviewState>({
    reviewType: null,
    bookTitle: null,
    structure: null,
    review: "",
    bookCoverUrl: undefined,
    bookSummary: undefined,
  })

  const [letterState, setLetterState] = useState<LetterState>({
    recipient: null,
    occasion: null,
    guidance: null,
    readerImageUrl: null,
    sections: [],
    letter: "",
  })

  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null)
  const [galleryFromEdit, setGalleryFromEdit] = useState<{ type: 'story' | 'review' | 'letter' } | null>(null)
  const [selectedOtherFarmUser, setSelectedOtherFarmUser] = useState<string | null>(null)
  const [planTestResult, setPlanTestResult] = useState<{ score: number; level: number } | null>(null)
  const [cagentMood, setCagentMood] = useState<CagentMood>("normal")
  const [valuesMessage, setValuesMessage] = useState<string | null>(null)
  const [valuesSuggestion, setValuesSuggestion] = useState<string | null>(null)
  const [redFlashActive, setRedFlashActive] = useState(false)
  const valuesCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentPin, setCurrentPin] = useState<{ x: number; y: number } | null>(null)
  const [mapFlags, setMapFlags] = useState<{ id: string; x: number; y: number; title: string }[]>([])
  const [mapImageUrl, setMapImageUrl] = useState<string | undefined>(undefined)
  const [levelBadgeUnlocked, setLevelBadgeUnlocked] = useState(false)
  const mapStateHydratedRef = useRef(false)
  // 12 价值观维度小树：每棵 stage 2->3->4（最多成长两次）
  const [trees, setTrees] = useState<{ id: number; stage: number }[] | null>(null)
  // 上一次写作三指标，用于判断哪一项提升最大
  const [lastMetrics, setLastMetrics] = useState<WritingMetricsSnapshot | null>(null)
  // 最近一次长高的树 + 对应维度，供 Profile 页面做施法特效
  const [lastGrownTree, setLastGrownTree] = useState<{ treeId: number; dimension: TreeGrowthDimension } | null>(null)

  // Hydration safety: only use store-derived progress after mount
  const [isReady, setIsReady] = useState(false)
  const hasDramaBook = useDramaStore((s) => !!s.dramaBook)
  const poetryForm = usePoetryStore((s) => !!s.form)
  const poetryTopic = usePoetryStore((s) => !!s.topic)
  const poetryHasLines = usePoetryStore((s) => s.lines.length > 0)
  const poetryPhase = usePoetryStore((s) => s.phase)
  const dramaProgress = useMemo(
    () => (isReady ? { hasDramaBook } : undefined),
    [isReady, hasDramaBook]
  )
  const poetryProgress = useMemo(
    () =>
      isReady
        ? {
            hasForm: poetryForm,
            hasTopic: poetryTopic,
            hasLines: poetryHasLines,
            phase: poetryPhase,
          }
        : undefined,
    [isReady, poetryForm, poetryTopic, poetryHasLines, poetryPhase]
  )
  const dramaBook = useDramaStore((s) => s.dramaBook)
  const dramaTitle = useDramaStore((s) => s.title)
  const dramaScenesCount = useDramaStore((s) => s.scenes.length)
  const poetryLines = usePoetryStore((s) => s.lines)
  const poetryLinesText = useMemo(() => poetryLines.map((l) => l.text).join("\n"), [poetryLines])

  const poetryTopicValue = usePoetryStore((s) => s.topic)
  const cagentContextSummary = useMemo(
    () =>
      buildContextSummary(stage, {
        storyState,
        bookReviewState,
        letterState,
        dramaTitle,
        dramaScenesCount,
        poetryTopic: poetryTopicValue,
        poetryLinesCount: poetryLines.length,
      }),
    [
      stage,
      storyState,
      bookReviewState,
      letterState,
      dramaTitle,
      dramaScenesCount,
      poetryTopicValue,
      poetryLines.length,
    ]
  )

  const runValuesCheck = useCallback(
    async (content: string, currentStage: string) => {
      if (!content.trim() || !user?.username) return
      try {
        const res = await fetch("/api/dify-cagent-values", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: currentStage,
            content,
            user_id: user.username,
          }),
        })
        const data = await res.json()
        if (data.compliant === false) {
          setCagentMood("angry")
          setValuesMessage(data.message || "This content does not align with our values.")
          setValuesSuggestion(data.suggestion || null)
          setRedFlashActive(true)
        } else {
          setCagentMood("like")
          setValuesMessage(null)
          setValuesSuggestion(null)
        }
      } catch {
        setCagentMood("normal")
      }
    },
    [user?.username]
  )

  const lastValuesWordCountRef = useRef(0)

  useEffect(() => {
    if (!user || !VALUES_CHECK_STAGES.includes(stage as any)) {
      setCagentMood("normal")
      setValuesMessage(null)
      setValuesSuggestion(null)
      lastValuesWordCountRef.current = 0
      return
    }
    const content = buildValuesCheckContent(stage, {
      storyState,
      bookReviewState,
      letterState,
      dramaScript: dramaBook?.script,
      poetryText: poetryLinesText,
    })
    if (!content.trim()) {
      setCagentMood("normal")
      setValuesMessage(null)
      setValuesSuggestion(null)
      lastValuesWordCountRef.current = 0
      return
    }
    const words = content.trim().split(/\s+/).filter(Boolean)
    const currentWordCount = words.length
    if (currentWordCount - lastValuesWordCountRef.current < 2) {
      return
    }
    lastValuesWordCountRef.current = currentWordCount
    if (valuesCheckTimeoutRef.current) clearTimeout(valuesCheckTimeoutRef.current)
    valuesCheckTimeoutRef.current = setTimeout(() => {
      runValuesCheck(content, stage)
      valuesCheckTimeoutRef.current = null
    }, 800)
    return () => {
      if (valuesCheckTimeoutRef.current) clearTimeout(valuesCheckTimeoutRef.current)
    }
  }, [
    user,
    stage,
    storyState,
    bookReviewState,
    letterState,
    dramaBook?.script,
    poetryLinesText,
    runValuesCheck,
  ])

  useEffect(() => {
    setIsReady(true)
    
    // 从localStorage读取语言设置和登录用户，默认英语
    if (typeof window !== 'undefined') {
      // 語言
      const savedLang = localStorage.getItem('siteLanguage') as Language | null
      if (savedLang === 'yue') {
        setLanguage('zh')
        localStorage.setItem('siteLanguage', 'zh')
      } else if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
        setLanguage(savedLang)
      } else {
        setLanguage('en')
        localStorage.setItem('siteLanguage', 'en')
      }

      // 嘗試恢復已登入用戶，讓刷新後 Header 仍能顯示頭像
      try {
        const savedUser = localStorage.getItem('cwriteUser')
        if (savedUser && !user) {
          const parsed = JSON.parse(savedUser) as { username: string; role: 'teacher' | 'student'; noAi?: boolean }
          if (parsed && parsed.username && parsed.role) {
            setUser(parsed)
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    
    // 监听Header的Write!按钮点击事件
    const handleNavigateToWriteTypeSelection = () => {
      if (user) {
        setJourneyActive(false)
        setJourneySelection(null)
        setStage("writeTypeSelection")
      }
    }

    const handleNavigateToJourneyMap = () => {
      if (user) {
        setJourneyActive(true)
        setJourneySelection({ type: "story", difficulty: 1 })
        setLevelBadgeUnlocked(false)
        if (!writingAssessment) {
          setWritingAssessment({
            score: 0,
            level: 1,
            mapImageStatus: "idle",
          })
        }
        setStage("journeyMap")
      }
    }
    
    const handleNavigateToHome = () => {
      setStage("home")
      setJourneyActive(false)
      setJourneySelection(null)
      setLevelBadgeUnlocked(false)
    }
    
    const handleNavigateToAbout = () => {
      setStage("about")
    }

    const handleNavigateToGallery = () => {
      setStage("gallery")
    }

    const handleNavigateToResearch = () => {
      if (user) {
        setStage("research")
      }
    }

    const handleNavigateToUserProfile = () => {
      if (user) setStage("userProfile")
    }

    const handleNavigateToUserSettings = () => {
      if (user) setStage("userSettings")
    }
    
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      const newLang = event.detail
      console.log('Main page received language change event:', newLang)
      // 兼容旧数据：将 "yue" 转换为 "zh"
      if (newLang === 'yue') {
        setLanguage('zh')
        localStorage.setItem('siteLanguage', 'zh')
      } else {
        setLanguage(newLang)
      }
    }
    
    window.addEventListener('navigateToWriteTypeSelection', handleNavigateToWriteTypeSelection as EventListener)
    window.addEventListener('navigateToJourneyMap', handleNavigateToJourneyMap as EventListener)
    window.addEventListener('navigateToHome', handleNavigateToHome as EventListener)
    window.addEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
    window.addEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
    window.addEventListener('navigateToResearch', handleNavigateToResearch as EventListener)
    window.addEventListener('navigateToUserProfile', handleNavigateToUserProfile as EventListener)
    window.addEventListener('navigateToUserSettings', handleNavigateToUserSettings as EventListener)
    window.addEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('navigateToWriteTypeSelection', handleNavigateToWriteTypeSelection as EventListener)
      window.removeEventListener('navigateToJourneyMap', handleNavigateToJourneyMap as EventListener)
      window.removeEventListener('navigateToHome', handleNavigateToHome as EventListener)
      window.removeEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
      window.removeEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
      window.removeEventListener('navigateToResearch', handleNavigateToResearch as EventListener)
      window.removeEventListener('navigateToUserProfile', handleNavigateToUserProfile as EventListener)
      window.removeEventListener('navigateToUserSettings', handleNavigateToUserSettings as EventListener)
      window.removeEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    }
  }, [user])

  useEffect(() => {
    mapStateHydratedRef.current = false
    if (!user?.username || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(getMapStateKey(user.username))
      if (!raw) {
        mapStateHydratedRef.current = true
        return
      }
      const parsed = JSON.parse(raw) as Partial<PersistedMapState>
      if (typeof parsed.mapImageUrl === "string" && parsed.mapImageUrl.trim()) {
        setMapImageUrl(parsed.mapImageUrl)
      }
      if (Array.isArray(parsed.mapFlags)) {
        const safeFlags = parsed.mapFlags
          .filter((f) => f && typeof f.id === "string")
          .map((f) => ({
            id: f.id,
            x: typeof f.x === "number" ? f.x : 50,
            y: typeof f.y === "number" ? f.y : 50,
            title: typeof f.title === "string" ? f.title : "Journey",
          }))
        setMapFlags(safeFlags)
      }
      if (parsed.currentPin && typeof parsed.currentPin.x === "number" && typeof parsed.currentPin.y === "number") {
        setCurrentPin(parsed.currentPin)
      }
      if (
        parsed.journeySelection &&
        typeof parsed.journeySelection.difficulty === "number" &&
        typeof parsed.journeySelection.type === "string"
      ) {
        setJourneySelection(parsed.journeySelection)
      }
      if (typeof parsed.journeyActive === "boolean") {
        setJourneyActive(parsed.journeyActive)
      }
      if (typeof parsed.levelBadgeUnlocked === "boolean") {
        setLevelBadgeUnlocked(parsed.levelBadgeUnlocked)
      }
    } catch {
      // ignore parse/storage errors
    } finally {
      mapStateHydratedRef.current = true
    }
  }, [user?.username])

  useEffect(() => {
    if (!user?.username || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(getPlanTestResultKey(user.username))
      if (!raw) {
        setPlanTestResult(null)
        return
      }
      const parsed = JSON.parse(raw) as { score?: number; level?: number }
      if (typeof parsed.score === "number" && typeof parsed.level === "number") {
        setPlanTestResult({ score: parsed.score, level: parsed.level })
      } else {
        setPlanTestResult(null)
      }
    } catch {
      setPlanTestResult(null)
    }
  }, [user?.username])

  useEffect(() => {
    if (stage !== "planTest") return
    if (!planTestResult) return
    setWritingAssessment({
      score: planTestResult.score,
      level: planTestResult.level,
      mapImageStatus: "idle",
    })
    setStage("journeyTicket")
  }, [stage, planTestResult])

  const queueJourneyMapUpdate = useCallback(
    (params: {
      title: string
      topic: string
      mapPrompt?: string
      summaryKey?: string
      summaryValue?: Record<string, unknown>
      source: string
    }) => {
      if (!journeyActive || !user || !currentPin) return
      const pinSnapshot = { x: currentPin.x, y: currentPin.y }
      const previousMapImageUrl = mapImageUrl || "/firstmap.png"

      void (async () => {
        try {
          const payload: any = {
            userId: user.username,
            title: params.title,
            topic: params.topic,
            mapX: pinSnapshot.x,
            mapY: pinSnapshot.y,
            previousMapImageUrl,
          }
          if (params.mapPrompt) payload.mapPrompt = params.mapPrompt
          if (params.summaryKey && params.summaryValue) payload[params.summaryKey] = params.summaryValue

          const mapRes = await fetch("/api/map-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          const mapJson = await mapRes.json()

          if (mapRes.ok && !mapJson?.error && mapJson?.imageUrl) {
            setMapImageUrl(mapJson.imageUrl as string)
            setMapFlags((prev) => [
              ...prev,
              {
                id: mapJson.userId && mapJson.title ? `${mapJson.userId}-${mapJson.title}-${Date.now()}` : `${Date.now()}`,
                x: mapJson.mapX ?? pinSnapshot.x,
                y: mapJson.mapY ?? pinSnapshot.y,
                title: mapJson.title || params.title,
              },
            ])
            setCurrentPin(null)
            return
          }
          console.error(`[map-update] ${params.source} failed:`, {
            status: mapRes.status,
            body: mapJson,
          })
        } catch (error) {
          console.error(`[map-update] ${params.source} error:`, error)
        }
      })()
    },
    [journeyActive, user, currentPin, mapImageUrl],
  )

  useEffect(() => {
    if (!user?.username || typeof window === "undefined") return
    if (!mapStateHydratedRef.current) return
    const payload: PersistedMapState = {
      mapImageUrl,
      mapFlags,
      currentPin,
      journeySelection,
      journeyActive,
      levelBadgeUnlocked,
    }
    try {
      localStorage.setItem(getMapStateKey(user.username), JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
  }, [user?.username, mapImageUrl, mapFlags, currentPin, journeySelection, journeyActive, levelBadgeUnlocked])

  // Notify header of current user + profile + unread reviews count
  const [headerUserInfo, setHeaderUserInfo] = useState<{ username: string; avatarUrl?: string | null; avatarEmoji?: string | null; unreadCount: number } | null>(null)
  useEffect(() => {
    if (!user) {
      setHeaderUserInfo(null)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("headerUserInfo", { detail: null }))
      }
      return
    }
    // 立即通知 header 显示用户（头像先用 username 首字母），避免等接口才出现
    const initialInfo = { username: user.username, avatarUrl: null as string | null, avatarEmoji: null as string | null, unreadCount: 0 }
    setHeaderUserInfo(initialInfo)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("headerUserInfo", { detail: initialInfo }))
    }
    let cancelled = false
    Promise.all([
      fetch(`/api/user-profile?user_id=${user.username}`).then((r) => r.json()),
      fetch(`/api/reviews?user_id=${user.username}`).then((r) => r.json()),
    ]).then(([profileRes, reviewsRes]) => {
      if (cancelled) return
      const avatarUrl = profileRes.error ? null : (profileRes.avatarUrl ?? null)
      const avatarEmoji = profileRes.error ? null : (profileRes.avatarEmoji ?? null)
      const unreadCount = reviewsRes.error ? 0 : (reviewsRes.unreadCount ?? 0)
      const info = { username: user.username, avatarUrl, avatarEmoji, unreadCount }
      setHeaderUserInfo(info)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("headerUserInfo", { detail: info }))
      }
      // 初始化 12 维度小树（若后端已有则做标准化，否则创建 12 棵 stage=2）
      if (!profileRes.error) {
        const rawTrees = Array.isArray(profileRes.trees) ? profileRes.trees as { id: number; stage: number }[] : null
        const initialTrees = normalizeValuesTrees(rawTrees)
        setTrees(initialTrees)
        const lm = profileRes.lastMetrics as WritingMetricsSnapshot | undefined
        if (lm && typeof lm.vocabRichness === "number") {
          setLastMetrics(lm)
        }
        // 若后端还没有 12 维度数据（或旧格式），写回一次标准化森林
        const shouldBackfillTrees =
          !rawTrees ||
          rawTrees.length !== VALUES_DIMENSION_COUNT ||
          rawTrees.some((tree, idx) => Number(tree?.id) !== idx + 1 || normalizeTreeStage(Number(tree?.stage) || 2) !== Number(tree?.stage))
        if (shouldBackfillTrees) {
          fetch("/api/user-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.username,
              trees: initialTrees,
            }),
          }).catch(() => {})
        }
      }
    }).catch(() => {
      if (!cancelled && user) {
        const info = { username: user.username, avatarUrl: null, avatarEmoji: null, unreadCount: 0 }
        setHeaderUserInfo(info)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("headerUserInfo", { detail: info }))
        }
      }
    })
    return () => { cancelled = true }
  }, [user?.username])

  // Refetch and update header when profile/reviews change (e.g. after marking reviews read)
  useEffect(() => {
    if (!user) return
    const onRefresh = () => {
      Promise.all([
        fetch(`/api/user-profile?user_id=${user.username}`).then((r) => r.json()),
        fetch(`/api/reviews?user_id=${user.username}`).then((r) => r.json()),
      ]).then(([profileRes, reviewsRes]) => {
        const avatarUrl = profileRes.error ? null : (profileRes.avatarUrl ?? null)
        const avatarEmoji = profileRes.error ? null : (profileRes.avatarEmoji ?? null)
        const unreadCount = reviewsRes.error ? 0 : (reviewsRes.unreadCount ?? 0)
        const info = { username: user.username, avatarUrl, avatarEmoji, unreadCount }
        setHeaderUserInfo(info)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("headerUserInfo", { detail: info }))
        }
        if (!profileRes.error) {
          const rawTrees = Array.isArray(profileRes.trees) ? profileRes.trees as { id: number; stage: number }[] : null
          setTrees(normalizeValuesTrees(rawTrees))
          const lm = profileRes.lastMetrics as WritingMetricsSnapshot | undefined
          if (lm && typeof lm.vocabRichness === "number") {
            setLastMetrics(lm)
          }
        }
      }).catch(() => {})
    }
    window.addEventListener("headerRefreshUserInfo", onRefresh)
    return () => window.removeEventListener("headerRefreshUserInfo", onRefresh)
  }, [user?.username])

  const currentLevel = writingAssessment?.level ?? 1
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window as unknown as { __cwrite_level?: number }).__cwrite_level = currentLevel
      }
    } catch {
      // ignore
    }
  }, [currentLevel])

  // 根据 12 价值观命中维度更新森林：命中的树 stage +1（上限 4）
  const applyTreeGrowthFromMetrics = useCallback(
    async (matchedDimensions: number[]) => {
      if (!user) return
      const currentTrees = normalizeValuesTrees(trees)
      const growthCounter = new Map<number, number>()
      matchedDimensions
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= VALUES_DIMENSION_COUNT)
        .map((n) => Math.round(n))
        .forEach((id) => {
          const current = growthCounter.get(id) || 0
          growthCounter.set(id, Math.min(2, current + 1))
        })

      const matchedIds = Array.from(growthCounter.keys())
      let grownTreeId = matchedIds[0] || 1
      const nextTrees = currentTrees.map((tree) => {
        const growthLevel = growthCounter.get(tree.id) || 0
        if (growthLevel <= 0) return tree
        grownTreeId = tree.id
        return { ...tree, stage: Math.min(4, tree.stage + growthLevel) }
      })

      setTrees(nextTrees)
      setLastGrownTree({ treeId: grownTreeId, dimension: "vocab" })

      // 同步到后端 profile
      try {
        await fetch("/api/user-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.username,
            trees: nextTrees,
          }),
        })
      } catch {
        // 后端失败不阻塞前端体验
      }
    },
    [trees, user]
  )

  if (!isReady) {
    return null
  }

  const showLevelBadge =
    !!user &&
    !!writingAssessment &&
    !!journeySelection &&
    levelBadgeUnlocked &&
    writingAssessment.level >= 1 &&
    writingAssessment.level <= 5 &&
    !["login", "home", "planTest", "journeyTicket", "journeyMap"].includes(stage)

  return (
    <main className="min-h-screen" data-stage={stage}>
      <RedFlashOverlay active={redFlashActive} duration={2000} />
      {user &&
        stage !== "login" &&
        stage !== "userProfile" &&
        stage !== "otherFarm" &&
        stage !== "navigation" &&
        !["writing", "bookReviewWriting", "bookReviewWritingNoAi", "letterGame"].includes(stage) && (
        <Cagent
          stage={stage}
          contextSummary={cagentContextSummary}
          userId={user.username}
          mood={cagentMood}
          valuesMessage={valuesMessage}
          valuesSuggestion={valuesSuggestion}
        />
      )}
      {showLevelBadge && writingAssessment && (
        <div className="fixed top-6 right-6 z-[100]">
          <LevelBadge level={Math.min(5, Math.max(1, writingAssessment.level))} className="text-lg" />
        </div>
      )}
      {stage === "login" && (
        <LoginPage
          onLogin={(userData, showDialog = false) => {
            setUser(userData)
            // 持久化當前用戶，讓刷新後可以自動恢復並驅動 Header 顯示頭像
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("cwriteUser", JSON.stringify(userData))
              } catch {
                // ignore
              }
            }
            if (userData.role === "teacher") {
              setStage("dashboard")
            } else {
              if (showDialog) {
                setShowContinueDialog(true)
              } else {
                setStage("home")
              }
            }
          }}
        />
      )}

      {/* 继续作品对话框 */}
      {user && showContinueDialog && (
        <ContinueWorksDialog
          open={showContinueDialog}
          userId={user.username}
          onStartNew={() => {
            setShowContinueDialog(false)
            setStage("home")
            setEditingWorkId(null)
          }}
          onContinue={(work) => {
            setShowContinueDialog(false)
            setEditingWorkId(work.id)
            
            // 根据作品类型加载内容并跳转到相应阶段
            if (work.type === 'story') {
              const storyData = work.data
              setStoryState({
                character: storyData.character as any,
                plot: storyData.plot as any,
                structure: storyData.structure as any,
                story: storyData.content || "",
              })
              setStage("review") // 跳转到review页面，用户可以继续编辑
            } else if (work.type === 'review') {
              const reviewData = work.data
              setBookReviewState({
                reviewType: reviewData.reviewType as any,
                bookTitle: reviewData.bookTitle || null,
                structure: reviewData.structure as any,
                review: reviewData.content || "",
                bookCoverUrl: reviewData.bookCoverUrl,
                bookSummary: reviewData.bookSummary,
              })
              setStage("bookReviewComplete")
            } else if (work.type === 'letter') {
              const letterData = work.data
              setLetterState({
                recipient: letterData.recipient || null,
                occasion: letterData.occasion || null,
                guidance: letterData.guidance || null,
                readerImageUrl: letterData.readerImageUrl || null,
                sections: (letterData.sections as string[]) || [],
                letter: letterData.content || "",
              })
              setStage("letterComplete")
            }
          }}
          onClose={() => {
            setShowContinueDialog(false)
            setStage("home")
          }}
        />
      )}
      {stage === "home" && user && (
        <HomePage
          language={language}
          user={user}
          onStartPlan={() => {
            setJourneyActive(true)
            setLevelBadgeUnlocked(false)
            if (!journeySelection) {
              setJourneySelection({ type: "story", difficulty: 1 })
            }
            if (!writingAssessment && planTestResult) {
              setWritingAssessment({
                score: planTestResult.score,
                level: planTestResult.level,
                mapImageStatus: "idle",
              })
            } else if (!writingAssessment) {
              setWritingAssessment({
                score: 0,
                level: 1,
                mapImageStatus: "idle",
              })
            }
            setStage("journeyMap")
          }}
          onStartWrite={() => {
            setJourneyActive(false)
            setJourneySelection(null)
            setLevelBadgeUnlocked(false)
            setStage("writeTypeSelection")
          }}
          onViewAbout={() => setStage("about")}
        />
      )}
      {stage === "planTest" && user && (
        <PlanTest
          language={language}
          onBack={() => setStage("home")}
          onComplete={async (result) => {
            setWritingAssessment({
              score: result.score,
              level: result.level,
              mapImageStatus: "idle",
            })
            if (typeof window !== "undefined" && user?.username) {
              localStorage.setItem(
                getPlanTestResultKey(user.username),
                JSON.stringify({ score: result.score, level: result.level }),
              )
            }
            setPlanTestResult({ score: result.score, level: result.level })
            setStage("journeyTicket")
          }}
        />
      )}
      {stage === "journeyTicket" && user && writingAssessment && (
        <JourneyTicket
          language={language}
          userName={user.username}
          level={writingAssessment.level}
          score={writingAssessment.score}
          onBack={() => {
            setJourneyActive(false)
            setJourneySelection(null)
            setLevelBadgeUnlocked(false)
            setStage("home")
          }}
          onStart={({ type, difficulty }) => {
            setJourneySelection({ type, difficulty })
            setJourneyActive(true)
            setLevelBadgeUnlocked(true)
            if (type === "story") {
              setStoryState({ character: null, plot: null, structure: null, story: "" })
              setStage("welcome")
            } else if (type === "bookReview") {
              setBookReviewState({
                reviewType: null,
                bookTitle: null,
                structure: null,
                review: "",
                bookCoverUrl: undefined,
                bookSummary: undefined,
              })
              setStage("bookReviewWelcome")
            } else if (type === "letter") {
              setLetterState({
                recipient: null,
                occasion: null,
                guidance: null,
                readerImageUrl: null,
                sections: [],
                letter: "",
              })
              setStage("letterAdventure")
            } else if (type === "drama") {
              setStage("dramaWriting")
            } else if (type === "poetry") {
              setStage("poetryWriting")
            }
          }}
        />
      )}
      {stage === "journeyMap" && user && writingAssessment && journeySelection && (
        <JourneyMap
          language={language}
          type={journeySelection.type}
          mapImageUrl={mapImageUrl}
          mapFlags={mapFlags}
          pin={currentPin}
          onPinChange={setCurrentPin}
          storyState={storyState}
          bookReviewState={bookReviewState}
          letterState={letterState}
          dramaProgress={journeySelection.type === "drama" ? dramaProgress : undefined}
          poetryProgress={journeySelection.type === "poetry" ? poetryProgress : undefined}
          noAi={user.noAi}
          onBack={() => setStage("journeyTicket")}
          onNavigate={(targetStage) => {
            setStage(targetStage as any)
          }}
          onGoProfile={() => setStage("userProfile")}
        />
      )}
      {stage === "writeTypeSelection" && user && (
        <WriteTypeSelection
          language={language}
          onSelectStory={() => setStage("welcome")}
          onSelectBookReview={() => setStage("bookReviewWelcome")}
          onSelectLetter={() => setStage("letterAdventure")}
          onSelectDrama={() => setStage("dramaWriting")}
          onSelectPoetry={() => setStage("poetryWriting")}
          onBack={() => setStage("home")}
        />
      )}
      {stage === "bookReviewWelcome" && user && (
        <BookReviewWelcome
          language={language}
          onStartBookReview={() => {
            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            // 有 AI 的情況：先選書，再讓 AI 幫選最合適的書評類型
            // noAi 的情況維持原來流程：先選類型再選書
            if (user.noAi) {
              setStage("bookReviewTypeSelection")
            } else {
              setStage("bookSelection")
            }
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "bookReviewTypeSelection" && user && (
        <BookReviewTypeSelection
          language={language}
          bookTitle={bookReviewState.bookTitle || undefined}
          onSelectType={(type) => {
            setBookReviewState(prev => ({ ...prev, reviewType: type }))
            // 如果已經選好書，這一頁是「AI 推薦類型」→ 選完類型直接進入 Outline / Writing
            if (bookReviewState.bookTitle) {
              if (user.noAi) {
                // noAi：直接用固定結構進入寫作
                const getStructureForReviewType = (reviewType: "recommendation" | "critical" | "literary") => {
                  const baseStructures = {
                    recommendation: {
                      type: "recommendation" as const,
                      outline: [
                        "Introduction - Hook your readers",
                        "What I Loved - Share your favorite parts",
                        "Why You Should Read It - Make your case",
                        "Who Would Enjoy This - Help readers decide",
                        "Conclusion - Final recommendation",
                      ],
                    },
                    critical: {
                      type: "critical" as const,
                      outline: [
                        "Introduction - Set the stage",
                        "Strengths - What worked well",
                        "Weaknesses - What didn't work",
                        "Examples - Support your points",
                        "Conclusion - Overall assessment",
                      ],
                    },
                    literary: {
                      type: "literary" as const,
                      outline: [
                        "Introduction - Present the book",
                        "Themes - Explore deeper meanings",
                        "Literary Devices - Analyze techniques",
                        "Character Analysis - Understand development",
                        "Conclusion - Reflect on significance",
                      ],
                    },
                  }
                  return baseStructures[reviewType]
                }
                const structure = getStructureForReviewType(type)
                setBookReviewState(prev => ({ ...prev, structure }))
                setStage("bookReviewWritingNoAi")
              } else {
                setStage("bookReviewLoading")
              }
              return
            }

            // 尚未選書的情況（主要給 noAi 舊流程或從地圖直接進入）
            if (user.noAi) {
              setStage("bookSelectionNoAi")
            } else {
              setStage("bookSelection")
            }
          }}
          onBack={() => {
            if (bookReviewState.bookTitle) {
              // 在 AI 推薦類型頁面按 back → 回到選書頁重新選書
              setStage("bookSelection")
            } else {
              setStage(journeyActive ? "journeyMap" : "bookReviewWelcome")
            }
          }}
        />
      )}
      {stage === "bookSelection" && user && (
        <BookSelection
          language={language}
          onBookSelected={(title) => {
            setBookReviewState(prev => ({ ...prev, bookTitle: title }))
            const selectedTitle = title || "My Book Review"
            queueJourneyMapUpdate({
              title: selectedTitle,
              topic: selectedTitle,
              source: "book-selection",
            })
            // 選完書後，讓 AI 推薦適合的書評類型
            setStage("bookReviewTypeSelection")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewWelcome")}
        />
      )}
      {stage === "bookSelectionNoAi" && user && bookReviewState.reviewType && (
        <BookSelectionNoAi
          reviewType={bookReviewState.reviewType}
          onBookSelected={(title) => {
            console.log("BookSelectionNoAi - Book selected:", title)
            // 生成structure（非AI版本不需要打乱，使用原始顺序）
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
              return baseStructures[reviewType]
            }
            const structure = getStructureForReviewType(bookReviewState.reviewType)
            setBookReviewState(prev => ({ ...prev, bookTitle: title, structure }))
            const selectedTitle = title || "My Book Review"
            queueJourneyMapUpdate({
              title: selectedTitle,
              topic: selectedTitle,
              source: "book-selection-no-ai",
            })
            if (user.noAi) {
              setStage("bookReviewWritingNoAi")
            } else {
              setStage("bookReviewLoading")
            }
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewTypeSelection")}
        />
      )}
      {stage === "bookReviewLoading" && user && bookReviewState.bookTitle && bookReviewState.reviewType && (
        <BookReviewLoading
          reviewType={bookReviewState.reviewType}
          bookTitle={bookReviewState.bookTitle}
          onComplete={(structure, coverUrl, summary) => {
            console.log("=== Page.tsx Receiving Structure ===")
            console.log("Structure outline:", structure?.outline)
            console.log("Structure originalOutline:", structure?.originalOutline)
            console.log("====================================")
            setBookReviewState(prev => ({
              ...prev,
              structure,
              bookCoverUrl: coverUrl,
              bookSummary: summary,
            }))
            setStage("bookReviewWriting")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookSelection")}
        />
      )}
      {stage === "bookReviewWriting" && user && bookReviewState.structure && bookReviewState.bookTitle && (
        <BookReviewWriting
            reviewType={bookReviewState.reviewType!}
            bookTitle={bookReviewState.bookTitle}
            structure={bookReviewState.structure}
            initialCoverUrl={bookReviewState.bookCoverUrl}
            initialBookSummary={bookReviewState.bookSummary}
            onReviewWrite={(review, bookCoverUrl) => {
              setBookReviewState(prev => ({ ...prev, review, bookCoverUrl: bookCoverUrl || prev.bookCoverUrl }))
              setStage("bookReviewComplete")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewLoading")}
            userId={user.username}
            onDraftChange={(draft) => {
              setBookReviewState(prev => ({ ...prev, review: draft }))
            }}
        />
      )}
      {stage === "bookReviewWritingNoAi" && user && bookReviewState.bookTitle && bookReviewState.reviewType && (
        <BookReviewWritingNoAi
            reviewType={bookReviewState.reviewType}
            bookTitle={bookReviewState.bookTitle}
            structure={bookReviewState.structure || {
              type: bookReviewState.reviewType,
              outline: []
            }}
            initialCoverUrl={bookReviewState.bookCoverUrl}
            onReviewWrite={(review, bookCoverUrl) => {
              setBookReviewState(prev => ({ ...prev, review, bookCoverUrl: bookCoverUrl || prev.bookCoverUrl }))
              setStage("bookReviewCompleteNoAi")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "bookSelectionNoAi")}
            userId={user.username}
            onDraftChange={(draft) => {
              setBookReviewState(prev => ({ ...prev, review: draft }))
            }}
        />
      )}
      {stage === "bookReviewComplete" && user && bookReviewState.review && bookReviewState.bookTitle && (
        <BookReviewComplete
          reviewType={bookReviewState.reviewType!}
          bookTitle={bookReviewState.bookTitle}
          review={bookReviewState.review}
          bookCoverUrl={bookReviewState.bookCoverUrl}
          bookSummary={bookReviewState.bookSummary}
          structure={bookReviewState.structure}
          onReset={async () => {
            const backToStage = journeyActive ? "journeyMap" : "home"

            if (!journeyActive && user && currentPin && bookReviewState.review.trim().length > 0) {
              try {
                const title = bookReviewState.bookTitle || "My Book Review"
                const topic = bookReviewState.bookTitle || "book world"
                const previousMapImageUrl = mapImageUrl || "/firstmap.png"
                const endpoint = "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  reviewSummary: {
                    bookTitle: bookReviewState.bookTitle,
                    reviewType: bookReviewState.reviewType,
                  },
                  previousMapImageUrl,
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add visual elements related to this book review (title: ${
                    bookReviewState.bookTitle
                  }, type: ${bookReviewState.reviewType}). Update the surrounding area so the map reflects this reading journey.`,
                }

                const mapRes = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })

                const mapJson = await mapRes.json()

                if (mapRes.ok && mapJson.imageUrl) {
                  setMapImageUrl(mapJson.imageUrl as string)
                  setMapFlags((prev) => [
                    ...prev,
                    {
                      id: mapJson.userId && mapJson.title ? `${mapJson.userId}-${mapJson.title}-${Date.now()}` : `${Date.now()}`,
                      x: mapJson.mapX ?? currentPin.x,
                      y: mapJson.mapY ?? currentPin.y,
                      title: mapJson.title || title,
                    },
                  ])
                }
              } catch (error) {
                console.error("Error updating map after review completion:", error)
              }
            }

            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            setStage(backToStage)
          }}
          onBack={async () => {
            if (journeyActive) {
              setStage("journeyMap")
              return
            }
            // 如果正在编辑已保存的作品，加载之前的内容
            if (editingWorkId && user) {
              try {
                const response = await fetch(`/api/user-works?user_id=${user.username}&type=review`)
                const data = await response.json()
                if (data.success && data.reviews) {
                  const work = data.reviews.find((r: any) => r.id === editingWorkId)
                  if (work) {
                    setBookReviewState({
                      reviewType: work.reviewType as any,
                      bookTitle: work.bookTitle || null,
                      structure: work.structure as any,
                      review: work.content || "",
                      bookCoverUrl: work.bookCoverUrl,
                      bookSummary: work.bookSummary,
                    })
                  }
                }
              } catch (error) {
                console.error('Error loading work:', error)
              }
            }
            setStage("bookReviewWriting")
          }}
          onEdit={() => setStage("bookReviewEdit")}
          userId={user.username}
          workId={editingWorkId}
        />
      )}
      {stage === "bookReviewCompleteNoAi" && user && bookReviewState.review && bookReviewState.bookTitle && (
        <BookReviewComplete
          reviewType={bookReviewState.reviewType!}
          bookTitle={bookReviewState.bookTitle}
          review={bookReviewState.review}
          onReset={async () => {
            const backToStage = journeyActive ? "journeyMap" : "home"

            if (!journeyActive && user && currentPin && bookReviewState.review.trim().length > 0) {
              try {
                const title = bookReviewState.bookTitle || "My Book Review"
                const topic = bookReviewState.bookTitle || "book world"
                const previousMapImageUrl = mapImageUrl || "/firstmap.png"
                const endpoint = "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  reviewSummary: {
                    bookTitle: bookReviewState.bookTitle,
                    reviewType: bookReviewState.reviewType,
                  },
                  previousMapImageUrl,
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add visual elements related to this book review (title: ${
                    bookReviewState.bookTitle
                  }, type: ${bookReviewState.reviewType}). Update the surrounding area so the map reflects this reading journey.`,
                }

                const mapRes = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })

                const mapJson = await mapRes.json()

                if (mapRes.ok && mapJson.imageUrl) {
                  setMapImageUrl(mapJson.imageUrl as string)
                  setMapFlags((prev) => [
                    ...prev,
                    {
                      id: mapJson.userId && mapJson.title ? `${mapJson.userId}-${mapJson.title}-${Date.now()}` : `${Date.now()}`,
                      x: mapJson.mapX ?? currentPin.x,
                      y: mapJson.mapY ?? currentPin.y,
                      title: mapJson.title || title,
                    },
                  ])
                }
              } catch (error) {
                console.error("Error updating map after review completion (no AI):", error)
              }
            }

            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            setStage(backToStage)
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewWritingNoAi")}
          userId={user.username}
        />
      )}
      {stage === "welcome" && user && (
        <WelcomePage
          language={language}
          onLanguageChange={setLanguage}
          onStart={() => {
            setStoryState({ character: null, plot: null, structure: null, story: "" })
            if (user.noAi) {
              setStage("character")
            } else {
              setStage("character")
            }
          }}
          onBack={() => setStage("home")}
          userId={user.username}
        />
      )}
      {stage === "character" && user && (
        user.noAi ? (
          <CharacterCreationNoAi
            language={language}
            onCharacterCreate={(character) => {
              setStoryState(prev => ({ ...prev, character }))
              setStage(journeyActive ? "plot" : "journeyMap")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "welcome")}
          />
        ) : (
          <CharacterCreation
            language={language}
            onCharacterCreate={(character) => {
              setStoryState(prev => ({ ...prev, character }))
              setStage(journeyActive ? "plot" : "journeyMap")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "welcome")}
            userId={user.username}
            level={writingAssessment?.level || 1}
          />
        )
      )}
      {stage === "plot" && user && (journeyActive || storyState.character) && (
        user.noAi ? (
          <PlotBrainstormNoAi
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState(prev => ({ ...prev, plot }))
              setStage(journeyActive ? "structure" : "journeyMap")
              const setting = plot?.setting?.trim() || "fantasy adventure"
              const title = storyState.character?.name?.trim()
                ? `${storyState.character.name}'s Journey`
                : "My Journey"
              queueJourneyMapUpdate({
                title,
                topic: setting,
                mapPrompt: `Use the previous map image as a reference. At the student's starting position, add map elements based on this story setting: ${setting}.`,
                source: "plot-brainstorm-no-ai",
              })
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "character")}
            userId={user.username}
          />
        ) : (
          <PlotBrainstorm
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState((prev) => ({ ...prev, plot }))
              setStage(journeyActive ? "structure" : "journeyMap")

              // 先跳轉下一頁，地圖更新在後台異步進行，不阻塞前端流程
              const species = storyState.character?.species
              const characterName = storyState.character?.name
              const setting = plot?.setting
              const topic = setting && setting.trim().length > 0 ? setting : "fantasy adventure"
              const title =
                storyState.character?.name && storyState.character.name.trim().length > 0
                  ? `${storyState.character.name}'s Journey`
                  : "My Journey"
              const storySummaryForMap = [
                characterName ? `Character: ${characterName}` : null,
                species ? `Species: ${species}` : null,
                setting ? `Setting: ${setting}` : null,
              ]
                .filter(Boolean)
                .join(" | ")
              queueJourneyMapUpdate({
                title,
                topic,
                summaryKey: "storySummary",
                summaryValue: {
                  characterName: characterName ?? null,
                  species: species ?? null,
                  setting: setting ?? null,
                },
                mapPrompt: `Use the previous map image as a reference. Add design elements that match this plot summary and character ${characterName ? `"${characterName}"` : "of the story"} (species: ${species || "unknown"}): ${storySummaryForMap || "no details provided"}.`,
                source: "plot-brainstorm",
              })
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "character")}
            userId={user.username}
          />
        )
      )}
      {stage === "structure" && user && (journeyActive || (storyState.plot && storyState.character)) && (
        user.noAi ? (
            <StoryStructureNoAi
              language={language}
              character={storyState.character}
              plot={storyState.plot}
              onStructureSelect={(structure) => {
                setStoryState(prev => ({ ...prev, structure }))
                setStage("writing")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "plot")}
            />
          ) : (
            <StoryStructure
              language={language}
              character={storyState.character}
              plot={storyState.plot}
              onStructureSelect={(structure) => {
                setStoryState(prev => ({ ...prev, structure }))
                setStage("writing")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "plot")}
              userId={user.username}
            />
          )
        )}
      {stage === "writing" && user && storyState.character && storyState.plot && storyState.structure && (
        user.noAi ? (
            <GuidedWritingNoAi
              language={language}
              storyState={storyState}
              onStoryWrite={(story) => {
                setStoryState(prev => ({ ...prev, story }))
                setStage("review")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "structure")}
              userId={user.username}
              onDraftChange={(draft) => {
                setStoryState(prev => ({ ...prev, story: draft }))
              }}
            />
          ) : (
            <GuidedWriting
              language={language}
              storyState={storyState}
              onStoryWrite={(story) => {
                setStoryState(prev => ({ ...prev, story }))
                setStage("review")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "structure")}
              userId={user.username}
              onDraftChange={(draft) => {
                setStoryState(prev => ({ ...prev, story: draft }))
              }}
            />
          )
        )}
      {stage === "review" && user && storyState.story && (
        <StoryReview
          language={language}
          storyState={storyState}
          onReset={async () => {
            const backToStage = journeyActive ? "journeyMap" : "home"

            // Journey 模式下，地圖已在 Plot 步驟更新，這裡不再重複調 Fal，只是清理狀態並返回地圖
            if (!journeyActive && user && currentPin && storyState.story.trim().length > 0) {
              try {
                // 1. 调用 12 维度价值观评估，命中维度对应小树成长
                const valuesRes = await fetch("/api/writing-values-growth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: storyState.story,
                    type: "story",
                    user_id: user.username,
                  }),
                })
                const valuesJson = await valuesRes.json()
                const matchedDimensions = Array.isArray(valuesJson?.matchedDimensions)
                  ? valuesJson.matchedDimensions
                  : []
                await applyTreeGrowthFromMetrics(matchedDimensions)

                const title =
                  storyState.character?.name && storyState.character.name.trim().length > 0
                    ? `${storyState.character.name}'s Story`
                    : "My Story"

                const species = storyState.character?.species
                const setting = storyState.plot?.setting
                const structureType = storyState.structure?.type

                const topic = setting && setting.trim().length > 0 ? setting : "fantasy adventure"

                const storySummaryForMap = [
                  species ? `Species: ${species}` : null,
                  setting ? `Setting: ${setting}` : null,
                  structureType ? `Structure: ${structureType}` : null,
                ]
                  .filter(Boolean)
                  .join(" | ")

                const previousMapImageUrl = mapImageUrl || "/firstmap.png"
                const endpoint = "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  storySummary: {
                    species: species ?? null,
                    setting: setting ?? null,
                    structureType: structureType ?? null,
                  },
                  previousMapImageUrl,
                  // 提示給 Fal / nanobanana2edit：參考舊地圖，在起點附近根據 Story Summary 做局部放射狀更新
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add design elements that match this story summary: ${storySummaryForMap ||
                    "no details provided"}. Radially update and enrich the area around this point so the map reflects the new story.`,
                }

                const mapRes = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })

                const mapJson = await mapRes.json()

                if (mapRes.ok && mapJson.imageUrl) {
                  setMapImageUrl(mapJson.imageUrl as string)
                  setMapFlags((prev) => [
                    ...prev,
                    {
                      id:
                        mapJson.userId && mapJson.title
                          ? `${mapJson.userId}-${mapJson.title}-${Date.now()}`
                          : `${Date.now()}`,
                      x: mapJson.mapX ?? currentPin.x,
                      y: mapJson.mapY ?? currentPin.y,
                      title: mapJson.title || title,
                    },
                  ])
                }
              } catch (error) {
                console.error("Error updating map after story completion:", error)
              }
            }

            setStoryState({ character: null, plot: null, structure: null, story: "" })
            setStage(backToStage)
          }}
          onEdit={async (editStage) => {
            // 如果正在编辑已保存的作品，加载之前的内容
            if (editingWorkId && user) {
              try {
                const response = await fetch(`/api/user-works?user_id=${user.username}&type=story`)
                const data = await response.json()
                if (data.success && data.stories) {
                  const work = data.stories.find((s: any) => s.id === editingWorkId)
                  if (work) {
                    setStoryState({
                      character: work.character as any,
                      plot: work.plot as any,
                      structure: work.structure as any,
                      story: work.content || "",
                    })
                  }
                }
              } catch (error) {
                console.error('Error loading work:', error)
              }
            }
            setStage(editStage)
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writing")}
          userId={user.username}
          workId={editingWorkId}
        />
      )}
      {stage === "dashboard" && user && user.role === "teacher" && (
        <Dashboard user={user} onBack={() => setStage("login")} />
      )}
      {stage === "about" && user && (
        <AboutPage />
      )}

      {stage === "gallery" && (
        <GalleryPage 
          currentUser={user?.username ?? null}
          currentUserRole={user?.role ?? null}
          fromEdit={!!galleryFromEdit}
          editType={galleryFromEdit?.type}
          onBackToEdit={() => {
            if (galleryFromEdit) {
              if (galleryFromEdit.type === 'story') {
                setStage("storyEdit")
              } else if (galleryFromEdit.type === 'review') {
                setStage("bookReviewEdit")
              } else if (galleryFromEdit.type === 'letter') {
                setStage("letterEdit")
              }
              setGalleryFromEdit(null)
            }
          }}
        />
      )}

      {stage === "userProfile" && user && (
        <UserProfilePage
          userId={user.username}
          userRole={user.role}
          currentUsername={user.username}
          currentUserRole={user.role}
          avatarUrl={headerUserInfo?.avatarUrl}
          avatarEmoji={headerUserInfo?.avatarEmoji}
          onBack={() => setStage("home")}
          onOpenSettings={() => setStage("userSettings")}
          trees={trees ?? undefined}
          recentGrowthTreeId={lastGrownTree?.treeId ?? null}
          recentGrowthDimension={lastGrownTree?.dimension ?? null}
          onVisitOthersFarm={() => setStage("navigation")}
        />
      )}

      {stage === "userSettings" && user && (
        <UserSettingsPage
          userId={user.username}
          backLabel="Back to Farm"
          onBack={() => setStage("userProfile")}
          onProfileUpdated={(profile) => {
            setHeaderUserInfo((prev) => (prev ? { ...prev, ...profile } : null))
            if (typeof window !== "undefined" && user) {
              window.dispatchEvent(new CustomEvent("headerUserInfo", {
                detail: { username: user.username, unreadCount: headerUserInfo?.unreadCount ?? 0, ...profile },
              }))
            }
          }}
        />
      )}

      {/* Letter Writing Adventure - Complete Flow */}
      {stage === "letterAdventure" && user && (
        <LetterAdventure
          onStart={(recipient, occasion, guidance, readerImageUrl) => {
            setLetterState({
              recipient,
              occasion,
              guidance,
              readerImageUrl,
              sections: [],
              letter: "",
            })
            queueJourneyMapUpdate({
              title: `Letter to ${recipient}`,
              topic: recipient || "letter",
              summaryKey: "letterSummary",
              summaryValue: {
                recipient,
                occasion,
              },
              mapPrompt: `Use the previous map image as a reference. Add visual elements related to the recipient (${recipient}) and occasion (${occasion}).`,
              source: "letter-recipient-selected",
            })
            setStage("letterGame")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          userId={user.username}
          noAi={user.noAi}
        />
      )}

      {stage === "letterGame" && user && letterState.recipient && letterState.occasion && (
        user.noAi ? (
            <LetterGameNoAi
              recipient={letterState.recipient}
              occasion={letterState.occasion}
              onComplete={(sections) => {
                setLetterState(prev => ({
                  ...prev,
                  sections,
                }))
                setStage("letterPuzzle")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "letterAdventure")}
              userId={user.username}
              onDraftChange={(draft) => {
                setLetterState(prev => ({ ...prev, letter: draft }))
              }}
            />
          ) : letterState.guidance !== null ? (
            <LetterGame
              recipient={letterState.recipient}
              occasion={letterState.occasion}
              guidance={letterState.guidance || ""}
              readerImageUrl={letterState.readerImageUrl}
              onComplete={(sections) => {
                setLetterState(prev => ({
                  ...prev,
                  sections,
                }))
                setStage("letterPuzzle")
              }}
              onBack={() => setStage(journeyActive ? "journeyMap" : "letterAdventure")}
              userId={user.username}
              onDraftChange={(draft) => {
                setLetterState(prev => ({ ...prev, letter: draft }))
              }}
            />
          ) : null
      )}

      {stage === "letterPuzzle" && user && letterState.sections.length > 0 && (
        <LetterPuzzle
          sections={letterState.sections}
          structure={["Greeting", "Opening", "Body", "Closing", "Signature"]}
          onPuzzleComplete={(reorderedSections) => {
            const fullLetter = reorderedSections.join('\n\n')
            setLetterState(prev => ({
              ...prev,
              letter: fullLetter,
            }))
            setStage("letterComplete")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "letterGame")}
        />
      )}

      {stage === "letterComplete" && user && letterState.letter && letterState.recipient && letterState.occasion && (
        <LetterComplete
          recipient={letterState.recipient}
          occasion={letterState.occasion}
          letter={letterState.letter}
          guidance={letterState.guidance}
          readerImageUrl={letterState.readerImageUrl}
          sections={letterState.sections}
          onReset={async () => {
            const backToStage = "journeyMap"

            setLetterState({
              recipient: null,
              occasion: null,
              guidance: null,
              readerImageUrl: null,
              sections: [],
              letter: "",
            })
            setStage(backToStage)
          }}
          onBack={async () => {
            if (journeyActive) {
              setStage("journeyMap")
              return
            }
            // 如果正在编辑已保存的作品，加载之前的内容
            if (editingWorkId && user) {
              try {
                const response = await fetch(`/api/user-works?user_id=${user.username}&type=letter`)
                const data = await response.json()
                if (data.success && data.letters) {
                  const work = data.letters.find((l: any) => l.id === editingWorkId)
                  if (work) {
                    setLetterState({
                      recipient: work.recipient || null,
                      occasion: work.occasion || null,
                      guidance: work.guidance || null,
                      readerImageUrl: work.readerImageUrl || null,
                      sections: (work.sections as string[]) || [],
                      letter: work.content || "",
                    })
                  }
                }
              } catch (error) {
                console.error('Error loading work:', error)
              }
            }
            setStage("letterPuzzle")
          }}
          onEdit={() => setStage("letterEdit")}
          userId={user.username}
          workId={editingWorkId}
        />
      )}

      {/* 编辑页面 */}
      {stage === "storyEdit" && user && storyState.story && (
        <StoryEdit
          language={language}
          storyState={storyState}
          onSave={(updatedStoryState) => {
            setStoryState(updatedStoryState)
            setStage("review")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "review")}
          onNavigateToGallery={() => {
            setGalleryFromEdit({ type: 'story' })
            setStage("gallery")
          }}
          userId={user.username}
          workId={editingWorkId}
        />
      )}

      {stage === "bookReviewEdit" && user && bookReviewState.review && bookReviewState.bookTitle && (
        <BookReviewEdit
          language={language}
          reviewType={bookReviewState.reviewType!}
          bookTitle={bookReviewState.bookTitle}
          review={bookReviewState.review}
          bookCoverUrl={bookReviewState.bookCoverUrl}
          bookSummary={bookReviewState.bookSummary}
          structure={bookReviewState.structure}
          onSave={(updatedReview) => {
            setBookReviewState(prev => ({ ...prev, review: updatedReview }))
            setStage("bookReviewComplete")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewComplete")}
          onNavigateToGallery={() => {
            setGalleryFromEdit({ type: 'review' })
            setStage("gallery")
          }}
          userId={user.username}
          workId={editingWorkId}
        />
      )}

      {stage === "letterEdit" && user && letterState.letter && letterState.recipient && letterState.occasion && (
        <LetterEdit
          language={language}
          recipient={letterState.recipient}
          occasion={letterState.occasion}
          letter={letterState.letter}
          guidance={letterState.guidance}
          readerImageUrl={letterState.readerImageUrl}
          sections={letterState.sections}
          onSave={(updatedLetter) => {
            setLetterState(prev => ({ ...prev, letter: updatedLetter }))
            setStage("letterComplete")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "letterComplete")}
          onNavigateToGallery={() => {
            setGalleryFromEdit({ type: 'letter' })
            setStage("gallery")
          }}
          userId={user.username}
          workId={editingWorkId}
        />
      )}

      {/* Drama Writing Flow (V0: builder + book; 地图任务点: dramaWriting, dramaBook) */}
      {stage === "dramaWriting" && user && (
        <DramaWriting
          language={language}
          userId={user.username}
          initialView="builder"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onBackToMap={journeyActive ? () => setStage("journeyMap") : undefined}
          onDramaGenerated={({ topic }) => {
            const dramaTopic = (topic || "").split(",")[0]?.trim() || topic || "mysterious place"
            queueJourneyMapUpdate({
              title: `A Drama in ${dramaTopic}`,
              topic: dramaTopic,
              source: "drama-generated",
            })
          }}
        />
      )}
      {stage === "dramaBook" && user && (
        <DramaWriting
          language={language}
          userId={user.username}
          initialView="book"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onBackToMap={journeyActive ? () => setStage("journeyMap") : undefined}
        />
      )}

      {/* Poetry Writing Flow (地图任务点: poetryForm, poetryTopic, poetryEditor, poetryReview) */}
      {stage === "poetryWriting" && user && (
        <PoetryWriting
          userId={user.username}
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onTopicSelected={(topic) => {
            const cleaned = (topic || "").trim()
            if (!cleaned) return
            queueJourneyMapUpdate({
              title: `A Poetry about ${cleaned}`,
              topic: cleaned,
              source: "poetry-topic-selected",
            })
          }}
          onComplete={() => {
            if (poetryTopicValue) {
              queueJourneyMapUpdate({
                title: `A Poetry about ${poetryTopicValue}`,
                topic: poetryTopicValue,
                source: "poetry-complete",
              })
            }
            setStage(journeyActive ? "journeyMap" : "home")
          }}
        />
      )}
      {stage === "poetryForm" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="choose-form"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "poetryTopic" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="setup-topic"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onTopicSelected={(topic) => {
            const cleaned = (topic || "").trim()
            if (!cleaned) return
            queueJourneyMapUpdate({
              title: `A Poetry about ${cleaned}`,
              topic: cleaned,
              source: "poetry-topic-selected",
            })
          }}
          onComplete={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "poetryEditor" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="editor"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "poetryReview" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="review"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "research" && user && (
        <ResearchRoom
          onBack={() => setStage("home")}
        />
      )}

      {stage === "navigation" && user && (
        <NavigationPage
          onBack={() => setStage("userProfile")}
          onSelectFarm={(friendName) => {
            setSelectedOtherFarmUser(friendName)
            setStage("otherFarm")
          }}
        />
      )}
      {stage === "otherFarm" && user && selectedOtherFarmUser && (
        <UserProfilePage
          userId={selectedOtherFarmUser}
          userRole="student"
          currentUsername={user.username}
          currentUserRole={user.role}
          onBack={() => setStage("journeyMap")}
          onOpenSettings={() => setStage("journeyMap")}
          isOtherFarm
        />
      )}
    </main>
  )
}
