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
import CopywritingToolbar from "@/components/copywriting-toolbar"
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

export interface MapFlagItem {
  id: string
  x: number
  y: number
  title: string
  content?: string
  workType?: "story" | "review" | "letter"
}

interface PersistedMapState {
  mapImageUrl?: string
  mapFlags: MapFlagItem[]
  currentPin: { x: number; y: number } | null
  journeySelection: { type: JourneyType; difficulty: number } | null
  journeyActive: boolean
  levelBadgeUnlocked: boolean
}

const getMapStateKey = (username: string) => `cwriteMapState:${username}`
const getPlanTestResultKey = (username: string) => `cwritePlanTestResult:${username}`
const getTreesStateKey = (username: string) => `cwriteTreesState:${username}`
const VALUES_DIMENSION_COUNT = 12
const VALUES_DIMENSION_NAMES = [
  "Perseverance",
  "Respect for Others",
  "Responsibility",
  "National Identity",
  "Commitment",
  "Integrity",
  "Benevolence",
  "Law-abidingness",
  "Empathy",
  "Diligence",
  "Filial Piety",
  "Unity",
] as const

const getChapterBaseMapImageUrl = (chapterIndex: number) => {
  // 章节0使用第一张底图；后续章节使用第二张底图。
  return chapterIndex <= 0 ? "/firstmap.png" : "/secondmap.png"
}

interface PersistedMapChaptersState {
  activeChapterIndex?: number
  chapters?: PersistedMapState[]
}

const normalizeMapState = (raw: unknown): Partial<PersistedMapState> => {
  if (!raw || typeof raw !== "object") return {}
  const parsed = raw as Partial<PersistedMapState>
  const safe: Partial<PersistedMapState> = {}

  if (typeof parsed.mapImageUrl === "string" && parsed.mapImageUrl.trim()) {
    safe.mapImageUrl = parsed.mapImageUrl
  }
  if (Array.isArray(parsed.mapFlags)) {
    safe.mapFlags = parsed.mapFlags
      .filter((f) => f && typeof f.id === "string")
      .map((f) => {
        const item: MapFlagItem = {
          id: f.id,
          x: typeof f.x === "number" ? f.x : 50,
          y: typeof f.y === "number" ? f.y : 50,
          title: typeof f.title === "string" ? f.title : "Journey",
        }
        if (typeof (f as MapFlagItem).content === "string") item.content = (f as MapFlagItem).content
        if (["story", "review", "letter"].includes((f as MapFlagItem).workType as string)) item.workType = (f as MapFlagItem).workType
        return item
      })
  }
  if (parsed.currentPin && typeof parsed.currentPin.x === "number" && typeof parsed.currentPin.y === "number") {
    safe.currentPin = parsed.currentPin
  }
  if (
    parsed.journeySelection &&
    typeof parsed.journeySelection.difficulty === "number" &&
    typeof parsed.journeySelection.type === "string"
  ) {
    safe.journeySelection = parsed.journeySelection
  }
  if (typeof parsed.journeyActive === "boolean") {
    safe.journeyActive = parsed.journeyActive
  }
  if (typeof parsed.levelBadgeUnlocked === "boolean") {
    safe.levelBadgeUnlocked = parsed.levelBadgeUnlocked
  }
  return safe
}

const normalizeMapChaptersState = (
  raw: unknown,
): {
  activeChapterIndex: number
  chapters: PersistedMapState[]
} => {
  const defaults: PersistedMapState = {
    mapImageUrl: getChapterBaseMapImageUrl(0),
    mapFlags: [],
    currentPin: null,
    journeySelection: null,
    journeyActive: false,
    levelBadgeUnlocked: false,
  }

  if (!raw || typeof raw !== "object") {
    return { activeChapterIndex: 0, chapters: [defaults] }
  }

  const parsed = raw as PersistedMapChaptersState & Partial<PersistedMapState>
  const activeChapterIndex = Number.isFinite(Number(parsed.activeChapterIndex)) ? Math.max(0, Math.floor(Number(parsed.activeChapterIndex))) : 0

  if (Array.isArray(parsed.chapters)) {
    const chapters = parsed.chapters.map((c, idx) => {
      const safe = normalizeMapState(c)
      return {
        mapImageUrl: typeof safe.mapImageUrl === "string" ? safe.mapImageUrl : getChapterBaseMapImageUrl(idx),
        mapFlags: safe.mapFlags ?? [],
        currentPin: safe.currentPin ?? null,
        journeySelection: safe.journeySelection ?? null,
        journeyActive: typeof safe.journeyActive === "boolean" ? safe.journeyActive : false,
        levelBadgeUnlocked: typeof safe.levelBadgeUnlocked === "boolean" ? safe.levelBadgeUnlocked : false,
      } satisfies PersistedMapState
    })

    return {
      activeChapterIndex: Math.min(activeChapterIndex, Math.max(0, chapters.length - 1)),
      chapters: chapters.length > 0 ? chapters : [defaults],
    }
  }

  // 兼容旧格式：raw 本身就是单个 PersistedMapState
  const safe = normalizeMapState(raw)
  const chapter0: PersistedMapState = {
    mapImageUrl: typeof safe.mapImageUrl === "string" ? safe.mapImageUrl : getChapterBaseMapImageUrl(0),
    mapFlags: safe.mapFlags ?? [],
    currentPin: safe.currentPin ?? null,
    journeySelection: safe.journeySelection ?? null,
    journeyActive: typeof safe.journeyActive === "boolean" ? safe.journeyActive : false,
    levelBadgeUnlocked: typeof safe.levelBadgeUnlocked === "boolean" ? safe.levelBadgeUnlocked : false,
  }

  return { activeChapterIndex: 0, chapters: [chapter0] }
}

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

const readLocalTrees = (username: string) => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getTreesStateKey(username))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id: number; stage: number }[] | null
    return Array.isArray(parsed) ? normalizeValuesTrees(parsed) : null
  } catch {
    return null
  }
}

const writeLocalTrees = (username: string, trees: { id: number; stage: number }[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getTreesStateKey(username), JSON.stringify(normalizeValuesTrees(trees)))
  } catch {
    // ignore storage errors
  }
}

/** 單次成長記錄：哪篇文章、類型、觸發成長的句子摘錄 */
export type TreeGrowthDetail = {
  workTitle: string
  workType: "story" | "review" | "letter"
  excerpt: string
  triggerSentence?: string
  overallEvidence?: string
  reason?: string
  timestamp: number
}

const TREE_GROWTH_DETAILS_KEY = (username: string) => `cwriteTreeGrowthDetails:${username}`

function readLocalTreeGrowthDetails(username: string): Record<number, TreeGrowthDetail[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(TREE_GROWTH_DETAILS_KEY(username))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, TreeGrowthDetail[]>
    const out: Record<number, TreeGrowthDetail[]> = {}
    Object.entries(parsed).forEach(([k, arr]) => {
      const id = Number(k)
      if (Number.isFinite(id) && id >= 1 && id <= 12 && Array.isArray(arr)) {
        out[id] = arr
          .filter(
            (x) =>
              x &&
              typeof x.workTitle === "string" &&
              typeof x.excerpt === "string" &&
              typeof x.timestamp === "number"
          )
          .map((x) => ({
            ...x,
            triggerSentence:
              typeof (x as { triggerSentence?: unknown }).triggerSentence === "string"
                ? (x as { triggerSentence?: string }).triggerSentence
                : undefined,
            overallEvidence:
              typeof (x as { overallEvidence?: unknown }).overallEvidence === "string"
                ? (x as { overallEvidence?: string }).overallEvidence
                : undefined,
            reason:
              typeof (x as { reason?: unknown }).reason === "string"
                ? (x as { reason?: string }).reason
                : undefined,
          }))
      }
    })
    return out
  } catch {
    return {}
  }
}

function writeLocalTreeGrowthDetails(username: string, details: Record<number, TreeGrowthDetail[]>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TREE_GROWTH_DETAILS_KEY(username), JSON.stringify(details))
  } catch {
    // ignore
  }
}

function getFirstSentenceOrExcerpt(text: string, maxLen = 180): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  const match = trimmed.match(/^[^.!?]*[.!?]?/)
  const first = match ? match[0].trim() : trimmed.slice(0, maxLen)
  return first.length > maxLen ? first.slice(0, maxLen) + "…" : first
}

function getBestGrowthSentence(text: string, maxLen = 180): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const richLine = lines.find((line) => line.length >= 25) || lines[0] || trimmed
  const sentenceMatch = richLine.match(/[^.!?。！？\n]+[.!?。！？]?/)
  const sentence = sentenceMatch ? sentenceMatch[0].trim() : richLine
  return sentence.length > maxLen ? `${sentence.slice(0, maxLen)}…` : sentence
}

type AppUser = {
  username: string
  role: "teacher" | "student"
  noAi?: boolean
  // 文案專用帳號（copywriting），用於開啟站內所有文字編輯與匯出功能
  isCopywriter?: boolean
}

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [stage, setStage] = useState<"login" | "home" | "planTest" | "journeyTicket" | "journeyMap" | "writeTypeSelection" | "bookReviewWelcome" | "bookReviewTypeSelection" | "bookSelection" | "bookReviewLoading" | "bookReviewWriting" | "bookReviewComplete" | "bookReviewWritingNoAi" | "bookReviewCompleteNoAi" | "letterAdventure" | "letterGame" | "letterPuzzle" | "letterComplete" | "welcome" | "character" | "plot" | "structure" | "writing" | "review" | "dashboard" | "about" | "aboutVision" | "aboutResearch" | "gallery" | "userProfile" | "userSettings" | "storyEdit" | "bookReviewEdit" | "letterEdit" | "dramaWriting" | "dramaBook" | "poetryWriting" | "poetryForm" | "poetryTopic" | "poetryEditor" | "poetryReview" | "research" | "navigation" | "otherFarm">("login")
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
  const [mapFlags, setMapFlags] = useState<MapFlagItem[]>([])
  const [mapImageUrl, setMapImageUrl] = useState<string | undefined>(undefined)
  const [levelBadgeUnlocked, setLevelBadgeUnlocked] = useState(false)
  // Drama 生成完成后，用于把 drama script 写回对应的地图旗帜（显示全文）
  const [pendingDramaMapTitle, setPendingDramaMapTitle] = useState<string | null>(null)

  // Writing map chapters（多章节底图 + 章节文章分页）
  const [activeMapChapterIndex, setActiveMapChapterIndex] = useState(0)
  const [mapChapters, setMapChapters] = useState<PersistedMapState[]>([])
  const mapStateHydratedRef = useRef(false)
  // 12 价值观维度小树：每棵 stage 2->3->4（最多成长两次）
  const [trees, setTrees] = useState<{ id: number; stage: number }[] | null>(null)
  // 上一次写作三指标，用于判断哪一项提升最大
  const [lastMetrics, setLastMetrics] = useState<WritingMetricsSnapshot | null>(null)
  // 最近一次长高的树 + 对应维度，供 Profile 页面做施法特效
  const [lastGrownTree, setLastGrownTree] = useState<{ treeId: number; dimension: TreeGrowthDimension } | null>(null)
  // 每棵樹的成長記錄（哪篇文章、哪句話讓它長高）
  const [treeGrowthDetails, setTreeGrowthDetails] = useState<Record<number, TreeGrowthDetail[]>>({})
  // 进入 farm 的次数：用于强制“闪光长大”动画每次都能重新触发
  const [farmEntryNonce, setFarmEntryNonce] = useState(0)

  // 每次切换到自己的 farm 都增加一次 nonce，确保闪光动画必定重新播放
  useEffect(() => {
    if (stage === "userProfile" && user?.username) {
      setFarmEntryNonce((n: number) => n + 1)
    }
  }, [stage, user?.username])

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
          const signal = typeof data.valueSignal === "string" ? data.valueSignal : "SIT"
          setCagentMood(signal === "CAGENTLIKE" ? "like" : "normal")
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
          const parsed = JSON.parse(savedUser) as AppUser
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
      window.scrollTo({ top: 0, behavior: "auto" })
    }

    const handleNavigateToAboutVision = () => {
      setStage("aboutVision")
      window.scrollTo({ top: 0, behavior: "auto" })
    }

    const handleNavigateToAboutResearchTeam = () => {
      setStage("aboutResearch")
      window.scrollTo({ top: 0, behavior: "auto" })
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
    window.addEventListener('navigateToAboutVision', handleNavigateToAboutVision as EventListener)
    window.addEventListener('navigateToAboutResearchTeam', handleNavigateToAboutResearchTeam as EventListener)
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
      window.removeEventListener('navigateToAboutVision', handleNavigateToAboutVision as EventListener)
      window.removeEventListener('navigateToAboutResearchTeam', handleNavigateToAboutResearchTeam as EventListener)
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
    // 切换用户时先重置为默认地图状态，避免沿用上一位用户的内存数据。
    setMapImageUrl(undefined)
    setMapFlags([])
    setCurrentPin(null)
    setJourneySelection(null)
    setJourneyActive(false)
    setLevelBadgeUnlocked(false)
    setActiveMapChapterIndex(0)
    setMapChapters([])
    let cancelled = false
    void (async () => {
      let loadedFromDb = false
      try {
        // 優先使用資料庫（interaction）中的每用戶地圖狀態，避免 other farm 讀到錯圖。
        const dbRes = await fetch(`/api/user-map-state?user_id=${encodeURIComponent(user.username)}`)
        if (dbRes.ok) {
          const dbJson = await dbRes.json()
          const normalized = normalizeMapChaptersState(dbJson?.state)
          if (!cancelled) {
            setMapChapters(normalized.chapters)
            setActiveMapChapterIndex(normalized.activeChapterIndex)
            const active = normalized.chapters[normalized.activeChapterIndex] || normalized.chapters[0]

            setMapImageUrl(active?.mapImageUrl || getChapterBaseMapImageUrl(normalized.activeChapterIndex))
            setMapFlags(active?.mapFlags ?? [])
            setCurrentPin(active?.currentPin ?? null)
            setJourneySelection(active?.journeySelection ?? null)
            setJourneyActive(typeof active?.journeyActive === "boolean" ? active?.journeyActive : false)
            setLevelBadgeUnlocked(typeof active?.levelBadgeUnlocked === "boolean" ? active?.levelBadgeUnlocked : false)

            loadedFromDb = (active?.mapFlags?.length ?? 0) > 0 || !!active?.currentPin || !!active?.journeySelection
          }
        }
      } catch {
        // ignore db fetch errors and fallback to local
      }

      // 本地備援：保留舊資料兼容
      try {
        const raw = localStorage.getItem(getMapStateKey(user.username))
        if (raw && !cancelled && !loadedFromDb) {
          const normalized = normalizeMapChaptersState(JSON.parse(raw))
          setMapChapters(normalized.chapters)
          setActiveMapChapterIndex(normalized.activeChapterIndex)
          const active = normalized.chapters[normalized.activeChapterIndex] || normalized.chapters[0]

          setMapImageUrl(active?.mapImageUrl || getChapterBaseMapImageUrl(normalized.activeChapterIndex))
          setMapFlags(active?.mapFlags ?? [])
          setCurrentPin(active?.currentPin ?? null)
          setJourneySelection(active?.journeySelection ?? null)
          setJourneyActive(typeof active?.journeyActive === "boolean" ? active?.journeyActive : false)
          setLevelBadgeUnlocked(typeof active?.levelBadgeUnlocked === "boolean" ? active?.levelBadgeUnlocked : false)
        }
      } catch {
        // ignore parse/storage errors
      } finally {
        if (!cancelled) {
          mapStateHydratedRef.current = true
        }
      }
    })()
    return () => {
      cancelled = true
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
      const previousMapImageUrl = mapImageUrl || getChapterBaseMapImageUrl(activeMapChapterIndex)

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
    [journeyActive, user, currentPin, mapImageUrl, activeMapChapterIndex],
  )

  const canMoveToNextChapter = (mapFlags?.length ?? 0) >= 10

  const handleMoveToChapter = useCallback(
    (targetChapterIndex: number) => {
      if (!user?.username) return
      if (targetChapterIndex === activeMapChapterIndex) return
      if (targetChapterIndex < 0) return

      // 保存当前章节的当前状态到内存。
      const currentChapter: PersistedMapState = {
        mapImageUrl,
        mapFlags,
        currentPin,
        journeySelection,
        journeyActive,
        levelBadgeUnlocked,
      }

      setMapChapters((prev) => {
        const updated = Array.isArray(prev) ? [...prev] : []

        const maxIndex = Math.max(activeMapChapterIndex, targetChapterIndex)
        while (updated.length <= maxIndex) {
          const i = updated.length
          updated.push({
            mapImageUrl: getChapterBaseMapImageUrl(i),
            mapFlags: [],
            currentPin: null,
            journeySelection,
            journeyActive,
            levelBadgeUnlocked,
          })
        }

        // 当前章节写回（chapter 切换后强制清空 pin，避免旧 pin 残留）
        updated[activeMapChapterIndex] = { ...currentChapter, currentPin: null }

        // 目标章节如果不存在，默认用底图 + 空旗帜。
        if (!updated[targetChapterIndex]) {
          updated[targetChapterIndex] = {
            mapImageUrl: getChapterBaseMapImageUrl(targetChapterIndex),
            mapFlags: [],
            currentPin: null,
            journeySelection,
            journeyActive,
            levelBadgeUnlocked,
          }
        } else {
          updated[targetChapterIndex] = { ...updated[targetChapterIndex], currentPin: null }
        }

        return updated
      })

      setPendingDramaMapTitle(null)
      setActiveMapChapterIndex(targetChapterIndex)

      const target = mapChapters[targetChapterIndex]
      setMapImageUrl(target?.mapImageUrl || getChapterBaseMapImageUrl(targetChapterIndex))
      setMapFlags(target?.mapFlags ?? [])
      setCurrentPin(null)
      // journeySelection/journeyActive/levelBadgeUnlocked 维持不变（同一段旅程）
    },
    [
      activeMapChapterIndex,
      currentPin,
      journeyActive,
      journeySelection,
      levelBadgeUnlocked,
      mapChapters,
      mapFlags,
      mapImageUrl,
      user?.username,
    ],
  )

  useEffect(() => {
    if (!user?.username || typeof window === "undefined") return
    if (!mapStateHydratedRef.current) return
    const currentChapter: PersistedMapState = {
      mapImageUrl,
      mapFlags,
      currentPin,
      journeySelection,
      journeyActive,
      levelBadgeUnlocked,
    }

    const chapters = Array.isArray(mapChapters) ? [...mapChapters] : []
    const needLen = Math.max(activeMapChapterIndex + 1, chapters.length)
    for (let i = chapters.length; i < needLen; i++) {
      chapters.push({
        mapImageUrl: getChapterBaseMapImageUrl(i),
        mapFlags: [],
        currentPin: null,
        journeySelection: null,
        journeyActive: false,
        levelBadgeUnlocked: false,
      })
    }
    chapters[activeMapChapterIndex] = {
      ...currentChapter,
      // 确保每章节至少有自己的底图标识，避免其它逻辑拿不到 base image。
      mapImageUrl: currentChapter.mapImageUrl || getChapterBaseMapImageUrl(activeMapChapterIndex),
    }

    const payload: PersistedMapChaptersState = {
      activeChapterIndex: activeMapChapterIndex,
      chapters,
    }
    try {
      localStorage.setItem(getMapStateKey(user.username), JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
    // 同步到資料庫，確保切到 other farm 時可讀到該學生的最新地圖狀態。
    void fetch("/api/user-map-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.username,
        state: payload,
      }),
    }).catch(() => {
      // ignore network errors
    })
  }, [user?.username, activeMapChapterIndex, mapChapters, mapImageUrl, mapFlags, currentPin, journeySelection, journeyActive, levelBadgeUnlocked])

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
        const localTrees = readLocalTrees(user.username)
        const initialTrees = normalizeValuesTrees(rawTrees && rawTrees.length > 0 ? rawTrees : localTrees)
        setTrees(initialTrees)
        writeLocalTrees(user.username, initialTrees)
        setTreeGrowthDetails(readLocalTreeGrowthDetails(user.username))
        const lm = profileRes.lastMetrics as WritingMetricsSnapshot | undefined
        if (lm && typeof lm.vocabRichness === "number") {
          setLastMetrics(lm)
        }
        // 若后端还没有 12 维度数据（或旧格式），写回一次标准化森林
        const shouldBackfillTrees =
          !rawTrees ||
          rawTrees.length !== VALUES_DIMENSION_COUNT ||
          rawTrees.some((tree, idx) => Number(tree?.id) !== idx + 1 || normalizeTreeStage(Number(tree?.stage) || 2) !== Number(tree?.stage))
        if (shouldBackfillTrees && !profileRes.degraded) {
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
          const localTrees = readLocalTrees(user.username)
          const nextTrees = normalizeValuesTrees(rawTrees && rawTrees.length > 0 ? rawTrees : localTrees)
          setTrees(nextTrees)
          writeLocalTrees(user.username, nextTrees)
          setTreeGrowthDetails(readLocalTreeGrowthDetails(user.username))
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

  // 根据 12 价值观命中维度更新森林：命中的树 stage +1（上限 4），並記錄是哪篇文章/哪句話讓它長高
  const applyTreeGrowthFromMetrics = useCallback(
    async (
      matchedDimensions: number[],
      payload?: {
        workTitle: string
        workType: "story" | "review" | "letter"
        excerpt: string
        triggerSentence?: string
        evidenceByDimension?: Record<number, { sentence?: string; overallEvidence?: string; reason?: string }>
      }
    ) => {
      if (!user) return
      const hasStrictEvidence = (id: number) => {
        const evidence = payload?.evidenceByDimension?.[id]
        const sentence = String(evidence?.sentence || "").trim()
        const overall = String(evidence?.overallEvidence || "").trim()
        const reason = String(evidence?.reason || "").trim()
        return (!!sentence || !!overall) && !!reason
      }
      const evidenceMatchedDimensions = payload?.evidenceByDimension
        ? matchedDimensions.filter((n) => hasStrictEvidence(Number(n)))
        : matchedDimensions
      if (evidenceMatchedDimensions.length === 0) return

      const currentTrees = normalizeValuesTrees(trees)
      const growthCounter = new Map<number, number>()
      evidenceMatchedDimensions
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
      writeLocalTrees(user.username, nextTrees)
      setLastGrownTree({ treeId: grownTreeId, dimension: "vocab" })

      if (payload) {
        const detail: TreeGrowthDetail = {
          ...payload,
          timestamp: Date.now(),
        }
        setTreeGrowthDetails((prev) => {
          const next = { ...prev }
          matchedIds.forEach((id) => {
            const list = next[id] ?? []
            const evidence = payload.evidenceByDimension?.[id]
            const evidenceSentence = (evidence?.sentence || "").trim()
            const overallEvidence = (evidence?.overallEvidence || "").trim()
            const evidenceReason = (evidence?.reason || "").trim()
            if ((!evidenceSentence && !overallEvidence) || !evidenceReason) return
            next[id] = [
              ...list,
              {
                ...detail,
                ...(evidenceSentence ? { triggerSentence: evidenceSentence } : {}),
                ...(overallEvidence ? { overallEvidence } : {}),
                reason: evidenceReason,
              },
            ]
          })
          writeLocalTreeGrowthDetails(user.username, next)
          return next
        })
      }

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

  const evaluateValuesGrowth = useCallback(
    async (text: string, type: "story" | "review" | "letter", workTitle?: string) => {
      if (!user || !text.trim()) return
      const excerpt = getFirstSentenceOrExcerpt(text)
      const triggerSentence = getBestGrowthSentence(text)
      const title = workTitle?.trim() || (type === "story" ? "My Story" : type === "review" ? "Book Review" : "My Letter")
      try {
        const valuesRes = await fetch("/api/writing-values-growth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            type,
            user_id: user.username,
          }),
        })
        const valuesJson = await valuesRes.json()
        const matchedDimensions = Array.isArray(valuesJson?.matchedDimensions)
          ? valuesJson.matchedDimensions
          : []
        const evidenceByDimension =
          valuesJson?.evidenceByDimension && typeof valuesJson.evidenceByDimension === "object"
            ? (valuesJson.evidenceByDimension as Record<number, { sentence?: string; overallEvidence?: string; reason?: string }>)
            : {}
        await applyTreeGrowthFromMetrics(matchedDimensions, {
          workTitle: title,
          workType: type,
          excerpt: excerpt || text.slice(0, 120) + (text.length > 120 ? "…" : ""),
          triggerSentence,
          evidenceByDimension,
        })
      } catch (error) {
        console.error("Error evaluating values growth:", error)
      }
    },
    [user, applyTreeGrowthFromMetrics]
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

  const isCopywriter = !!user?.isCopywriter || user?.username === "copywriting"

  return (
    <main className="min-h-screen" data-stage={stage}>
      <RedFlashOverlay active={redFlashActive} duration={2000} />
      {user &&
        stage !== "login" &&
        stage !== "home" &&
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
            // copywriting 專用賬號：即使是 teacher 角色，也直接進入 home，不進教師後台
            if (userData.username === "copywriting") {
              setStage("home")
              return
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
          onBack={() => setStage("journeyMap")}
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
            // 左上返回：回到地圖
            setStage("journeyMap")
          }}
          onRetest={() => {
            // Retest：清空當前測驗結果與等級，重新做 7 題選擇題
            setWritingAssessment(null)
            setPlanTestResult(null)
            if (typeof window !== "undefined" && user?.username) {
              try {
                localStorage.removeItem(getPlanTestResultKey(user.username))
              } catch {
                // ignore storage errors
              }
            }
            setStage("planTest")
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
          chapterIndex={activeMapChapterIndex}
          onPrevChapter={activeMapChapterIndex > 0 ? () => handleMoveToChapter(activeMapChapterIndex - 1) : undefined}
          onNextChapter={canMoveToNextChapter ? () => handleMoveToChapter(activeMapChapterIndex + 1) : undefined}
          canMoveToNextChapter={canMoveToNextChapter}
          storyState={storyState}
          bookReviewState={bookReviewState}
          letterState={letterState}
          dramaProgress={journeySelection.type === "drama" ? dramaProgress : undefined}
          poetryProgress={journeySelection.type === "poetry" ? poetryProgress : undefined}
          noAi={user.noAi}
          onBack={() => setStage("userProfile")}
          onNavigate={(targetStage) => {
            setStage(targetStage as any)
          }}
          onGoProfile={() => setStage("userProfile")}
          onFlagUpdate={(flagId, updates) => {
            setMapFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, ...updates } : f)))
          }}
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
          onReset={async (finalReview) => {
            const backToStage = "journeyMap"
            void evaluateValuesGrowth(finalReview, "review", bookReviewState.bookTitle ? `Review: ${bookReviewState.bookTitle}` : "Book Review")

            const reviewSnapshot = {
              bookTitle: bookReviewState.bookTitle,
              reviewType: bookReviewState.reviewType,
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

            if (!journeyActive && user && currentPin && finalReview.trim().length > 0) {
              void (async () => {
                const title = reviewSnapshot.bookTitle || "My Book Review"
                const topic = reviewSnapshot.bookTitle || "book world"
                const previousMapImageUrl = mapImageUrl || "/firstmap.png"
                const endpoint = "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  reviewSummary: {
                    bookTitle: reviewSnapshot.bookTitle,
                    reviewType: reviewSnapshot.reviewType,
                  },
                  previousMapImageUrl,
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add visual elements related to this book review (title: ${
                    reviewSnapshot.bookTitle
                  }, type: ${reviewSnapshot.reviewType}). Update the surrounding area so the map reflects this reading journey.`,
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
                      content: finalReview,
                      workType: "review",
                    },
                  ])
                }
              })().catch((error) => {
                console.error("Error updating map after review completion:", error)
              })
            }
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
          onReset={async (finalReview) => {
            const backToStage = "journeyMap"
            void evaluateValuesGrowth(finalReview, "review", bookReviewState.bookTitle ? `Review: ${bookReviewState.bookTitle}` : "Book Review")

            const reviewSnapshot = {
              bookTitle: bookReviewState.bookTitle,
              reviewType: bookReviewState.reviewType,
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

            if (!journeyActive && user && currentPin && finalReview.trim().length > 0) {
              void (async () => {
                const title = reviewSnapshot.bookTitle || "My Book Review"
                const topic = reviewSnapshot.bookTitle || "book world"
                const previousMapImageUrl = mapImageUrl || "/firstmap.png"
                const endpoint = "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  reviewSummary: {
                    bookTitle: reviewSnapshot.bookTitle,
                    reviewType: reviewSnapshot.reviewType,
                  },
                  previousMapImageUrl,
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add visual elements related to this book review (title: ${
                    reviewSnapshot.bookTitle
                  }, type: ${reviewSnapshot.reviewType}). Update the surrounding area so the map reflects this reading journey.`,
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
                      content: finalReview,
                      workType: "review",
                    },
                  ])
                }
              })().catch((error) => {
                console.error("Error updating map after review completion (no AI):", error)
              })
            }
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
          onReset={async (finalStory) => {
            const backToStage = "journeyMap"
            const storyTitle = storyState.character?.name?.trim() ? `${storyState.character.name}'s Story` : "My Story"
            void evaluateValuesGrowth(finalStory, "story", storyTitle)

            const characterSnapshot = storyState.character
            const plotSnapshot = storyState.plot
            const structureSnapshot = storyState.structure
            setStoryState({ character: null, plot: null, structure: null, story: "" })
            setStage(backToStage)

            // Journey 模式下，地圖已在 Plot 步驟更新，這裡不再重複調 Fal，只是清理狀態並返回地圖
            if (!journeyActive && user && currentPin && finalStory.trim().length > 0) {
              void (async () => {
                const title =
                  characterSnapshot?.name && characterSnapshot.name.trim().length > 0
                    ? `${characterSnapshot.name}'s Story`
                    : "My Story"

                const species = characterSnapshot?.species
                const setting = plotSnapshot?.setting
                const structureType = structureSnapshot?.type

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
                      content: finalStory,
                      workType: "story",
                    },
                  ])
                }
              })().catch((error) => {
                console.error("Error updating map after story completion:", error)
              })
            }
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
      {(stage === "about" || stage === "aboutVision" || stage === "aboutResearch") && user && (
        <AboutPage
          language={language}
          initialSection={
            stage === "aboutVision" ? "vision" : stage === "aboutResearch" ? "research" : undefined
          }
        />
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
          onBack={() => setStage("journeyMap")}
          onOpenSettings={() => setStage("userSettings")}
          trees={trees ?? undefined}
          treeGrowthDetails={treeGrowthDetails}
          recentGrowthTreeId={lastGrownTree?.treeId ?? null}
          recentGrowthDimension={lastGrownTree?.dimension ?? null}
          farmEntryNonce={farmEntryNonce}
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
          onReset={async (finalLetter) => {
            const backToStage = "journeyMap"
            const letterTitle = letterState.recipient ? `Letter to ${letterState.recipient}` : "My Letter"
            void evaluateValuesGrowth(finalLetter, "letter", letterTitle)

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
          onBack={() => {
            if (journeyActive && dramaBook) {
              void evaluateValuesGrowth(dramaBook.script || "", "story", "My Drama")
            }
            setStage(journeyActive ? "journeyMap" : "writeTypeSelection")
          }}
          onBackToMap={journeyActive ? () => setStage("journeyMap") : undefined}
          onDramaGenerated={({ topic }) => {
            const dramaTopic = (topic || "").split(",")[0]?.trim() || topic || "mysterious place"
            const mapTitle = `A Drama in ${dramaTopic}`
            setPendingDramaMapTitle(mapTitle)
            queueJourneyMapUpdate({
              title: mapTitle,
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
          onBack={() => {
            if (journeyActive && dramaBook) {
              const script = dramaBook.script || ""
              // 回到地图时把全文塞回对应 flag，避免 journey-map 只显示标题/空全文
              setMapFlags((prev) => {
                if (!script.trim()) return prev

                let targetIndex = -1
                if (pendingDramaMapTitle) {
                  for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i]?.title === pendingDramaMapTitle) {
                      targetIndex = i
                      break
                    }
                  }
                }

                // fallback: 找到最近一条 “A Drama in …” 且还没有 content 的 flag
                if (targetIndex === -1) {
                  for (let i = prev.length - 1; i >= 0; i--) {
                    const t = prev[i]?.title || ""
                    if (t.startsWith("A Drama in ") && !prev[i]?.content) {
                      targetIndex = i
                      break
                    }
                  }
                }

                if (targetIndex === -1) return prev
                const next = [...prev]
                next[targetIndex] = { ...next[targetIndex], content: script }
                return next
              })

              void evaluateValuesGrowth(script, "story", "My Drama")
            }
            setStage(journeyActive ? "journeyMap" : "writeTypeSelection")
          }}
          onBackToMap={
            journeyActive
              ? () => {
                  if (dramaBook) {
                    const script = dramaBook.script || ""
                    if (script.trim()) {
                      setMapFlags((prev) => {
                        let targetIndex = -1
                        if (pendingDramaMapTitle) {
                          for (let i = prev.length - 1; i >= 0; i--) {
                            if (prev[i]?.title === pendingDramaMapTitle) {
                              targetIndex = i
                              break
                            }
                          }
                        }

                        // fallback: 找到最近一条 “A Drama in …” 且还没有 content 的 flag
                        if (targetIndex === -1) {
                          for (let i = prev.length - 1; i >= 0; i--) {
                            const t = prev[i]?.title || ""
                            if (t.startsWith("A Drama in ") && !prev[i]?.content) {
                              targetIndex = i
                              break
                            }
                          }
                        }

                        if (targetIndex === -1) return prev
                        const next = [...prev]
                        next[targetIndex] = { ...next[targetIndex], content: script }
                        return next
                      })

                      void evaluateValuesGrowth(script, "story", "My Drama")
                    }
                  }
                  setStage("journeyMap")
                }
              : undefined
          }
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
            evaluateValuesGrowth(poetryLinesText, "story", poetryTopicValue ? `Poetry: ${poetryTopicValue}` : "My Poetry")
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
          onComplete={() => {
            evaluateValuesGrowth(poetryLinesText, "story", poetryTopicValue ? `Poetry: ${poetryTopicValue}` : "My Poetry")
            setStage(journeyActive ? "journeyMap" : "home")
          }}
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
          onComplete={() => {
            evaluateValuesGrowth(poetryLinesText, "story", poetryTopicValue ? `Poetry: ${poetryTopicValue}` : "My Poetry")
            setStage(journeyActive ? "journeyMap" : "home")
          }}
        />
      )}
      {stage === "poetryEditor" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="editor"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => {
            evaluateValuesGrowth(poetryLinesText, "story", poetryTopicValue ? `Poetry: ${poetryTopicValue}` : "My Poetry")
            setStage(journeyActive ? "journeyMap" : "home")
          }}
        />
      )}
      {stage === "poetryReview" && user && (
        <PoetryWriting
          userId={user.username}
          initialPhase="review"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => {
            evaluateValuesGrowth(poetryLinesText, "story", poetryTopicValue ? `Poetry: ${poetryTopicValue}` : "My Poetry")
            setStage(journeyActive ? "journeyMap" : "home")
          }}
        />
      )}
      {stage === "research" && user && (
        <ResearchRoom
          onBack={() => setStage("home")}
        />
      )}

      {stage === "navigation" && user && (
        <NavigationPage
          currentUsername={user.username}
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
          onBack={() => {
            setJourneyActive(true)
            if (!journeySelection) {
              setJourneySelection({ type: "story", difficulty: writingAssessment?.level || 1 })
            }
            if (!writingAssessment) {
              setWritingAssessment({
                score: planTestResult?.score ?? 0,
                level: planTestResult?.level ?? 1,
                mapImageStatus: "idle",
              })
            }
            setStage("journeyMap")
          }}
          onOpenSettings={() => {
            setJourneyActive(true)
            if (!journeySelection) {
              setJourneySelection({ type: "story", difficulty: writingAssessment?.level || 1 })
            }
            if (!writingAssessment) {
              setWritingAssessment({
                score: planTestResult?.score ?? 0,
                level: planTestResult?.level ?? 1,
                mapImageStatus: "idle",
              })
            }
            setStage("journeyMap")
          }}
          onVisitOthersFarm={() => setStage("navigation")}
          isOtherFarm
        />
      )}

      {/* 文案帳號工具條：僅 copywriting 登錄且非 login 頁面時顯示 */}
      {isCopywriter && user && stage !== "login" && (
        <CopywritingToolbar username={user.username} stage={stage} />
      )}
    </main>
  )
}
