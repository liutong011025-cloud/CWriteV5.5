"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import type { Language } from "@/app/page"

interface PlanTestProps {
  language?: Language
  onComplete?: (result: { score: number; level: number; favoriteTopic: string }) => void
  onBack?: () => void
}

interface TestQuestion {
  id: number
  question: string
  options: { label: string; text: string }[]
  correct: string
}

const QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: "Which sentence best answers the question: \"Who are you and what do you like?\"",
    options: [
      { label: "A", text: "My name is Tom and I like dogs." },
      { label: "B", text: "Tom am name and like dog." },
      { label: "C", text: "Like dogs and Tom is." },
      { label: "D", text: "Dog my like Tom name." },
    ],
    correct: "A",
  },
  {
    id: 2,
    question: "Which set of sentences is the best example of a simple daily routine?",
    options: [
      { label: "A", text: "I eat breakfast. I go to school. I sleep in class." },
      { label: "B", text: "Eat breakfast. Go school. Play games." },
      { label: "C", text: "I eat breakfast. Then I go to school. After school I do my homework." },
      { label: "D", text: "Breakfast I and school go homework." },
    ],
    correct: "C",
  },
  {
    id: 3,
    question: "Which sentence uses a simple linking word correctly?",
    options: [
      { label: "A", text: "I like apples because they are sweet." },
      { label: "B", text: "Because I like apples are sweet." },
      { label: "C", text: "Apples I like because sweet." },
      { label: "D", text: "I like apples they are sweet because." },
    ],
    correct: "A",
  },
  {
    id: 4,
    question: "Which short paragraph best describes a past activity?",
    options: [
      { label: "A", text: "I go to the park tomorrow. I play there every day." },
      {
        label: "B",
        text: "Yesterday I went to the park. I played on the slide and talked with my friend. I was very happy.",
      },
      { label: "C", text: "I am going to the park. I like tomorrow." },
      { label: "D", text: "Go park I and happy am." },
    ],
    correct: "B",
  },
  {
    id: 5,
    question: "Which sentence is the best topic sentence for a short paragraph about a friend?",
    options: [
      { label: "A", text: "My friend Anna is a very kind and funny person." },
      { label: "B", text: "Friend Anna she is kind funny." },
      { label: "C", text: "Kind friend Anna music like." },
      { label: "D", text: "Anna and friend and kind." },
    ],
    correct: "A",
  },
  {
    id: 6,
    question: "Which sentence shows a more complex idea correctly?",
    options: [
      { label: "A", text: "I stayed at home because it was raining." },
      { label: "B", text: "Because it was raining I stayed at home was." },
      { label: "C", text: "I stayed at home it was raining because." },
      { label: "D", text: "I staying home because raining." },
    ],
    correct: "A",
  },
  {
    id: 7,
    question: "Which paragraph best gives an opinion and clear reasons?",
    options: [
      {
        label: "A",
        text: "I think students should read every day because it helps them learn new words and ideas. Reading also makes the imagination stronger.",
      },
      { label: "B", text: "Students read every day. Books good. Reading is fun and good and nice." },
      { label: "C", text: "Read every day students should because books." },
      { label: "D", text: "Students should not read because boring." },
    ],
    correct: "A",
  },
]

const getLevelFromScore = (score: number) => {
  if (score <= 1) return 1
  if (score <= 3) return 2
  if (score <= 5) return 3
  if (score === 6) return 4
  return 5
}

export default function PlanTest({ language = "en", onComplete, onBack }: PlanTestProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const isQuestionStep = currentStep < QUESTIONS.length
  const currentQuestion = QUESTIONS[currentStep]
  const progress = ((currentStep + 0.5) / QUESTIONS.length) * 100
  const answeredCount = Object.keys(answers).length

  const handleAnswer = (questionId: number, label: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: label }))
    setCurrentStep((prev) => Math.min(prev + 1, QUESTIONS.length))
  }

  const handleFinish = () => {
    const score = QUESTIONS.reduce((total, question) => {
      return total + (answers[question.id] === question.correct ? 1 : 0)
    }, 0)
    const level = getLevelFromScore(score)
    onComplete?.({
      score,
      level,
      favoriteTopic: "",
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme">
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(180deg,
            #b8e4f9 0%,
            #87ceeb 26%,
            #7ec850 67%,
            #5a9a32 100%)`,
        }}
      >
        <div className="absolute top-16 left-[10%] h-12 w-24 bg-white opacity-80" style={{ clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)" }} />
        <div className="absolute top-24 right-[15%] h-14 w-32 bg-white opacity-70" style={{ clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)" }} />
        <div className="absolute top-32 left-[40%] h-10 w-20 bg-white opacity-75" style={{ clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)" }} />

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 5 + Math.random() * 2}%`,
                width: "8px",
                height: `${20 + Math.random() * 16}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div key={`flower-${i}`} className="absolute bottom-4" style={{ left: `${10 + i * 11}%` }}>
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  background: ["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4],
                  boxShadow: `3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, -3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 -3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative z-10 min-h-screen px-4 md:px-6 xl:px-12 py-8 md:py-10 xl:py-20 pl-4 md:pl-8 xl:pl-20"
        style={{ paddingTop: "var(--stage-top-padding)", paddingBottom: "var(--stage-bottom-padding)" }}
      >
        {onBack && <BackButton onClick={onBack} variant="purple" />}

        <div className="text-center mb-8">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black mb-4"
            style={{ color: "#8b6914", textShadow: "3px 3px 0 #6b5210, 5px 5px 0 rgba(0,0,0,0.2)" }}
          >
            Writing Level Quest
          </h1>
          <p className="text-lg md:text-xl font-bold" style={{ color: "#5a4a2a" }}>
            Place your first pin, then clear these 7 questions to unlock your journey ticket.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <div className="w-full h-4 overflow-hidden" style={{ background: "#d9c9a6", border: "3px solid #8b6914" }}>
            <div
              className="h-full transition-all duration-300"
              style={{ background: "linear-gradient(90deg, #e8c547 0%, #7ec850 100%)", width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm font-bold" style={{ color: "#5a4a2a" }}>
            <span>{isQuestionStep ? `Question ${currentStep + 1} / ${QUESTIONS.length}` : "Quest Complete"}</span>
            <span>{answeredCount} answered</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="pixel-panel p-8 md:p-10" style={{ background: "linear-gradient(180deg, #f9f1dd 0%, #fff8ea 100%)" }}>
            {isQuestionStep && currentQuestion ? (
              <>
                <div className="mb-6 flex items-center justify-center gap-3">
                  <span className="pixel-btn pixel-btn-wood px-3 py-1 text-xs font-bold">LEVEL CHECK</span>
                  <span className="pixel-btn pixel-btn-blue px-3 py-1 text-xs font-bold">FIRST PIN ONLY</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: "#5a4a2a" }}>
                  {currentQuestion.question}
                </h2>
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleAnswer(currentQuestion.id, option.label)}
                      className="w-full text-left p-5 transition-all duration-200 hover:-translate-y-1"
                      style={{
                        background: "linear-gradient(180deg, #fff 0%, #f5e6c8 100%)",
                        border: "4px solid #8b6914",
                        boxShadow: "4px 4px 0 rgba(0,0,0,0.22)",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            background: "linear-gradient(180deg, #7ec850 0%, #5a9a32 100%)",
                            border: "3px solid #3d8a3d",
                            boxShadow: "2px 2px 0 rgba(0,0,0,0.18)",
                          }}
                        >
                          {option.label}
                        </div>
                        <p className="flex-1 text-lg md:text-xl font-medium leading-relaxed" style={{ color: "#5a4a2a" }}>
                          {option.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-fit pixel-btn pixel-btn-green px-4 py-2 text-sm font-bold">
                  JOURNEY TICKET UNLOCKED
                </div>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#5a4a2a" }}>
                  Great job finishing the questions!
                </h2>
                <p className="font-bold" style={{ color: "#6b5210" }}>
                  We will use your answers to choose a good starting level for your writing journey.
                </p>
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="w-full pixel-btn pixel-btn-green py-6 text-xl md:text-2xl font-bold"
                >
                  Continue to Journey Ticket
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 text-right text-xs font-bold" style={{ color: "#5a4a2a" }}>
            Questions are designed based on CEFR writing levels (A2–B2).
          </div>
        </div>
      </div>
    </div>
  )
}
