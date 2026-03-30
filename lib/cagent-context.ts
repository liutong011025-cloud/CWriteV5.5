/**
 * Build context summary and values-check content for Cagent per stage.
 * Used by app/page.tsx to pass to Cagent and to trigger values API.
 */

export interface StoryState {
  character: { name: string; age: number; traits: string[]; description: string; species?: string } | null
  plot: { setting: string; conflict: string; goal: string } | null
  structure: { type: string; outline: string[] } | null
  story: string
}

export interface BookReviewState {
  reviewType: string | null
  bookTitle: string | null
  structure: { type: string; outline: string[] } | null
  review: string
}

export interface LetterState {
  recipient: string | null
  occasion: string | null
  sections: string[]
  letter: string
}

export function buildContextSummary(
  stage: string,
  payload: {
    storyState?: StoryState
    bookReviewState?: BookReviewState
    letterState?: LetterState
    dramaTitle?: string
    dramaScenesCount?: number
    poetryTopic?: string
    poetryLinesCount?: number
  }
): string {
  const { storyState, bookReviewState, letterState } = payload
  switch (stage) {
    case "character":
      if (!storyState?.character) return "No character yet."
      const c = storyState.character
      return `Character: ${c.name}, ${c.species || "unknown"}, traits: ${(c.traits || []).join(", ")}. ${c.description ? `Background: ${c.description.slice(0, 100)}` : ""}`
    case "plot":
      if (!storyState?.plot) return "No plot yet."
      const p = storyState.plot
      return `Setting: ${p.setting}. Conflict: ${p.conflict}. Goal: ${p.goal}.`
    case "structure":
      if (!storyState?.structure) return "No structure yet."
      return `Structure: ${storyState.structure.type}.`
    case "storyChatbot":
      if (!storyState?.character) return "Story chatbot is ready."
      if (storyState?.story?.trim()) return `Story draft length: ${storyState.story.length} chars.`
      if (storyState?.structure) return `Structure: ${storyState.structure.type}. Writing has started.`
      if (storyState?.plot) return `Plot ready. Setting: ${storyState.plot.setting}.`
      return `Character: ${storyState.character.name}. Plot planning in progress.`
    case "writing":
    case "review":
      if (!storyState?.story) return "Story not started."
      return `Story length: ${storyState.story.length} chars.`
    case "bookSelection":
    case "bookReviewLoading":
      if (!bookReviewState?.bookTitle) return "No book chosen yet."
      return `Book: ${bookReviewState.bookTitle}.`
    case "bookReviewWriting":
    case "bookReviewWritingNoAi":
      if (!bookReviewState?.review) return "Review not started."
      return `Reviewing "${bookReviewState.bookTitle}". Review length: ${bookReviewState.review.length} chars.`
    case "bookReviewComplete":
      return `Completed review of "${bookReviewState?.bookTitle}".`
    case "letterAdventure":
      return "Choosing letter recipient and occasion."
    case "letterGame":
    case "letterPuzzle":
      if (!letterState?.sections?.length) return "Letter sections in progress."
      return `Letter to ${letterState.recipient}, occasion: ${letterState.occasion}.`
    case "letterComplete":
      if (!letterState?.letter) return "Letter not finished."
      return `Letter to ${letterState.recipient} (${letterState.letter.length} chars).`
    case "dramaWriting":
      return `Drama: ${payload.dramaTitle || "Untitled"}, ${payload.dramaScenesCount ?? 0} scenes.`
    case "dramaBook":
      return `Drama book generated.`
    case "poetryForm":
    case "poetryTopic":
      return payload.poetryTopic ? `Poetry topic: ${payload.poetryTopic}.` : "Choosing poetry form/topic."
    case "poetryEditor":
    case "poetryReview":
      return `Poetry: ${payload.poetryLinesCount ?? 0} lines.`
    default:
      return ""
  }
}

/** Content to send for values check per stage. Return empty string to skip check. */
export function buildValuesCheckContent(
  stage: string,
  payload: {
    storyState?: StoryState
    bookReviewState?: BookReviewState
    letterState?: LetterState
    dramaScript?: string
    poetryText?: string
  }
): string {
  const { storyState, bookReviewState, letterState } = payload
  switch (stage) {
    case "character":
      if (!storyState?.character) return ""
      const c = storyState.character
      return [c.name, c.species, (c.traits || []).join(" "), c.description].filter(Boolean).join(" ")
    case "plot":
      if (!storyState?.plot) return ""
      const p = storyState.plot
      return [p.setting, p.conflict, p.goal].filter(Boolean).join(" ")
    case "storyChatbot":
      if (storyState?.story?.trim()) return storyState.story.trim()
      if (storyState?.plot) {
        const p = storyState.plot
        return [p.setting, p.conflict, p.goal].filter(Boolean).join(" ")
      }
      if (storyState?.character) {
        const c = storyState.character
        return [c.name, c.species, (c.traits || []).join(" "), c.description].filter(Boolean).join(" ")
      }
      return ""
    case "writing":
    case "review":
      return storyState?.story?.trim() || ""
    case "bookSelection":
      return bookReviewState?.bookTitle || ""
    case "bookReviewWriting":
    case "bookReviewWritingNoAi":
      return bookReviewState?.review?.trim() || ""
    case "letterGame":
    case "letterPuzzle":
    case "letterComplete":
      return letterState?.letter?.trim() || letterState?.sections?.join(" ") || ""
    case "dramaWriting":
    case "dramaBook":
      return payload.dramaScript?.trim() || ""
    case "poetryEditor":
    case "poetryReview":
      return payload.poetryText?.trim() || ""
    default:
      return ""
  }
}

/** Stages that have writable content to run values check on */
export const VALUES_CHECK_STAGES = [
  "character",
  "plot",
  "storyChatbot",
  "writing",
  "review",
  "bookSelection",
  "bookReviewWriting",
  "bookReviewWritingNoAi",
  "letterGame",
  "letterPuzzle",
  "letterComplete",
  "dramaWriting",
  "dramaBook",
  "poetryEditor",
  "poetryReview",
] as const
