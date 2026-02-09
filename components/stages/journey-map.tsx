"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { Language, StoryState, BookReviewState, LetterState } from "@/app/page"
import type { JourneyType } from "@/components/stages/journey-ticket"
import Antigravity from "@/components/effects/antigravity"
import ShapeBlur from "@/components/effects/shape-blur"

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
  // 横向排列，5个任务点均匀分布
  const taskCount = 5
  return [
    {
      id: "story-character",
      stage: "character",
      x: (100 / (taskCount + 1)) * 1, // 约16.67%
      y: 50, // 固定在中间高度
      isComplete: hasCharacter,
      isEnabled: true,
      title: "Character",
    },
    {
      id: "story-plot",
      stage: "plot",
      x: (100 / (taskCount + 1)) * 2, // 约33.33%
      y: 50,
      isComplete: hasPlot,
      isEnabled: true,
      title: "Plot",
    },
    {
      id: "story-structure",
      stage: "structure",
      x: (100 / (taskCount + 1)) * 3, // 约50%
      y: 50,
      isComplete: hasStructure,
      isEnabled: true,
      title: "Structure",
    },
    {
      id: "story-writing",
      stage: "writing",
      x: (100 / (taskCount + 1)) * 4, // 约66.67%
      y: 50,
      isComplete: hasStory,
      isEnabled: hasCharacter && hasPlot && hasStructure,
      title: "Writing",
    },
    {
      id: "story-review",
      stage: "review",
      x: (100 / (taskCount + 1)) * 5, // 约83.33%
      y: 50,
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

  // 横向排列，根据是否有AI决定任务点数量
  const taskCount = noAi ? 4 : 5
  const tasks: MapTask[] = [
    {
      id: "review-type",
      stage: "bookReviewTypeSelection",
      x: (100 / (taskCount + 1)) * 1,
      y: 50,
      isComplete: hasType,
      isEnabled: true,
      title: "Review Type",
    },
    {
      id: "review-book",
      stage: noAi ? "bookSelectionNoAi" : "bookSelection",
      x: (100 / (taskCount + 1)) * 2,
      y: 50,
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
            x: (100 / (taskCount + 1)) * 3,
            y: 50,
            isComplete: hasStructure,
            isEnabled: hasType && hasBook,
            title: "Outline",
          } as MapTask,
        ]),
    {
      id: "review-writing",
      stage: writingStage,
      x: (100 / (taskCount + 1)) * (noAi ? 3 : 4),
      y: 50,
      isComplete: hasReview,
      isEnabled: hasType && hasBook && (noAi ? true : hasStructure),
      title: "Writing",
    },
    {
      id: "review-complete",
      stage: completeStage,
      x: (100 / (taskCount + 1)) * (noAi ? 4 : 5),
      y: 50,
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

  // 横向排列，4个任务点均匀分布
  const taskCount = 4
  return [
    {
      id: "letter-start",
      stage: "letterAdventure",
      x: (100 / (taskCount + 1)) * 1, // 约20%
      y: 50,
      isComplete: hasIntro,
      isEnabled: true,
      title: "Letter Adventure",
    },
    {
      id: "letter-game",
      stage: gameStage,
      x: (100 / (taskCount + 1)) * 2, // 约40%
      y: 50,
      isComplete: hasSections,
      isEnabled: hasIntro,
      title: "Letter Game",
    },
    {
      id: "letter-puzzle",
      stage: "letterPuzzle",
      x: (100 / (taskCount + 1)) * 3, // 约60%
      y: 50,
      isComplete: hasLetter,
      isEnabled: hasSections,
      title: "Letter Puzzle",
    },
    {
      id: "letter-complete",
      stage: "letterComplete",
      x: (100 / (taskCount + 1)) * 4, // 约80%
      y: 50,
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
    if (task.isComplete) {
      if (window.confirm("Are you sure you want to restart this task? Your previous progress will be lost.")) {
        onNavigate(task.stage)
      }
    } else {
      onNavigate(task.stage)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 md:pt-28">
      {mapImageUrl ? (
        <img
          src={mapImageUrl}
          alt="Journey Map"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            imageRendering: 'high-quality',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #020617 0%, #020617 35%, #1e293b 70%, #020617 100%)",
          }}
        ></div>
      )}
      <div className="absolute inset-0 opacity-60">
        <Antigravity
          count={300}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#f9f566"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>

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
            <div
              key={task.id}
              className="absolute"
              style={{ left: `${task.x}%`, top: `${task.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                <ShapeBlur
                  className="absolute inset-0"
                  variation={0}
                  shapeSize={1.8}
                  roundness={0.6}
                  borderSize={0.1}
                  circleSize={0.5}
                  circleEdge={0.7}
                />
                <button
                  onClick={() => handleSelect(task)}
                  title={task.title}
                  className={`relative z-10 w-36 h-36 md:w-44 md:h-44 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-2xl transition-all border-2 ${
                    task.isComplete
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 hover:scale-110 border-green-400 ring-4 ring-green-200/50"
                      : task.isEnabled
                      ? "bg-gradient-to-br from-white to-purple-50 hover:scale-110 border-purple-300"
                      : "bg-white/50 cursor-not-allowed border-gray-300"
                  }`}
                >
                  {task.isComplete ? (
                    <CheckCircle2 className="text-green-600" size={48} strokeWidth={2.5} />
                  ) : (
                    <div className="relative">
                      <MapPin className="text-purple-600" size={44} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-purple-200/50 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  <span className={`text-sm md:text-base font-bold tracking-wide ${
                    task.isComplete ? "text-green-700" : "text-purple-700"
                  }`}>
                    {task.title}
                  </span>
                  {task.isComplete && (
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <span className="text-lg">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
