"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 via-orange-50 to-yellow-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: "128px", paddingBottom: "120px" }}>
        {onBack && (
          <div className="mb-6 mt-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="transition-transform duration-200 hover:scale-110 bg-transparent p-0 h-auto w-auto"
              title="Back"
            >
              <img src="/back.png" alt="Back" className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
            </Button>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Start with a Plan
          </h1>
          <p className="text-lg md:text-xl text-gray-600">Let’s check your writing level first.</p>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Question {currentStep + 1} of {QUESTIONS.length}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 md:p-10 border-2 border-purple-200 shadow-2xl">
            {isQuestionStep && currentQuestion ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
                  {currentQuestion.question}
                </h2>
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleAnswer(currentQuestion.id, option.label)}
                      className="w-full text-left bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                          {option.label}
                        </div>
                        <p className="flex-1 text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
                          {option.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
                  Great job finishing the questions!
                </h2>
                <p className="text-center text-gray-600">
                  We will use your answers to pick a good starting level for your writing journey.
                </p>
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:opacity-90 text-white border-0 shadow-2xl py-6 text-xl md:text-2xl font-bold hover:scale-[1.02] transition-all duration-300 rounded-full"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 text-right text-xs text-gray-500">
            Questions are designed based on CEFR writing levels (A2–B2).
          </div>
        </div>
      </div>
    </div>
  )
}
