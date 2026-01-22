"use client"

import { useState, useEffect } from "react"
import HomePage from "@/components/stages/home-page"
import LandingPage from "@/components/stages/landing-page"
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
import PlanQuiz from "@/components/stages/plan-quiz"
import PlanResult from "@/components/stages/plan-result"
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
import LevelQuiz from "@/components/stages/level-quiz"
import WritingTicket from "@/components/stages/writing-ticket"
import WritingMap, { MapStep } from "@/components/stages/writing-map"

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

export default function Home() {
  const [user, setUser] = useState<{ username: string; role: 'teacher' | 'student'; noAi?: boolean } | null>(null)
  const [stage, setStage] = useState<"login" | "home" | "cwrite" | "levelQuiz" | "ticket" | "map" | "plan" | "planResult" | "writeTypeSelection" | "bookReviewWelcome" | "bookReviewTypeSelection" | "bookSelection" | "bookSelectionNoAi" | "bookReviewLoading" | "bookReviewWriting" | "bookReviewComplete" | "bookReviewWritingNoAi" | "bookReviewCompleteNoAi" | "letterAdventure" | "letterGame" | "letterPuzzle" | "letterComplete" | "welcome" | "character" | "plot" | "structure" | "writing" | "review" | "dashboard" | "about" | "gallery" | "storyEdit" | "bookReviewEdit" | "letterEdit">("login")
  const [language, setLanguage] = useState<Language>("en")
  const [flowMode, setFlowMode] = useState<"classic" | "map">("classic")
  const [planRecommendation, setPlanRecommendation] = useState<{
    type: "Story" | "Book Review" | "Letter"
    goal: string
    tips: string[]
    startPrompt: string
    skills?: string[]
    length?: string
    structure?: string[]
  } | null>(null)
  const [storyState, setStoryState] = useState<StoryState>({
    character: null,
    plot: null,
    structure: null,
    story: "",
  })
  const [bookReviewState, setBookReviewState] = useState<{
    reviewType: "recommendation" | "critical" | "literary" | null
    bookTitle: string | null
    structure: {
      type: "recommendation" | "critical" | "literary"
      outline: string[]
    } | null
    review: string
    bookCoverUrl?: string
    bookSummary?: string
  }>({
    reviewType: null,
    bookTitle: null,
    structure: null,
    review: "",
    bookCoverUrl: undefined,
    bookSummary: undefined,
  })

  const [letterState, setLetterState] = useState<{
    recipient: string | null
    occasion: string | null
    guidance: string | null
    readerImageUrl: string | null
    sections: string[]
    letter: string
  }>({
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
  const [assessedLevel, setAssessedLevel] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [favoriteTopic, setFavoriteTopic] = useState<{ category: "movie" | "book" | "game"; title: string } | null>(null)
  const [selectedWriteType, setSelectedWriteType] = useState<"story" | "bookReview" | "letter" | null>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)

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
        setFlowMode("classic")
        setStage("writeTypeSelection")
      }
    }
    
    const handleNavigateToHome = () => {
      setFlowMode("classic")
      setStage("home")
    }

    const handleNavigateToCwrite = () => {
      setFlowMode("classic")
      setStage("cwrite")
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
    window.addEventListener('navigateToCwrite', handleNavigateToCwrite as EventListener)
    window.addEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
    window.addEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
    window.addEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('navigateToWriteTypeSelection', handleNavigateToWriteTypeSelection as EventListener)
      window.removeEventListener('navigateToHome', handleNavigateToHome as EventListener)
      window.removeEventListener('navigateToCwrite', handleNavigateToCwrite as EventListener)
      window.removeEventListener('navigateToAbout', handleNavigateToAbout as EventListener)
      window.removeEventListener('navigateToGallery', handleNavigateToGallery as EventListener)
      window.removeEventListener('headerLanguageChange', handleLanguageChange as EventListener)
    }
  }, [user])

  if (!isReady) {
    return null
  }

  const mapSteps: MapStep[] = (() => {
    const isNoAi = !!user?.noAi
    if (!selectedWriteType) return []
    if (selectedWriteType === "story") {
      const hasCharacter = !!storyState.character
      const hasPlot = !!storyState.plot
      const hasStructure = !!storyState.structure
      const hasStory = !!storyState.story
      return [
        { id: "character", label: "Character", stage: "character", status: hasCharacter ? "done" : "available" },
        { id: "plot", label: "Plot", stage: "plot", status: hasPlot ? "done" : hasCharacter ? "available" : "locked" },
        { id: "structure", label: "Structure", stage: "structure", status: hasStructure ? "done" : hasPlot ? "available" : "locked" },
        { id: "writing", label: "Writing", stage: "writing", status: hasStory ? "done" : hasStructure ? "available" : "locked" },
        { id: "review", label: "Review", stage: "review", status: hasStory ? "available" : "locked" },
      ]
    }
    if (selectedWriteType === "bookReview") {
      const hasType = !!bookReviewState.reviewType
      const hasBook = !!bookReviewState.bookTitle
      const hasStructure = !!bookReviewState.structure
      const hasReview = !!bookReviewState.review
      const bookStage = isNoAi ? "bookSelectionNoAi" : "bookSelection"
      const writeStage = isNoAi ? "bookReviewWritingNoAi" : "bookReviewWriting"
      const completeStage = isNoAi ? "bookReviewCompleteNoAi" : "bookReviewComplete"
      return [
        { id: "reviewType", label: "Type", stage: "bookReviewTypeSelection", status: hasType ? "done" : "available" },
        { id: "book", label: "Book", stage: bookStage, status: hasBook ? "done" : hasType ? "available" : "locked" },
        { id: "write", label: "Writing", stage: writeStage, status: hasReview ? "done" : hasStructure ? "available" : "locked" },
        { id: "complete", label: "Complete", stage: completeStage, status: hasReview ? "available" : "locked" },
      ]
    }
    const hasAdventure = !!letterState.recipient && !!letterState.occasion
    const hasSections = letterState.sections.length > 0
    const hasLetter = !!letterState.letter
    return [
      { id: "setup", label: "Setup", stage: "letterAdventure", status: hasAdventure ? "done" : "available" },
      { id: "game", label: "Game", stage: "letterGame", status: hasSections ? "done" : hasAdventure ? "available" : "locked" },
      { id: "puzzle", label: "Puzzle", stage: "letterPuzzle", status: hasLetter ? "done" : hasSections ? "available" : "locked" },
      { id: "complete", label: "Complete", stage: "letterComplete", status: hasLetter ? "available" : "locked" },
    ]
  })()

  return (
    <main className="min-h-screen" data-stage={stage}>
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
        <LandingPage
          language={language}
          onStartQuiz={() => {
            setFlowMode("map")
            setAssessedLevel(null)
            setSelectedLevel(null)
            setFavoriteTopic(null)
            setSelectedWriteType(null)
            setMapImageUrl(null)
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
            setStage("levelQuiz")
          }}
        />
      )}
      {stage === "cwrite" && user && (
        <HomePage
          language={language}
          user={user}
          onStartStory={() => {
            setFlowMode("classic")
            setStage("welcome")
          }}
          onStartBookReview={() => {
            setFlowMode("classic")
            setStage("bookReviewWelcome")
          }}
          onStartLetter={() => {
            setFlowMode("classic")
            setStage("letterAdventure")
          }}
          onStartPlan={() => {
            setFlowMode("classic")
            setStage("plan")
          }}
          onStartWrite={() => {
            setFlowMode("classic")
            setStage("writeTypeSelection")
          }}
          onViewAbout={() => setStage("about")}
        />
      )}
      {stage === "levelQuiz" && user && (
        <LevelQuiz
          language={language}
          onComplete={({ level, favorite }) => {
            setAssessedLevel(level)
            setSelectedLevel(level)
            setFavoriteTopic(favorite)
            setStage("ticket")
          }}
          onBack={() => setStage("home")}
        />
      )}
      {stage === "ticket" && user && assessedLevel !== null && favoriteTopic && (
        <WritingTicket
          language={language}
          recommendedLevel={assessedLevel}
          onContinue={({ type, level }) => {
            setSelectedWriteType(type)
            setSelectedLevel(level)
            setMapImageUrl(null)
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
            } else {
              setLetterState({
                recipient: null,
                occasion: null,
                guidance: null,
                readerImageUrl: null,
                sections: [],
                letter: "",
              })
            }
            setStage("map")
          }}
          onBack={() => setStage("levelQuiz")}
        />
      )}
      {stage === "map" && user && selectedWriteType && selectedLevel && favoriteTopic && (
        <WritingMap
          language={language}
          writeType={selectedWriteType}
          level={selectedLevel}
          favorite={favoriteTopic}
          steps={mapSteps}
          mapImageUrl={mapImageUrl}
          onGenerateImage={(url) => setMapImageUrl(url)}
          onSelectStage={(nextStage) => setStage(nextStage as any)}
          onBack={() => setStage("ticket")}
          userId={user.username}
        />
      )}
      {stage === "plan" && user && (
        <PlanQuiz
          language={language}
          onComplete={(recommendation) => {
            setPlanRecommendation(recommendation)
            setStage("planResult")
          }}
          onBack={() => setStage("cwrite")}
        />
      )}
      {stage === "planResult" && user && planRecommendation && (
        <PlanResult
          language={language}
          recommendation={planRecommendation}
          onStart={() => {
            if (planRecommendation.type === "Story") {
              setStage("welcome")
            } else if (planRecommendation.type === "Book Review") {
              setStage("bookReviewWelcome")
            } else if (planRecommendation.type === "Letter") {
              setStage("letterAdventure")
            }
          }}
          onBack={() => setStage("plan")}
        />
      )}
      {stage === "writeTypeSelection" && user && (
        <WriteTypeSelection
          language={language}
          onSelectStory={() => setStage("welcome")}
          onSelectBookReview={() => setStage("bookReviewWelcome")}
          onSelectLetter={() => setStage("letterAdventure")}
          onBack={() => setStage("cwrite")}
        />
      )}
      {stage === "bookReviewWelcome" && user && (
        <BookReviewWelcome
          language={language}
          onStartBookReview={() => {
            setBookReviewState({ reviewType: null, bookTitle: null })
            setStage("bookReviewTypeSelection")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "cwrite")}
        />
      )}
      {stage === "bookReviewTypeSelection" && user && (
        <BookReviewTypeSelection
          language={language}
          onSelectType={(type) => {
            setBookReviewState(prev => ({ ...prev, reviewType: type }))
            if (user.noAi) {
              setStage("bookSelectionNoAi")
            } else {
              setStage("bookSelection")
            }
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "bookReviewWelcome")}
        />
      )}
      {stage === "bookSelection" && user && bookReviewState.reviewType && (
        <BookSelection
          language={language}
          reviewType={bookReviewState.reviewType}
          onBookSelected={(title) => {
            setBookReviewState(prev => ({ ...prev, bookTitle: title }))
            setStage("bookReviewLoading")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "bookReviewTypeSelection")}
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
          onBack={() => setStage(flowMode === "map" ? "map" : "bookReviewTypeSelection")}
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
          onBack={() => setStage(flowMode === "map" ? "map" : "bookSelection")}
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
          onBack={() => setStage(flowMode === "map" ? "map" : "bookReviewLoading")}
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
            setStage("bookReviewCompleteNoAi")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "bookSelectionNoAi")}
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
            setStage("home")
          }}
          onBack={async () => {
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
            setStage(flowMode === "map" ? "map" : "bookReviewWriting")
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
            setStage("home")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "bookReviewWritingNoAi")}
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
          onBack={() => setStage(flowMode === "map" ? "map" : "cwrite")}
          userId={user.username}
        />
      )}
      {stage === "character" && user && (
        user.noAi ? (
          <CharacterCreationNoAi
            language={language}
            onCharacterCreate={(character) => {
              setStoryState(prev => ({ ...prev, character }))
              setStage("plot")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "welcome")}
          />
        ) : (
          <CharacterCreation
            language={language}
            onCharacterCreate={(character) => {
              setStoryState(prev => ({ ...prev, character }))
              setStage("plot")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "welcome")}
            userId={user.username}
          />
        )
      )}
      {stage === "plot" && user && storyState.character && (
        user.noAi ? (
          <PlotBrainstormNoAi
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState(prev => ({ ...prev, plot }))
              setStage("structure")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "character")}
            userId={user.username}
          />
        ) : (
          <PlotBrainstorm
            language={language}
            character={storyState.character}
            onPlotCreate={(plot) => {
              setStoryState(prev => ({ ...prev, plot }))
              setStage("structure")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "character")}
            userId={user.username}
          />
        )
      )}
      {stage === "structure" && user && storyState.plot && storyState.character && (
        user.noAi ? (
          <StoryStructureNoAi
            language={language}
            character={storyState.character}
            plot={storyState.plot}
            onStructureSelect={(structure) => {
              setStoryState(prev => ({ ...prev, structure }))
              setStage("writing")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "plot")}
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
            onBack={() => setStage(flowMode === "map" ? "map" : "plot")}
            userId={user.username}
          />
        )
      )}
      {stage === "writing" && user && storyState.structure && (
        user.noAi ? (
          <GuidedWritingNoAi
            language={language}
            storyState={storyState}
            onStoryWrite={(story) => {
              setStoryState(prev => ({ ...prev, story }))
              setStage("review")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "structure")}
            userId={user.username}
          />
        ) : (
          <GuidedWriting
            language={language}
            storyState={storyState}
            onStoryWrite={(story) => {
              setStoryState(prev => ({ ...prev, story }))
              setStage("review")
            }}
            onBack={() => setStage(flowMode === "map" ? "map" : "structure")}
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
            setStage("home")
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
          onBack={() => setStage(flowMode === "map" ? "map" : "writing")}
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
            setStage("letterGame")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "writeTypeSelection")}
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
          onBack={() => setStage(flowMode === "map" ? "map" : "letterAdventure")}
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
              setStage("letterPuzzle")
            }}
          onBack={() => setStage(flowMode === "map" ? "map" : "letterAdventure")}
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
            setStage("letterComplete")
          }}
          onBack={() => setStage(flowMode === "map" ? "map" : "letterGame")}
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
            setStage("home")
          }}
          onBack={async () => {
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
            setStage(flowMode === "map" ? "map" : "letterPuzzle")
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
          onBack={() => setStage("review")}
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
          onBack={() => setStage("bookReviewComplete")}
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
          onBack={() => setStage("letterComplete")}
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
