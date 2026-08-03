/** Shared app types formerly exported from app/page.tsx */

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

export type MapWorkType = "story" | "review" | "letter" | "drama" | "poetry"

export interface MapFlagItem {
  id: string
  x: number
  y: number
  title: string
  content?: string
  workType?: MapWorkType
}

export type TreeGrowthDetail = {
  workTitle: string
  workType: "story" | "review" | "letter" | string
  excerpt: string
  triggerSentence?: string
  overallEvidence?: string
  reason?: string
  timestamp: number
}
