"use client"

import { useState, useEffect } from "react"
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
import LetterAdventure from "@/components/stages/letter-adventure"
import LetterGame from "@/components/stages/letter-game"
import LetterGameNoAi from "@/components/stages/letter-game-no-ai"
import LetterPuzzle from "@/components/stages/letter-puzzle"
import LetterComplete from "@/components/stages/letter-complete"
import ContinueWorksDialog from "@/components/auth/continue-works-dialog"
import StoryEdit from "@/components/stages/story-edit"
import BookReviewEdit from "@/components/stages/book-review-edit"
import LetterEdit from "@/components/stages/letter-edit"

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

interface WritingAssessment {
  score: number
  level: number
  favoriteTopic: string
  mapImageUrl?: string
  mapImageStatus: "idle" | "loading" | "ready" | "error"
}

export default function Home() {
  const [user, setUser] = useState<{ username: string; role: 'teacher' | 'student'; noAi?: boolean } | null>(null)
  const [stage, setStage] = useState<"login" | "home" | "planTest" | "journeyTicket" | "journeyMap" | "writeTypeSelection" | "bookReviewWelcome" | "bookReviewTypeSelection" | "bookSelection" | "bookReviewLoading" | "bookReviewWriting" | "bookReviewComplete" | "bookReviewWritingNoAi" | "bookReviewCompleteNoAi" | "letterAdventure" | "letterGame" | "letterPuzzle" | "letterComplete" | "welcome" | "character" | "plot" | "structure" | "writing" | "review" | "dashboard" | "about" | "gallery" | "storyEdit" | "bookReviewEdit" | "letterEdit">("login")
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

  // Hydration safety
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    setIsReady(true)
    
    // 从localStorage读取语言设置，默认英语
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('siteLanguage') as Language | null
      if (savedLang === 'yue') {
        setLanguage('zh')
        localStorage.setItem('siteLanguage', 'zh')
      } else if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
        setLanguage(savedLang)
      } else {
        // 如果没有保存的语言设置，默认使用英语
        setLanguage('en')
        localStorage.setItem('siteLanguage', 'en')
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
    window.addEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('navigateToWriteTypeSelection', handleNavigateToWriteTypeSelection as EventListener)
      window.removeEventListener('navigateToHome', handleNavigateToHome as EventListener)
      window.removeEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
      window.removeEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
      window.removeEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    }
  }, [user])

  if (!isReady) {
    return null
  }

  return (
    <main className="min-h-screen">
      {stage === "login" && (
        <LoginPage
          onLogin={(userData, showDialog = false) => {
            setUser(userData)
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
            setJourneyActive(false)
            setJourneySelection(null)
            setWritingAssessment(null)
            setStage("planTest")
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
              favoriteTopic: result.favoriteTopic,
              mapImageStatus: "idle", // 不在planTest时生成地图，等用户选择文章类型后再生成
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
          onStart={async ({ type, difficulty }) => {
            setJourneySelection({ type, difficulty })
            setJourneyActive(true)
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

            // 检查地图是否已经生成（如果是相同的type和difficulty）
            const currentMapStatus = writingAssessment?.mapImageStatus
            const currentSelection = journeySelection
            if (
              currentMapStatus === "ready" && 
              writingAssessment?.mapImageUrl &&
              currentSelection?.type === type &&
              currentSelection?.difficulty === difficulty
            ) {
              // 地图已准备好且是相同的选择，直接跳转
              setStage("journeyMap")
              return
            }
            
            // 如果地图状态不是ready，或者type/difficulty改变了，需要重新生成

            // 根据文章类型获取任务点数量和位置信息
            const getTaskInfo = (type: JourneyType, noAi?: boolean) => {
              if (type === "story") {
                return { count: 5, positions: [16.67, 33.33, 50, 66.67, 83.33] }
              } else if (type === "bookReview") {
                const count = noAi ? 4 : 5
                const positions = noAi ? [20, 40, 60, 80] : [16.67, 33.33, 50, 66.67, 83.33]
                return { count, positions }
              } else if (type === "letter") {
                return { count: 4, positions: [20, 40, 60, 80] }
              }
              return { count: 1, positions: [50] }
            }

            const taskInfo = getTaskInfo(type, user.noAi)
            const favorite = writingAssessment?.favoriteTopic?.trim() || "a magical story world"
            
            // 生成包含任务点空位信息的prompt
            const positionDescriptions = taskInfo.positions.map((pos, idx) => 
              `at ${pos}% from left, 50% from top, leave a 200x200 pixel empty space`
            ).join(", ")
            
            const typeName = type === "story" ? "story writing" : type === "bookReview" ? "book review writing" : "letter writing"
            const prompt = `A whimsical illustrated fantasy game map inspired by ${favorite}, designed for ${typeName} journey. Colorful, kid-friendly, top-down view, game-style map design like a video game level. The map should have ${taskInfo.count} empty spaces for task markers arranged horizontally from left to right, evenly distributed across the middle of the map. Each empty space should be approximately 200x200 pixels, clearly visible as empty areas: ${positionDescriptions}. No text labels, just the beautiful game map background with clearly marked empty rectangular areas where task markers will be placed.`

            // 设置地图状态为loading
            setWritingAssessment((prev) =>
              prev ? { ...prev, mapImageStatus: "loading" } : prev
            )

            // 先跳转到地图页面（显示loading状态）
            setStage("journeyMap")

            console.log("=== Starting map generation ===")
            console.log("Type:", type, "Difficulty:", difficulty)
            console.log("Prompt:", prompt)
            console.log("Task info:", taskInfo)
            console.log("Favorite topic:", favorite)

            try {
              const requestBody = {
                prompt,
                aspect_ratio: "16:9",
                user_id: user.username,
                stage: "journeyMap",
              }
              console.log("=== Sending request to /api/generate-image ===")
              console.log("Request body:", JSON.stringify(requestBody, null, 2))
              
              const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              })
              
              console.log("=== Response received ===")
              console.log("Status:", response.status)
              console.log("Status text:", response.statusText)
              
              if (!response.ok) {
                const errorText = await response.text()
                console.error("Response error:", errorText)
                const errorData = JSON.parse(errorText || "{}")
                setWritingAssessment((prev) =>
                  prev ? { ...prev, mapImageStatus: "error" } : prev
                )
                return
              }
              
              const data = await response.json()
              console.log("Response data:", data)
              
              if (data.error || !data.imageUrl) {
                console.error("Map generation failed:", data.error || "No image URL")
                setWritingAssessment((prev) =>
                  prev ? { ...prev, mapImageStatus: "error" } : prev
                )
                return
              }
              
              console.log("=== Map generated successfully ===")
              console.log("Image URL:", data.imageUrl)
              setWritingAssessment((prev) =>
                prev ? { ...prev, mapImageUrl: data.imageUrl, mapImageStatus: "ready" } : prev
              )
            } catch (error) {
              console.error("=== Error generating journey map ===")
              console.error("Error details:", error)
              if (error instanceof Error) {
                console.error("Error message:", error.message)
                console.error("Error stack:", error.stack)
              }
              setWritingAssessment((prev) =>
                prev ? { ...prev, mapImageStatus: "error" } : prev
              )
            }
          }}
        />
      )}
      {stage === "journeyMap" && user && writingAssessment && journeySelection && (
        <JourneyMap
          language={language}
          type={journeySelection.type}
          mapImageUrl={writingAssessment.mapImageUrl}
          storyState={storyState}
          bookReviewState={bookReviewState}
          letterState={letterState}
          noAi={user.noAi}
          onBack={() => setStage("journeyTicket")}
          onNavigate={(targetStage) => {
            setStage(targetStage as any)
          }}
        />
      )}
      {stage === "writeTypeSelection" && user && (
        <WriteTypeSelection
          language={language}
          onSelectStory={() => setStage("welcome")}
          onSelectBookReview={() => setStage("bookReviewWelcome")}
          onSelectLetter={() => setStage("letterAdventure")}
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
            setStage("bookReviewTypeSelection")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "home")}
        />
      )}
      {stage === "bookReviewTypeSelection" && user && (
        <BookReviewTypeSelection
          language={language}
          onSelectType={(type) => {
            setBookReviewState(prev => ({ ...prev, reviewType: type }))
            if (user.noAi) {
              setStage(journeyActive ? "journeyMap" : "bookSelectionNoAi")
            } else {
              setStage(journeyActive ? "journeyMap" : "bookSelection")
            }
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewWelcome")}
        />
      )}
      {stage === "bookSelection" && user && bookReviewState.reviewType && (
        <BookSelection
          language={language}
          reviewType={bookReviewState.reviewType}
          onBookSelected={(title) => {
            setBookReviewState(prev => ({ ...prev, bookTitle: title }))
            setStage(journeyActive ? "journeyMap" : "bookReviewLoading")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewTypeSelection")}
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
              setStage(journeyActive ? "journeyMap" : "bookReviewWritingNoAi")
            } else {
              setStage(journeyActive ? "journeyMap" : "bookReviewLoading")
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
            setStage(journeyActive ? "journeyMap" : "bookReviewWriting")
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
            setStage(journeyActive ? "journeyMap" : "bookReviewComplete")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookReviewLoading")}
          userId={user.username}
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
            setStage(journeyActive ? "journeyMap" : "bookReviewCompleteNoAi")
          }}
          onBack={() => setStage(journeyActive ? "journeyMap" : "bookSelectionNoAi")}
          userId={user.username}
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
          onReset={() => {
            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            setStage(journeyActive ? "journeyMap" : "home")
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
          onReset={() => {
            setBookReviewState({
              reviewType: null,
              bookTitle: null,
              structure: null,
              review: "",
              bookCoverUrl: undefined,
              bookSummary: undefined,
            })
            setStage(journeyActive ? "journeyMap" : "home")
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
              setStage("journeyMap")
            }}
            onBack={() => setStage("journeyMap")}
          />
        ) : (
          <CharacterCreation
            language={language}
            onCharacterCreate={(character) => {
              setStoryState(prev => ({ ...prev, character }))
              setStage("journeyMap")
            }}
            onBack={() => setStage("journeyMap")}
            userId={user.username}
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
              setStage("journeyMap")
            }}
            onBack={() => setStage("journeyMap")}
            userId={user.username}
          />
        ) : (
          <PlotBrainstorm
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState(prev => ({ ...prev, plot }))
              setStage("journeyMap")
            }}
            onBack={() => setStage("journeyMap")}
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
              setStage(journeyActive ? "journeyMap" : "writing")
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
              setStage(journeyActive ? "journeyMap" : "writing")
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
              setStage(journeyActive ? "journeyMap" : "review")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "structure")}
            userId={user.username}
          />
        ) : (
          <GuidedWriting
            language={language}
            storyState={storyState}
            onStoryWrite={(story) => {
              setStoryState(prev => ({ ...prev, story }))
              setStage(journeyActive ? "journeyMap" : "review")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "structure")}
            userId={user.username}
          />
        )
      )}
      {stage === "review" && user && storyState.story && (
        <StoryReview
          language={language}
          storyState={storyState}
          onReset={() => {
            setStoryState({ character: null, plot: null, structure: null, story: "" })
            setStage(journeyActive ? "journeyMap" : "home")
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
            setStage(journeyActive ? "journeyMap" : "letterGame")
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
              setStage(journeyActive ? "journeyMap" : "letterPuzzle")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "letterAdventure")}
            userId={user.username}
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
              setStage(journeyActive ? "journeyMap" : "letterPuzzle")
            }}
            onBack={() => setStage(journeyActive ? "journeyMap" : "letterAdventure")}
            userId={user.username}
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
            setStage(journeyActive ? "journeyMap" : "letterComplete")
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
          onReset={() => {
            setLetterState({
              recipient: null,
              occasion: null,
              guidance: null,
              readerImageUrl: null,
              sections: [],
              letter: "",
            })
            setStage(journeyActive ? "journeyMap" : "home")
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
    </main>
  )
}
