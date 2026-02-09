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
    question: "Which sentence is correct?",
    options: [
      { label: "A", text: "He go to school yesterday." },
      { label: "B", text: "He goes to school yesterday." },
      { label: "C", text: "He went to school yesterday." },
      { label: "D", text: "He going to school yesterday." },
    ],
    correct: "C",
  },
  {
    id: 2,
    question: 'Choose the best way to make this sentence better: "I like dog."',
    options: [
      { label: "A", text: "I likes dog." },
      { label: "B", text: "I like dogs." },
      { label: "C", text: "I like the dog very." },
      { label: "D", text: "I am like dog." },
    ],
    correct: "B",
  },
  {
    id: 3,
    question: "Which sentence uses a linking word correctly?",
    options: [
      { label: "A", text: "I eat breakfast. I go to school." },
      { label: "B", text: "I eat breakfast because I go to school." },
      { label: "C", text: "I eat breakfast, and then I go to school." },
      { label: "D", text: "Because I eat breakfast." },
    ],
    correct: "C",
  },
  {
    id: 4,
    question: 'Pick the best sentence to answer: "What will you do this weekend?"',
    options: [
      { label: "A", text: "I go park." },
      { label: "B", text: "I will go to the park." },
      { label: "C", text: "I goed to the park." },
      { label: "D", text: "I going to go park." },
    ],
    correct: "B",
  },
  {
    id: 5,
    question: "Which sentence is the best short paragraph opening?",
    options: [
      { label: "A", text: "My friend name is Anna." },
      { label: "B", text: "My friend Anna likes music." },
      { label: "C", text: "Friend Anna she likes music." },
      { label: "D", text: "Anna is friend and music like." },
    ],
    correct: "B",
  },
  {
    id: 6,
    question: 'Which is the best corrected version of: "She go to shop yesterday."?',
    options: [
      { label: "A", text: "She goes to the shop yesterday." },
      { label: "B", text: "She go to the shop yesterday." },
      { label: "C", text: "She went to the shop yesterday." },
      { label: "D", text: "She gone to shop yesterday." },
    ],
    correct: "C",
  },
  {
    id: 7,
    question: 'Which choice shows the best improvement of this sentence? Original: "I goed to zoo."',
    options: [
      { label: "A", text: "I go to zoo." },
      { label: "B", text: "I going to the zoo." },
      { label: "C", text: "I went to the zoo." },
      { label: "D", text: "I goed to the zoo." },
    ],
    correct: "C",
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
  const [favoriteTopic, setFavoriteTopic] = useState("")

  const isQuestionStep = currentStep < QUESTIONS.length
  const currentQuestion = QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / (QUESTIONS.length + 1)) * 100

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
      favoriteTopic: favoriteTopic.trim(),
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
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold"
            >
              ← Back
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
            Question {Math.min(currentStep + 1, QUESTIONS.length + 1)} of {QUESTIONS.length + 1}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 md:p-10 border-2 border-purple-200 shadow-2xl">
            {isQuestionStep ? (
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
                  Do you have a favorite movie, book, or opera?
                </h2>
                <p className="text-center text-gray-600">Share it in English. We will use it for your journey map.</p>
                <input
                  type="text"
                  value={favoriteTopic}
                  onChange={(event) => setFavoriteTopic(event.target.value)}
                  placeholder="Example: Harry Potter, Spirited Away, The Magic Flute..."
                  className="w-full rounded-2xl border-2 border-purple-200 px-5 py-4 text-lg outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                />
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:opacity-90 text-white border-0 shadow-2xl py-6 text-xl md:text-2xl font-bold hover:scale-[1.02] transition-all duration-300 rounded-full"
                >
                  Finish Test
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
