"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { BookOpen, Book, Mail, FileText, ChevronDown, ChevronRight, ArrowLeft, MessageSquare, Clapperboard, Feather, X } from "lucide-react"
import { toast } from "sonner"

type ArticleType = "story" | "bookReview" | "letter" | "drama" | "poetry"

interface Article {
  id: string
  title: string
  author: string
  type: ArticleType
  content: string
  timestamp: number
  coverUrl?: string
  recipient?: string
  occasion?: string
  bookTitle?: string
  summary?: string
  form?: string
  topic?: string
}

interface GalleryPageProps {
  currentUser?: string | null
  currentUserRole?: "teacher" | "student" | null
  onBack?: () => void
  fromEdit?: boolean
  editType?: 'story' | 'review' | 'letter'
  onBackToEdit?: () => void
}

function workTypeFromArticleType(t: ArticleType): "story" | "bookReview" | "letter" | "drama" | "poetry" {
  if (t === "bookReview") return "bookReview"
  if (t === "letter") return "letter"
  if (t === "drama") return "drama"
  if (t === "poetry") return "poetry"
  return "story"
}

// Pixel book shelf icons for each type
const TYPE_CONFIGS = {
  story: {
    label: "Stories",
    color: "#e8c547",
    borderColor: "#c4a020",
    icon: Book,
    shelfColor: "#8B4513",
    bookColors: ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f39c12"],
  },
  bookReview: {
    label: "Book Reviews",
    color: "#87ceeb",
    borderColor: "#5bc0de",
    icon: FileText,
    shelfColor: "#654321",
    bookColors: ["#1abc9c", "#e67e22", "#34495e", "#16a085", "#d35400"],
  },
  letter: {
    label: "Letters",
    color: "#f5a9b8",
    borderColor: "#e91e63",
    icon: Mail,
    shelfColor: "#5D4037",
    bookColors: ["#ff6b6b", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"],
  },
  drama: {
    label: "Drama",
    color: "#ffd700",
    borderColor: "#daa520",
    icon: Clapperboard,
    shelfColor: "#795548",
    bookColors: ["#ee5a24", "#0652DD", "#6ab04c", "#be2edd", "#22a6b3"],
  },
  poetry: {
    label: "Poetry",
    color: "#7ec850",
    borderColor: "#5a9a32",
    icon: Feather,
    shelfColor: "#6D4C41",
    bookColors: ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff"],
  },
}

export default function GalleryPage({ currentUser = null, currentUserRole = null, fromEdit = false, editType, onBackToEdit }: GalleryPageProps) {
  const [selectedType, setSelectedType] = useState<ArticleType | null>(null)
  const [expandedArticle, setExpandedArticle] = useState<Article | null>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [reviewContent, setReviewContent] = useState<Record<string, string>>({})
  const [reviewSubmitting, setReviewSubmitting] = useState<string | null>(null)
  const [hoveredShelf, setHoveredShelf] = useState<ArticleType | null>(null)

  // Pre-fetch interactions on mount for faster loading
  const fetchInteractions = useCallback(async () => {
    try {
      const response = await fetch('/api/interactions')
      const data = await response.json()
      setInteractions(data.interactions || [])
    } catch (error) {
      console.error("Error fetching interactions:", error)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchInteractions()
    const interval = setInterval(fetchInteractions, 10000) // Reduced frequency
    return () => clearInterval(interval)
  }, [fetchInteractions])

  // Extract articles from interactions
  const extractArticles = useCallback((): Article[] => {
    const articles: Article[] = []

    // Stories
    interactions
      .filter(i => i.story && (i.stage === 'review' || i.story.trim().length > 0))
      .forEach((i) => {
        const story = typeof i.story === 'string' ? i.story : (i.output?.story || '')
        if (story.trim()) {
          articles.push({
            id: `story-${i.user_id}-${i.timestamp}`,
            title: `${i.character?.name || 'Unknown'}'s Adventure`,
            author: i.user_id,
            type: 'story',
            content: story,
            timestamp: i.timestamp,
          })
        }
      })

    // Book Reviews
    interactions
      .filter(i => {
        const hasReview = i.review && (typeof i.review === 'string' ? i.review.trim().length > 0 : false)
        const isCompleteStage = i.stage === 'bookReviewComplete' || i.stage === 'bookReviewCompleteNoAi'
        return hasReview || isCompleteStage
      })
      .forEach((i) => {
        const review = typeof i.review === 'string' ? i.review : (i.output?.review || i.data?.review || '')
        const reviewText = review.trim()
        if (reviewText && reviewText.length > 50) {
          articles.push({
            id: `review-${i.user_id}-${i.timestamp || Date.now()}`,
            title: `${i.reviewType || i.data?.reviewType || 'Book'} Review: ${i.bookTitle || i.data?.bookTitle || 'Unknown Book'}`,
            author: i.user_id,
            type: 'bookReview',
            content: review,
            timestamp: i.timestamp || Date.now(),
            bookTitle: i.bookTitle || i.data?.bookTitle,
            coverUrl: i.bookCoverUrl || i.data?.bookCoverUrl,
          })
        }
      })

    // Letters
    interactions
      .filter(i => i.letter && (i.stage === 'letterComplete' || i.letter.trim().length > 0))
      .forEach((i) => {
        const letter = typeof i.letter === 'string' ? i.letter : (i.output?.letter || '')
        if (letter.trim()) {
          articles.push({
            id: `letter-${i.user_id}-${i.timestamp}`,
            title: `Letter to ${i.recipient || 'Someone'}`,
            author: i.user_id,
            type: 'letter',
            content: letter,
            timestamp: i.timestamp,
            recipient: i.recipient,
            occasion: i.occasion,
          })
        }
      })

    // Drama
    interactions
      .filter(i => i.drama && (i.stage === 'dramaBook' || (typeof i.drama === 'string' && i.drama.trim().length > 0)))
      .forEach((i) => {
        const drama = typeof i.drama === 'string' ? i.drama : ''
        if (drama.trim()) {
          articles.push({
            id: `drama-${i.user_id}-${i.timestamp}`,
            title: i.dramaTitle || 'Untitled Drama',
            author: i.user_id,
            type: 'drama',
            content: drama,
            timestamp: i.timestamp,
            summary: i.dramaSummary,
          })
        }
      })

    // Poetry
    interactions
      .filter(i => i.poetry && (typeof i.poetry === 'string' && i.poetry.trim().length > 0))
      .forEach((i) => {
        const poetry = typeof i.poetry === 'string' ? i.poetry : ''
        if (poetry.trim()) {
          articles.push({
            id: `poetry-${i.user_id}-${i.timestamp}`,
            title: [i.poetryForm, i.poetryTopic].filter(Boolean).join(' — ') || 'Poem',
            author: i.user_id,
            type: 'poetry',
            content: poetry,
            timestamp: i.timestamp,
            form: i.poetryForm,
            topic: i.poetryTopic,
          })
        }
      })

    // Example articles
    const now = mounted ? Date.now() : 1704067200000
    const examples: Article[] = [
      {
        id: 'example-story-1',
        title: "The Brave Little Dragon",
        author: "libraryman",
        type: 'story',
        content: `Once upon a time, there was a little dragon named Sparkle who was afraid of fire. All the other dragons laughed at him because dragons are supposed to breathe fire, but Sparkle couldn't.

One day, Sparkle found a lost kitten in the forest. The kitten was cold and scared. Sparkle wanted to help, but he didn't know how. Suddenly, he felt a warm feeling in his belly. It was his first fire! He breathed a gentle flame to keep the kitten warm.

The other dragons saw how brave Sparkle was and stopped laughing. Sparkle learned that being different is okay, and helping others is what truly makes you brave.`,
        timestamp: now - 86400000,
      },
      {
        id: 'example-review-1',
        title: "Book Review: The Magic Treehouse",
        author: "libraryman",
        type: 'bookReview',
        content: `The Magic Treehouse is an amazing adventure book! Jack and Annie discover a magical treehouse filled with books. When they point to a picture in a book, the treehouse spins and takes them to that place!

I loved reading about their adventures in ancient Egypt and meeting mummies. The book is exciting and teaches you about history too. I recommend this book to kids who love adventure and magic!`,
        timestamp: now - 172800000,
        bookTitle: "The Magic Treehouse",
      },
      {
        id: 'example-letter-1',
        title: "Letter to Grandma",
        author: "libraryman",
        type: 'letter',
        content: `Dear Grandma,

Hello! How are you? I miss you so much!

I'm writing to tell you about my summer vacation. I went to the beach with my family and built the biggest sandcastle ever! We found so many pretty shells.

I hope to see you soon! Thank you for the birthday present you sent me. I love it!

Love,
Emma`,
        timestamp: now - 259200000,
        recipient: "Grandma",
        occasion: "Sharing summer news",
      },
    ]

    return [...articles, ...examples].sort((a, b) => b.timestamp - a.timestamp)
  }, [interactions, mounted])

  const articles = extractArticles()

  const groupedArticles = articles.reduce((acc, article) => {
    if (!acc[article.type]) {
      acc[article.type] = []
    }
    acc[article.type].push(article)
    return acc
  }, {} as Record<ArticleType, Article[]>)

  const formatDate = (timestamp: number) => {
    if (!mounted) return ''
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const submitReview = async (article: Article, role: "teacher" | "student") => {
    if (!currentUser || !reviewContent[article.id]?.trim()) return
    setReviewSubmitting(article.id)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_type: workTypeFromArticleType(article.type),
          work_interaction_id: null,
          author_username: article.author,
          reviewer_username: currentUser,
          reviewer_role: role,
          content: reviewContent[article.id].trim(),
          work_title: article.title,
          work_content: article.content,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit")
      setReviewContent((prev) => ({ ...prev, [article.id]: "" }))
      toast.success("Review submitted!")
    } catch (e: any) {
      toast.error(e.message || "Failed to submit review")
    } finally {
      setReviewSubmitting(null)
    }
  }

  // Render pixel bookshelf for a type
  const renderBookShelf = (type: ArticleType) => {
    const config = TYPE_CONFIGS[type]
    const typeArticles = groupedArticles[type] || []
    const Icon = config.icon
    const isHovered = hoveredShelf === type
    const isSelected = selectedType === type

    return (
      <div
        key={type}
        className="relative cursor-pointer transition-all duration-300"
        style={{
          transform: isHovered ? "scale(1.02) translateY(-4px)" : "scale(1)",
        }}
        onMouseEnter={() => setHoveredShelf(type)}
        onMouseLeave={() => setHoveredShelf(null)}
        onClick={() => setSelectedType(isSelected ? null : type)}
      >
        {/* Bookshelf frame */}
        <div
          className="relative p-4"
          style={{
            background: `linear-gradient(180deg, ${config.shelfColor} 0%, #3d2817 100%)`,
            border: `4px solid ${isSelected ? config.color : "#5a3d1a"}`,
            boxShadow: isSelected 
              ? `0 0 20px ${config.color}60, inset 0 2px 0 rgba(255,255,255,0.1)` 
              : "inset 0 2px 0 rgba(255,255,255,0.1), 4px 4px 0 rgba(0,0,0,0.3)",
          }}
        >
          {/* Shelf label */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="w-6 h-6" style={{ color: config.color }} />
              <span className="font-bold text-lg" style={{ color: config.color, textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                {config.label}
              </span>
            </div>
            <div
              className="px-2 py-1 text-xs font-bold"
              style={{
                background: config.color,
                color: "#3d2817",
                border: `2px solid ${config.borderColor}`,
              }}
            >
              {typeArticles.length}
            </div>
          </div>

          {/* Books on shelf */}
          <div className="flex items-end gap-1 h-24 overflow-hidden">
            {typeArticles.slice(0, 8).map((article, idx) => {
              const bookColor = config.bookColors[idx % config.bookColors.length]
              const height = 60 + Math.random() * 30
              return (
                <div
                  key={article.id}
                  className="relative transition-all duration-200 hover:translate-y-[-4px]"
                  style={{
                    width: "20px",
                    height: `${height}px`,
                    background: `linear-gradient(90deg, ${bookColor} 0%, ${bookColor}dd 50%, ${bookColor}99 100%)`,
                    border: "2px solid rgba(0,0,0,0.3)",
                    borderBottom: "none",
                    boxShadow: "inset -2px 0 0 rgba(0,0,0,0.2)",
                  }}
                  title={article.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedArticle(article)
                  }}
                >
                  {/* Book spine detail */}
                  <div
                    className="absolute top-2 left-1 right-1 h-1"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                  />
                  <div
                    className="absolute bottom-2 left-1 right-1 h-1"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  />
                </div>
              )
            })}
            {typeArticles.length === 0 && (
              <div className="text-sm italic px-2" style={{ color: "#a08060" }}>
                Empty shelf...
              </div>
            )}
            {typeArticles.length > 8 && (
              <div
                className="px-2 py-1 text-xs font-bold self-center"
                style={{ color: config.color }}
              >
                +{typeArticles.length - 8}
              </div>
            )}
          </div>

          {/* Shelf wood bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{
              background: `linear-gradient(180deg, #5a3d1a 0%, #3d2817 100%)`,
              borderTop: "2px solid #7a5d3a",
            }}
          />
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-bold whitespace-nowrap z-20"
            style={{
              background: "#f5e6c8",
              border: "3px solid #8b6914",
              color: "#5a4a2a",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
            }}
          >
            Click to browse {config.label.toLowerCase()}!
          </div>
        )}
      </div>
    )
  }

  // Article list panel
  const renderArticleList = () => {
    if (!selectedType) return null
    const config = TYPE_CONFIGS[selectedType]
    const typeArticles = groupedArticles[selectedType] || []

    return (
      <div
        className="pixel-panel p-6 mt-6"
        style={{ background: "#f5e6c8" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-extrabold flex items-center gap-3" style={{ color: "#5a4a2a", textShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}>
            <config.icon className="w-7 h-7" style={{ color: config.borderColor }} />
            {config.label}
          </h3>
          <Button
            onClick={() => setSelectedType(null)}
            className="pixel-btn pixel-btn-wood"
          >
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {typeArticles.length > 0 ? (
            typeArticles.map((article) => (
              <div
                key={article.id}
                className="p-4 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: "#fff",
                  border: `3px solid ${config.borderColor}`,
                  boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                }}
                onClick={() => setExpandedArticle(article)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: "#5a4a2a" }}>
                      {article.title}
                    </h4>
                    <p className="text-sm" style={{ color: "#8b6914" }}>
                      by {article.author} | {formatDate(article.timestamp)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: config.borderColor }} />
                </div>
                <p className="mt-2 text-sm line-clamp-2" style={{ color: "#6b5210" }}>
                  {article.content.slice(0, 150)}...
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8" style={{ color: "#8b6914" }}>
              No {config.label.toLowerCase()} yet. Be the first to write one!
            </div>
          )}
        </div>
      </div>
    )
  }

  // Article detail modal
  const renderArticleModal = () => {
    if (!expandedArticle) return null
    const config = TYPE_CONFIGS[expandedArticle.type]

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={() => setExpandedArticle(null)}
      >
        <div
          className="pixel-panel max-w-3xl w-full max-h-[80vh] overflow-y-auto"
          style={{ background: "#f5e6c8" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between"
            style={{
              background: `linear-gradient(180deg, ${config.color} 0%, ${config.borderColor} 100%)`,
              borderBottom: "4px solid #8b6914",
            }}
          >
            <div className="flex items-center gap-3">
              <config.icon className="w-6 h-6" style={{ color: "#5a4a2a" }} />
              <span className="font-bold text-sm px-2 py-1" style={{
                background: "#f5e6c8",
                border: "2px solid #8b6914",
                color: "#5a4a2a",
              }}>
                {config.label}
              </span>
            </div>
            <Button
              onClick={() => setExpandedArticle(null)}
              className="pixel-btn pixel-btn-wood"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#5a4a2a", textShadow: "2px 2px 0 rgba(0,0,0,0.15)" }}>
              {expandedArticle.title}
            </h2>
            <p className="text-sm mb-4" style={{ color: "#8b6914" }}>
              by {expandedArticle.author} | {formatDate(expandedArticle.timestamp)}
            </p>

            {expandedArticle.coverUrl && (
              <div className="relative w-32 h-48 mx-auto mb-4" style={{ border: "4px solid #8b6914" }}>
                <Image
                  src={expandedArticle.coverUrl}
                  alt={expandedArticle.bookTitle || "Book cover"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div
              className="p-4 mb-4"
              style={{
                background: "#fff",
                border: "3px solid #8b6914",
                boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.1)",
              }}
            >
              <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#5a4a2a", fontFamily: "inherit" }}>
                {expandedArticle.content}
              </pre>
            </div>

            {/* Review section */}
            {currentUser && (
              <div
                className="p-4"
                style={{
                  background: "#d4e8b4",
                  border: "3px solid #5a9a32",
                }}
              >
                <p className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: "#3d5a1f" }}>
                  <MessageSquare className="w-4 h-4" />
                  Leave a review
                </p>
                <textarea
                  placeholder="Write your feedback..."
                  value={reviewContent[expandedArticle.id] ?? ""}
                  onChange={(e) => setReviewContent((prev) => ({ ...prev, [expandedArticle.id]: e.target.value }))}
                  className="w-full p-3 text-sm pixel-input mb-2"
                  rows={3}
                />
                <Button
                  onClick={() => submitReview(expandedArticle, currentUserRole || "student")}
                  disabled={!reviewContent[expandedArticle.id]?.trim() || reviewSubmitting === expandedArticle.id}
                  className="pixel-btn pixel-btn-green"
                >
                  {reviewSubmitting === expandedArticle.id ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden pixel-theme" data-stage="gallery">
      {/* Pixel art background - cozy library */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #2d1b0e 0%, 
          #3d2817 20%,
          #4a3423 50%,
          #5a4030 80%,
          #6a503d 100%)`
      }}>
        {/* Wooden floor pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{
          background: "repeating-linear-gradient(90deg, #5a3d1a 0px, #5a3d1a 80px, #4a2d10 80px, #4a2d10 160px)",
          borderTop: "4px solid #3d2010",
        }} />
        
        {/* Floating candles/lights */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`candle-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 2) * 8}%`,
              width: "12px",
              height: "20px",
              background: "#ffd700",
              boxShadow: "0 0 20px #ffd700, 0 0 40px #ff8c00",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        {/* Decorative pixel stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 3) * 5}%`,
              width: "8px",
              height: "8px",
              background: "#ffd700",
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Back to Edit button */}
      {fromEdit && onBackToEdit && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={onBackToEdit}
            className="pixel-btn pixel-btn-orange"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Editing
          </Button>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        {/* Header */}
        <div className="pixel-panel p-6 mb-8" style={{ background: "#f5e6c8" }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Librarian image */}
            <div
              className="relative w-40 h-40 flex-shrink-0 overflow-hidden"
              style={{ border: "4px solid #8b6914", background: "#d9c9a6" }}
            >
              <Image
                src="/libraryMan.png"
                alt="Luminai Librarian"
                fill
                className="object-cover scale-110"
                unoptimized
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1
                className="text-4xl md:text-5xl font-extrabold mb-2"
                style={{
                  color: "#5a4a2a",
                  textShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                }}
              >
                Luminai Library
              </h1>
              <p className="text-lg" style={{ color: "#6b5210" }}>
                Welcome, young writer! Browse the magical bookshelves and discover stories, reviews, letters, drama, and poetry from fellow authors.
              </p>
            </div>

            {/* Pixel coins decoration */}
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 animate-bounce"
                  style={{
                    background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
                    border: "3px solid #cc8800",
                    borderRadius: "50%",
                    boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.2)",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bookshelves grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {(Object.keys(TYPE_CONFIGS) as ArticleType[]).map(renderBookShelf)}
        </div>

        {/* Article list */}
        {renderArticleList()}

        {/* Stats bar */}
        <div
          className="mt-8 p-4 flex items-center justify-center gap-8 flex-wrap"
          style={{
            background: "#3d2817",
            border: "4px solid #5a3d1a",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#7ec850", border: "2px solid #5a9a32" }} />
            <span className="font-bold" style={{ color: "#e8c547" }}>
              Total Works: {articles.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#87ceeb", border: "2px solid #5bc0de" }} />
            <span className="font-bold" style={{ color: "#87ceeb" }}>
              Authors: {new Set(articles.map(a => a.author)).size}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#ffd700", border: "2px solid #cc8800" }} />
            <span className="font-bold" style={{ color: "#ffd700" }}>
              Categories: 5
            </span>
          </div>
        </div>
      </div>

      {/* Article modal */}
      {renderArticleModal()}

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
