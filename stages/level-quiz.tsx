"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/app/page"

type FavoriteCategory = "movie" | "book" | "game"

interface LevelQuizProps {
  language: Language
  onComplete: (result: { level: number; favorite: { category: FavoriteCategory; title: string } }) => void
  onBack: () => void
}

const translations = {
  en: {
    title: "Quick Writing Level Quiz",
    subtitle: "Answer a few questions so we can recommend the right level.",
    questions: [
      "How confident are you when starting a new writing task?",
      "How often do you write stories, reviews, or letters?",
      "How comfortable are you with grammar and sentence structure?",
      "How well do you plan before you start writing?",
    ],
    options: ["Not yet", "A little", "Sometimes", "Often", "Very confident"],
    favoriteTitle: "One more question!",
    favoriteLabel: "What's your favorite movie, book, or game?",
    favoritePlaceholder: "Type a title you love...",
    categoryLabel: "Pick one category:",
    categories: {
      movie: "Movie",
      book: "Book",
      game: "Game",
    },
    submit: "See My Level",
    back: "Back",
  },
  zh: {
    title: "快速写作水平测试",
    subtitle: "回答几个问题，我们会推荐合适的写作 Level。",
    questions: [
      "开始写作时，你有多自信？",
      "你多久写一次故事、书评或书信？",
      "你对语法和句子结构有多熟悉？",
      "你写作前会如何规划？",
    ],
    options: ["还不太会", "有一点", "有时", "经常", "非常自信"],
    favoriteTitle: "再一个小问题！",
    favoriteLabel: "你最喜欢的电影、书或游戏是什么？",
    favoritePlaceholder: "写下你喜欢的名称...",
    categoryLabel: "选择类别：",
    categories: {
      movie: "电影",
      book: "书",
      game: "游戏",
    },
    submit: "查看我的 Level",
    back: "返回",
  },
}

const scoreFromOption = (index: number) => index + 1

export default function LevelQuiz({ language, onComplete, onBack }: LevelQuizProps) {
  const t = translations[language] || translations.en
  const [answers, setAnswers] = useState<number[]>(Array(t.questions.length).fill(-1))
  const [favoriteTitle, setFavoriteTitle] = useState("")
  const [favoriteCategory, setFavoriteCategory] = useState<FavoriteCategory>("movie")

  const isComplete = useMemo(() => {
    return answers.every((answer) => answer >= 0) && favoriteTitle.trim().length > 0
  }, [answers, favoriteTitle])

  const level = useMemo(() => {
    const total = answers.reduce((sum, value) => sum + (value >= 0 ? scoreFromOption(value) : 0), 0)
    const average = total / answers.length
    const rounded = Math.round(average)
    return Math.min(5, Math.max(1, rounded || 1))
  }, [answers])

  const handleSubmit = () => {
    if (!isComplete) return
    onComplete({
      level,
      favorite: {
        category: favoriteCategory,
        title: favoriteTitle.trim(),
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900 mb-4">{t.title}</h2>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {t.questions.map((question, qIndex) => (
            <div key={question} className="bg-white/80 rounded-2xl p-6 border border-purple-200 shadow-lg">
              <p className="text-lg font-semibold text-gray-800 mb-4">{question}</p>
              <div className="grid gap-2 md:grid-cols-5">
                {t.options.map((option, index) => {
                  const isSelected = answers[qIndex] === index
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const nextAnswers = [...answers]
                        nextAnswers[qIndex] = index
                        setAnswers(nextAnswers)
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                          : "bg-white border border-purple-200 text-gray-600 hover:border-purple-400"
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="bg-white/90 rounded-2xl p-6 border border-orange-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.favoriteTitle}</h3>
            <label className="block text-gray-700 mb-3">{t.favoriteLabel}</label>
            <input
              value={favoriteTitle}
              onChange={(event) => setFavoriteTitle(event.target.value)}
              placeholder={t.favoritePlaceholder}
              className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">{t.categoryLabel}</p>
              <div className="flex flex-wrap gap-2">
                {(["movie", "book", "game"] as FavoriteCategory[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFavoriteCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      favoriteCategory === category
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                        : "bg-white border border-orange-200 text-gray-600 hover:border-orange-400"
                    }`}
                  >
                    {t.categories[category]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-2 border-gray-300 text-gray-700 bg-white/80 px-8 py-3 rounded-full"
          >
            {t.back}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isComplete}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-10 py-3 rounded-full text-lg font-bold disabled:opacity-50"
          >
            {t.submit}
          </Button>
        </div>
      </div>
    </div>
  )
}
