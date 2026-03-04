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

export default function Home() {
  const [user, setUser] = useState<{ username: string; role: 'teacher' | 'student'; noAi?: boolean } | null>(null)
  const [stage, setStage] = useState<"login" | "home" | "planTest" | "journeyTicket" | "journeyMap" | "writeTypeSelection" | "bookReviewWelcome" | "bookReviewTypeSelection" | "bookSelection" | "bookReviewLoading" | "bookReviewWriting" | "bookReviewComplete" | "bookReviewWritingNoAi" | "bookReviewCompleteNoAi" | "letterAdventure" | "letterGame" | "letterPuzzle" | "letterComplete" | "welcome" | "character" | "plot" | "structure" | "writing" | "review" | "dashboard" | "about" | "gallery" | "userProfile" | "userSettings" | "storyEdit" | "bookReviewEdit" | "letterEdit" | "dramaWriting" | "dramaBook" | "poetryWriting" | "poetryForm" | "poetryTopic" | "poetryEditor" | "poetryReview" | "research">("login")
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
  const [cagentMood, setCagentMood] = useState<CagentMood>("normal")
  const [valuesMessage, setValuesMessage] = useState<string | null>(null)
  const [valuesSuggestion, setValuesSuggestion] = useState<string | null>(null)
  const [redFlashActive, setRedFlashActive] = useState(false)
  const valuesCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentPin, setCurrentPin] = useState<{ x: number; y: number } | null>(null)
  const [mapFlags, setMapFlags] = useState<{ id: string; x: number; y: number; title: string }[]>([])
  const [mapImageUrl, setMapImageUrl] = useState<string | undefined>(undefined)
  // 小树森林：最多 12 棵，每棵 { id, stage: 1-6 }
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
    
    const handleNavigateToHome = () => {
      setStage("home")
      setJourneyActive(false)
      setJourneySelection(null)
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
    window.addEventListener('navigateToHome', handleNavigateToHome as EventListener)
    window.addEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
    window.addEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
    window.addEventListener('navigateToResearch', handleNavigateToResearch as EventListener)
    window.addEventListener('navigateToUserProfile', handleNavigateToUserProfile as EventListener)
    window.addEventListener('navigateToUserSettings', handleNavigateToUserSettings as EventListener)
    window.addEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('navigateToWriteTypeSelection', handleNavigateToWriteTypeSelection as EventListener)
      window.removeEventListener('navigateToHome', handleNavigateToHome as EventListener)
      window.removeEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
      window.removeEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
      window.removeEventListener('navigateToResearch', handleNavigateToResearch as EventListener)
      window.removeEventListener('navigateToUserProfile', handleNavigateToUserProfile as EventListener)
      window.removeEventListener('navigateToUserSettings', handleNavigateToUserSettings as EventListener)
      window.removeEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    }
  }, [user])

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
      // 初始化小树和上一次指标（若后端已有则使用，否则创建一棵 stage=1 的树）
      if (!profileRes.error) {
        const rawTrees = Array.isArray(profileRes.trees) ? profileRes.trees as { id: number; stage: number }[] : null
        let initialTrees = rawTrees && rawTrees.length > 0 ? rawTrees : [{ id: 1, stage: 1 }]
        // 只保留前 12 棵
        if (initialTrees.length > 12) {
          initialTrees = initialTrees.slice(0, 12)
        }
        setTrees(initialTrees)
        const lm = profileRes.lastMetrics as WritingMetricsSnapshot | undefined
        if (lm && typeof lm.vocabRichness === "number") {
          setLastMetrics(lm)
        }
        // 如果后端还没有 trees 字段，写回一次默认森林
        if (!rawTrees || rawTrees.length === 0) {
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
          if (rawTrees) {
            setTrees(rawTrees.slice(0, 12))
          }
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

  // 基于 Dify 指标，决定本次成长主要维度（词汇 / 描写 / 逻辑）
  const chooseGrowthDimension = (metrics: WritingMetricsSnapshot, previous: WritingMetricsSnapshot | null): TreeGrowthDimension => {
    if (!previous) {
      // 首次没有对比，就选分数最高的维度
      const triples: [TreeGrowthDimension, number][] = [
        ["vocab", metrics.vocabRichness],
        ["detail", metrics.descriptiveAccuracy],
        ["logic", metrics.logicalCoherence],
      ]
      triples.sort((a, b) => b[1] - a[1])
      return triples[0][0]
    }
    const deltas: [TreeGrowthDimension, number][] = [
      ["vocab", metrics.vocabRichness - previous.vocabRichness],
      ["detail", metrics.descriptiveAccuracy - previous.descriptiveAccuracy],
      ["logic", metrics.logicalCoherence - previous.logicalCoherence],
    ]
    deltas.sort((a, b) => b[1] - a[1])
    // 如果所有提升都 <= 0，则仍然选择当前得分最高的维度，表示整体巩固
    if (deltas[0][1] <= 0) {
      const triples: [TreeGrowthDimension, number][] = [
        ["vocab", metrics.vocabRichness],
        ["detail", metrics.descriptiveAccuracy],
        ["logic", metrics.logicalCoherence],
      ]
      triples.sort((a, b) => b[1] - a[1])
      return triples[0][0]
    }
    return deltas[0][0]
  }

  // 根据三指标更新森林：某一棵树 stage+1，满 6 后若不足 12 棵则种新树
  const applyTreeGrowthFromMetrics = useCallback(
    async (metrics: WritingMetricsSnapshot) => {
      if (!user) return
      let grownTreeId = 1
      const dimension = chooseGrowthDimension(metrics, lastMetrics)

      const nextTrees = (() => {
        if (!trees || trees.length === 0) {
          grownTreeId = 1
          return [{ id: 1, stage: 1 }]
        }
        const cloned = [...trees]
        const lastIndex = cloned.length - 1
        const current = cloned[lastIndex]
        if (current.stage < 6) {
          const updated = { ...current, stage: current.stage + 1 }
          cloned[lastIndex] = updated
          grownTreeId = updated.id
          return cloned
        }
        // 当前最后一棵已经满级
        grownTreeId = current.id
        if (cloned.length < 12) {
          const nextId = cloned[cloned.length - 1].id + 1
          cloned.push({ id: nextId, stage: 1 })
          grownTreeId = nextId
        }
        return cloned
      })()

      setTrees(nextTrees)
      setLastMetrics(metrics)
      setLastGrownTree({ treeId: grownTreeId, dimension })

      // 同步到后端 profile
      try {
        await fetch("/api/user-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.username,
            trees: nextTrees,
            lastMetrics: metrics,
          }),
        })
      } catch {
        // 后端失败不阻塞前端体验
      }
    },
    [trees, user, lastMetrics]
  )

  if (!isReady) {
    return null
  }

  const showLevelBadge = user && writingAssessment && writingAssessment.level >= 1 && writingAssessment.level <= 5 && !["login", "home", "planTest"].includes(stage)

  return (
    <main className="min-h-screen" data-stage={stage}>
      <RedFlashOverlay active={redFlashActive} duration={2000} />
      {user &&
        stage !== "login" &&
        stage !== "userProfile" &&
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
            // V2 设计：从首页直接进入地图，而不是先做测评问卷
            // 初始化一次简单的写作旅程配置（默认 story + level 1），让地图可以渲染
            setJourneyActive(true)
            setJourneySelection({ type: "story", difficulty: 1 })
            setWritingAssessment({
              score: 0,
              level: 1,
              mapImageStatus: "idle",
            })
            // 清空当前 pin 和故事状态，进入一张空白地图
            setCurrentPin(null)
            setStoryState({ character: null, plot: null, structure: null, story: "" })
            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            setLetterState({
              recipient: null,
              occasion: null,
              guidance: null,
              readerImageUrl: null,
              sections: [],
              letter: "",
            })
            setStage("journeyMap")
          }}
          onStartWrite={() => {
            setJourneyActive(false)
            setJourneySelection(null)
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
          mapImageStatus={writingAssessment.mapImageStatus}
          onBack={() => {
            setJourneyActive(false)
            setJourneySelection(null)
            setStage("home")
          }}
          onStart={({ type, difficulty }) => {
            setJourneySelection({ type, difficulty })
            setJourneyActive(true)
            setCurrentPin(null)
            if (type === "story") {
              setStoryState({ character: null, plot: null, structure: null, story: "" })
            } else if (type === "bookReview") {
              setBookReviewState({
                reviewType: null,
                bookTitle: null,
                structure: null,
                review: "",
                bookCoverUrl: undefined,
                bookSummary: undefined,
              })
            } else if (type === "letter") {
              setLetterState({
                recipient: null,
                occasion: null,
                guidance: null,
                readerImageUrl: null,
                sections: [],
                letter: "",
              })
            }
            // 直接跳转到地图页面（背景图已在planTest完成后生成）
            setStage("journeyMap")
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

            if (journeyActive && user && currentPin && bookReviewState.review.trim().length > 0) {
              try {
                const title = bookReviewState.bookTitle || "My Book Review"
                const topic = bookReviewState.bookTitle || "book world"
                const isFirstMap = !mapImageUrl
                const previousMapImageUrl = isFirstMap ? "/firstmap.png" : mapImageUrl
                const endpoint = isFirstMap ? "/api/map-generate" : "/api/map-update"
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

            if (journeyActive && user && currentPin && bookReviewState.review.trim().length > 0) {
              try {
                const title = bookReviewState.bookTitle || "My Book Review"
                const topic = bookReviewState.bookTitle || "book world"
                const isFirstMap = !mapImageUrl
                const previousMapImageUrl = isFirstMap ? "/firstmap.png" : mapImageUrl
                const endpoint = isFirstMap ? "/api/map-generate" : "/api/map-update"
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
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "character")}
            userId={user.username}
          />
        ) : (
          <PlotBrainstorm
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState(prev => ({ ...prev, plot }))
              setStage(journeyActive ? "structure" : "journeyMap")
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

            if (journeyActive && user && currentPin && storyState.story.trim().length > 0) {
              try {
                // 1. 調用 Dify 寫作指標 API
                const metricsRes = await fetch("/api/writing-metrics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: storyState.story,
                    type: "story",
                    user_id: user.username,
                  }),
                })
                const metricsJson = await metricsRes.json()
                const metrics = metricsJson.metrics || {
                  vocabRichness: 40,
                  descriptiveAccuracy: 40,
                  logicalCoherence: 40,
                }
                await applyTreeGrowthFromMetrics(metrics)

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

                const isFirstMap = !mapImageUrl
                const previousMapImageUrl = isFirstMap ? "/firstmap.png" : mapImageUrl
                const endpoint = isFirstMap ? "/api/map-generate" : "/api/map-update"
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
          avatarUrl={headerUserInfo?.avatarUrl}
          avatarEmoji={headerUserInfo?.avatarEmoji}
          onBack={() => setStage("home")}
          onOpenSettings={() => setStage("userSettings")}
          trees={trees ?? undefined}
          recentGrowthTreeId={lastGrownTree?.treeId ?? null}
          recentGrowthDimension={lastGrownTree?.dimension ?? null}
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
            const backToStage = journeyActive ? "journeyMap" : "home"

            if (journeyActive && user && currentPin && letterState.letter.trim().length > 0) {
              try {
                const title = `Letter to ${letterState.recipient}`
                const topic = letterState.occasion || `letter to ${letterState.recipient}`

                const isFirstMap = !mapImageUrl
                const previousMapImageUrl = isFirstMap ? "/firstmap.png" : mapImageUrl
                const endpoint = isFirstMap ? "/api/map-generate" : "/api/map-update"
                const payload: any = {
                  userId: user.username,
                  title,
                  topic,
                  mapX: currentPin.x,
                  mapY: currentPin.y,
                  letterSummary: {
                    recipient: letterState.recipient,
                    occasion: letterState.occasion,
                  },
                  previousMapImageUrl,
                  mapPrompt: `Use the previous map image as a reference. At the student's starting position (x=${currentPin.x.toFixed(
                    1,
                  )}%, y=${currentPin.y.toFixed(
                    1,
                  )}%), add visual elements that match this letter (recipient: ${
                    letterState.recipient
                  }, occasion: ${letterState.occasion}). Update the surrounding area so the map reflects this letter journey.`,
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
                console.error("Error updating map after letter completion:", error)
              }
            }

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
        />
      )}
      {stage === "dramaBook" && user && (
        <DramaWriting
          language={language}
          userId={user.username}
          initialView="book"
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
        />
      )}

      {/* Poetry Writing Flow (地图任务点: poetryForm, poetryTopic, poetryEditor, poetryReview) */}
      {stage === "poetryWriting" && user && (
        <PoetryWriting
          userId={user.username}
          backLabel={journeyActive ? "Back to Map" : undefined}
          onBack={() => setStage(journeyActive ? "journeyMap" : "writeTypeSelection")}
          onComplete={() => setStage(journeyActive ? "journeyMap" : "home")}
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
    </main>
  )
}
