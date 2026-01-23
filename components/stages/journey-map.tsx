"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"
import { toast } from "sonner"
import type { Language, StoryState, BookReviewState, LetterState } from "@/app/page"
import type { JourneyType } from "@/components/stages/journey-ticket"

interface JourneyMapProps {
  language?: Language
  type: JourneyType
  mapImageUrl?: string
  storyState: StoryState
  bookReviewState: BookReviewState
  letterState: LetterState
  noAi?: boolean
  onNavigate: (stage: string) => void
  onBack?: () => void
}

interface MapTask {
  id: string
  stage: string
  x: number
  y: number
  isComplete: boolean
  isEnabled: boolean
  title: string
}

const buildStoryTasks = (storyState: StoryState): MapTask[] => {
  const hasCharacter = !!storyState.character
  const hasPlot = !!storyState.plot
  const hasStructure = !!storyState.structure
  const hasStory = !!storyState.story
  return [
    {
      id: "story-character",
      stage: "character",
      x: 20,
      y: 30,
      isComplete: hasCharacter,
      isEnabled: true,
      title: "Character",
    },
    {
      id: "story-plot",
      stage: "plot",
      x: 50,
      y: 20,
      isComplete: hasPlot,
      isEnabled: true,
      title: "Plot",
    },
    {
      id: "story-structure",
      stage: "structure",
      x: 72,
      y: 40,
      isComplete: hasStructure,
      isEnabled: true,
      title: "Structure",
    },
    {
      id: "story-writing",
      stage: "writing",
      x: 35,
      y: 60,
      isComplete: hasStory,
      isEnabled: hasCharacter && hasPlot && hasStructure,
      title: "Writing",
    },
    {
      id: "story-review",
      stage: "review",
      x: 70,
      y: 70,
      isComplete: hasStory,
      isEnabled: hasStory,
      title: "Review",
    },
  ]
}

const buildBookReviewTasks = (bookReviewState: BookReviewState, noAi?: boolean): MapTask[] => {
  const hasType = !!bookReviewState.reviewType
  const hasBook = !!bookReviewState.bookTitle
  const hasStructure = !!bookReviewState.structure
  const hasReview = !!bookReviewState.review
  const writingStage = noAi ? "bookReviewWritingNoAi" : "bookReviewWriting"
  const completeStage = noAi ? "bookReviewCompleteNoAi" : "bookReviewComplete"

  const tasks: MapTask[] = [
    {
      id: "review-type",
      stage: "bookReviewTypeSelection",
      x: 18,
      y: 28,
      isComplete: hasType,
      isEnabled: true,
      title: "Review Type",
    },
    {
      id: "review-book",
      stage: noAi ? "bookSelectionNoAi" : "bookSelection",
      x: 48,
      y: 18,
      isComplete: hasBook,
      isEnabled: hasType,
      title: "Book Selection",
    },
    ...(noAi
      ? []
      : [
          {
            id: "review-outline",
            stage: "bookReviewLoading",
            x: 74,
            y: 34,
            isComplete: hasStructure,
            isEnabled: hasType && hasBook,
            title: "Outline",
          } as MapTask,
        ]),
    {
      id: "review-writing",
      stage: writingStage,
      x: 34,
      y: 60,
      isComplete: hasReview,
      isEnabled: hasType && hasBook && hasStructure,
      title: "Writing",
    },
    {
      id: "review-complete",
      stage: completeStage,
      x: 70,
      y: 70,
      isComplete: hasReview,
      isEnabled: hasReview,
      title: "Complete",
    },
  ]

  return tasks
}

const buildLetterTasks = (letterState: LetterState, noAi?: boolean): MapTask[] => {
  const hasIntro = !!letterState.recipient && !!letterState.occasion
  const hasSections = letterState.sections.length > 0
  const hasLetter = !!letterState.letter
  const gameStage = "letterGame"

  return [
    {
      id: "letter-start",
      stage: "letterAdventure",
      x: 20,
      y: 28,
      isComplete: hasIntro,
      isEnabled: true,
      title: "Letter Adventure",
    },
    {
      id: "letter-game",
      stage: gameStage,
      x: 50,
      y: 20,
      isComplete: hasSections,
      isEnabled: hasIntro,
      title: "Letter Game",
    },
    {
      id: "letter-puzzle",
      stage: "letterPuzzle",
      x: 72,
      y: 40,
      isComplete: hasLetter,
      isEnabled: hasSections,
      title: "Letter Puzzle",
    },
    {
      id: "letter-complete",
      stage: "letterComplete",
      x: 55,
      y: 68,
      isComplete: hasLetter,
      isEnabled: hasLetter,
      title: "Letter Complete",
    },
  ]
}

const buildComingSoonTasks = (): MapTask[] => [
  {
    id: "coming-soon",
    stage: "",
    x: 50,
    y: 50,
    isComplete: false,
    isEnabled: false,
    title: "Coming Soon",
  },
]

export default function JourneyMap({
  language = "en",
  type,
  mapImageUrl,
  storyState,
  bookReviewState,
  letterState,
  noAi,
  onNavigate,
  onBack,
}: JourneyMapProps) {
  const getTasks = (): MapTask[] => {
    if (type === "story") return buildStoryTasks(storyState)
    if (type === "bookReview") return buildBookReviewTasks(bookReviewState, noAi)
    if (type === "letter") return buildLetterTasks(letterState, noAi)
    return buildComingSoonTasks()
  }

  const tasks = getTasks()

  const handleSelect = (task: MapTask) => {
    if (!task.isEnabled || !task.stage) {
      toast.info("这个任务暂时不能打开。")
      return
    }
    onNavigate(task.stage)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: mapImageUrl
            ? `url(${mapImageUrl})`
            : "linear-gradient(135deg, #f3e8ff 0%, #fde2e2 50%, #fef9c3 100%)",
        }}
      ></div>
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-10 min-h-screen">
        <div className="p-6">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-2 border-gray-200 hover:bg-gray-50 text-gray-700 shadow-lg w-12 h-12 p-0"
              title="Back"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
        </div>

        <div className="relative w-full h-[calc(100vh-120px)]">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelect(task)}
              title={task.title}
              className={`absolute flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all ${
                task.isEnabled
                  ? "bg-white/90 hover:scale-110"
                  : "bg-white/50 cursor-not-allowed"
              }`}
              style={{ left: `${task.x}%`, top: `${task.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <MapPin
                className={`${task.isComplete ? "text-green-600" : "text-purple-600"}`}
                size={28}
              />
              {task.isComplete && (
                <span className="absolute -top-2 -right-1 text-xs bg-green-500 text-white rounded-full px-1">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
