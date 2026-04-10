/** Luminai Library：文章类型与从「交互记录」形态解析为展示用 Article（供 API 与前端共用） */

export type ArticleType = "story" | "bookReview" | "letter" | "drama" | "poetry"

export interface Article {
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

export function extractArticlesFromInteractions(interactions: any[]): Article[] {
  const articles: Article[] = []

  for (const i of interactions) {
    if (
      i.story &&
      (i.stage === "review" || (typeof i.story === "string" && i.story.trim().length > 0))
    ) {
      const story = typeof i.story === "string" ? i.story : (i.output?.story || "")
      if (story.trim()) {
        articles.push({
          id: `story-${i.user_id}-${i.timestamp}`,
          title: `${i.character?.name || "Unknown"}'s Adventure`,
          author: i.user_id || "Anonymous",
          type: "story",
          content: story,
          timestamp: i.timestamp || Date.now(),
        })
      }
    }

    if (i.review) {
      const hasReview = typeof i.review === "string" && i.review.trim().length > 50
      const isCompleteStage = i.stage === "bookReviewComplete" || i.stage === "bookReviewCompleteNoAi"
      if (hasReview || isCompleteStage) {
        const review =
          typeof i.review === "string" ? i.review : (i.output?.review || i.data?.review || "")
        if (review.trim() && review.length > 50) {
          articles.push({
            id: `review-${i.user_id}-${i.timestamp || Date.now()}`,
            title: `${i.reviewType || i.data?.reviewType || "Book"} Review: ${i.bookTitle || i.data?.bookTitle || "Unknown Book"}`,
            author: i.user_id || "Anonymous",
            type: "bookReview",
            content: review,
            timestamp: i.timestamp || Date.now(),
            bookTitle: i.bookTitle || i.data?.bookTitle,
            coverUrl: i.bookCoverUrl || i.data?.bookCoverUrl,
          })
        }
      }
    }

    if (
      i.letter &&
      (i.stage === "letterComplete" || (typeof i.letter === "string" && i.letter.trim().length > 0))
    ) {
      const letter = typeof i.letter === "string" ? i.letter : (i.output?.letter || "")
      if (letter.trim()) {
        articles.push({
          id: `letter-${i.user_id}-${i.timestamp}`,
          title: `Letter to ${i.recipient || "Someone"}`,
          author: i.user_id || "Anonymous",
          type: "letter",
          content: letter,
          timestamp: i.timestamp || Date.now(),
          recipient: i.recipient,
          occasion: i.occasion,
        })
      }
    }

    if (i.drama && (i.stage === "dramaBook" || (typeof i.drama === "string" && i.drama.trim().length > 0))) {
      const drama = typeof i.drama === "string" ? i.drama : ""
      if (drama.trim()) {
        articles.push({
          id: `drama-${i.user_id}-${i.timestamp}`,
          title: i.dramaTitle || "Untitled Drama",
          author: i.user_id || "Anonymous",
          type: "drama",
          content: drama,
          timestamp: i.timestamp || Date.now(),
          summary: i.dramaSummary,
        })
      }
    }

    if (i.poetry && typeof i.poetry === "string" && i.poetry.trim().length > 0) {
      articles.push({
        id: `poetry-${i.user_id}-${i.timestamp}`,
        title: [i.poetryForm, i.poetryTopic].filter(Boolean).join(" - ") || "Poem",
        author: i.user_id || "Anonymous",
        type: "poetry",
        content: i.poetry,
        timestamp: i.timestamp || Date.now(),
        form: i.poetryForm,
        topic: i.poetryTopic,
      })
    }
  }

  return articles
}

export const EXAMPLE_ARTICLES: Article[] = [
  {
    id: "example-story-1",
    title: "The Dragon's Secret",
    author: "Luna",
    type: "story",
    content: "Once upon a time, in a land far away, there lived a young dragon named Ember...",
    timestamp: Date.now() - 86400000,
  },
  {
    id: "example-review-1",
    title: "Review: Charlotte's Web",
    author: "Max",
    type: "bookReview",
    content: "Charlotte's Web is a wonderful story about friendship...",
    timestamp: Date.now() - 172800000,
    bookTitle: "Charlotte's Web",
  },
  {
    id: "example-letter-1",
    title: "Letter to Grandma",
    author: "Sophie",
    type: "letter",
    content: "Dear Grandma, I hope you are doing well...",
    timestamp: Date.now() - 259200000,
    recipient: "Grandma",
    occasion: "Birthday",
  },
  {
    id: "example-drama-1",
    title: "The Magic Show",
    author: "Oliver",
    type: "drama",
    content:
      "ACT 1, SCENE 1\n[A stage with colorful curtains]\nMAGICIAN: Welcome to the greatest show!",
    timestamp: Date.now() - 345600000,
  },
  {
    id: "example-poetry-1",
    title: "Spring Morning",
    author: "Lily",
    type: "poetry",
    content: "The sun rises bright,\nBirds singing their sweet song,\nSpring has come at last.",
    timestamp: Date.now() - 432000000,
    form: "Haiku",
    topic: "Nature",
  },
]
