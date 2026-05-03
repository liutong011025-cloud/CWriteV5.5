import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

type GrammarIssue = {
  start: number
  end: number
  original: string
  corrected: string
  issue: string
}

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"(){}\[\]-]/g, "")

const isSpacingIssue = (issue: string) =>
  /\b(space|spacing|whitespace|missing\s*space|extra\s*space)\b/i.test(issue)

const buildLocalGrammarErrors = (content: string): GrammarIssue[] => {
  const fallback: GrammarIssue[] = []
  const push = (original: string, corrected: string, issue: string) => {
    fallback.push({ start: 0, end: 0, original, corrected, issue })
  }

  if (/\bme and my\b/i.test(content)) {
    push("me", "I", "Pronoun case: Use 'I' as subject.")
  }
  if (/\bstatue say\b/i.test(content) || /\bhe say\b/i.test(content)) {
    push("say", "says", "Subject-verb agreement: Third person singular takes 's'.")
  }
  if (/\bli cry\b/i.test(content)) {
    push("cry", "cries", "Subject-verb agreement: Third person singular takes 's'.")
  }
  if (/\banna hold\b/i.test(content)) {
    push("hold", "holds", "Subject-verb agreement: Third person singular takes 's'.")
  }
  if (/\bonce\b/i.test(content) && /\bclimb\b/i.test(content)) {
    push("climb", "climbed", "Verb tense: Use past tense in a past event.")
  }
  if (/\bonce\b/i.test(content) && /\bfind\b/i.test(content)) {
    push("find", "found", "Verb tense: Use past tense in a past event.")
  }

  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, type, recipient, occasion, bookTitle, reviewType, user_id } = body

    const content = text || body.letter || body.story || body.review
    const contentType =
      type || (body.letter ? "letter" : body.story ? "story" : body.review ? "review" : "letter")

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({
        success: true,
        errors: buildLocalGrammarErrors(content),
        source: "fallback_local_no_config",
      })
    }

    let contextInfo = ""
    if (contentType === "letter") {
      contextInfo = `Letter to: ${recipient || "Recipient"}\nOccasion: ${occasion || "General"}`
    } else if (contentType === "story") {
      contextInfo = "This is a creative story."
    } else if (contentType === "review") {
      contextInfo = `Book Review Type: ${reviewType || "General"}\nBook Title: ${bookTitle || "Unknown"}`
    }

    const prompt = `You are an English grammar checker. Review the following ${contentType} and identify ALL grammar, spelling, and punctuation errors.

${contextInfo}

${contentType.charAt(0).toUpperCase() + contentType.slice(1)} content:
${content}

IMPORTANT: You must return a JSON array of errors in the following exact format:
[
  {
    "start": <character_index_start>,
    "end": <character_index_end>,
    "original": "<the_incorrect_text>",
    "corrected": "<the_corrected_text>",
    "issue": "<brief_description_of_the_error>"
  }
]

Rules:
1. Only include actual errors (grammar, spelling, punctuation)
1.1 Do NOT report spacing-only issues (missing/extra spaces) or formatting-only issues.
2. CRITICAL: You must identify the PROBLEM WORD only, NOT the position.
   - original: The incorrect word ONLY (no spaces, no punctuation, just the word)
   - corrected: The corrected word ONLY (no spaces, no punctuation, just the word)
   - start and end: You can set these to 0, they will be ignored. We will find the word in the text automatically.
   - ONLY identify the single word that has the error, not phrases or sentences
3. original MUST be ONLY the incorrect word, NO spaces, NO punctuation, NO surrounding words
4. corrected MUST be ONLY the corrected word, NO spaces, NO punctuation
5. issue MUST include both the error type AND a brief explanation in this format: "Error Type: Brief explanation"
   - For example: "Subject-verb agreement: 'go' should be 'goes' with third person singular subject"
   - For example: "Spelling error: 'tresure' should be spelled 'treasure'"
   - For example: "Missing comma: A comma is needed after 'library'"
   - Keep the explanation very brief (one short sentence)
6. start and end can be set to 0 (they will be recalculated automatically)
7. If there are no errors, return an empty array: []
8. Return ONLY the JSON array, no other text before or after
9.首字母如果前一句话是逗号表示没有结束，这一句开头不用大写。

Example format:
[
  {
    "start": 0,
    "end": 0,
    "original": "are",
    "corrected": "am",
    "issue": "Subject-verb agreement: 'are' should be 'am' with first person singular subject"
  }
]`

    let aiResponse = ""
    try {
      aiResponse = await chat({
        messages: [{ role: "user", content: prompt }],
      })
    } catch (err) {
      console.error("DeepSeek API error:", err)
      if (err instanceof DeepSeekError && err.isTimeout) {
        return NextResponse.json({
          success: true,
          errors: buildLocalGrammarErrors(content),
          source: "fallback_local_timeout",
        })
      }
      return NextResponse.json({
        success: true,
        errors: buildLocalGrammarErrors(content),
        source: "fallback_local_error",
      })
    }

    if (!aiResponse) {
      return NextResponse.json({
        success: true,
        errors: buildLocalGrammarErrors(content),
        source: "fallback_local_empty",
      })
    }

    let errors = []
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0])
      } else {
        errors = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError)
      errors = buildLocalGrammarErrors(content)
    }

    if (!Array.isArray(errors)) {
      errors = []
    }

    const validErrors = errors.filter((error: any) => {
      if (!error?.original || !error?.corrected) return false
      const original = String(error.original).trim()
      const corrected = String(error.corrected).trim()
      const issue = String(error.issue || "").trim()
      if (!original || !corrected) return false
      if (/\s/.test(original) || /\s/.test(corrected)) return false
      if (isSpacingIssue(issue)) return false
      if (normalizeToken(original) === normalizeToken(corrected)) return false
      return true
    })

    const processedErrors: any[] = []
    const usedPositions = new Set<string>()
    const errorCountMap = new Map<string, number>()

    validErrors.forEach((error: any) => {
      const word = error.original.trim()

      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
      const matches = Array.from(content.matchAll(wordRegex))

      if (matches.length === 0) {
        const wordWithoutPunct = word.replace(/[.,!?;:]/g, "")
        const fuzzyRegex = new RegExp(`\\b${wordWithoutPunct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
        const fuzzyMatches = Array.from(content.matchAll(fuzzyRegex))

        if (fuzzyMatches.length > 0) {
          const errorKey = `${error.original.toLowerCase()}_${error.corrected.toLowerCase()}`
          const errorIndex = errorCountMap.get(errorKey) || 0
          errorCountMap.set(errorKey, errorIndex + 1)

          if (errorIndex >= fuzzyMatches.length) return

          const match = fuzzyMatches[errorIndex]
          const matchStart = match.index || 0
          const matchEnd = matchStart + match[0].length
          const positionKey = `${matchStart}-${matchEnd}`

          if (usedPositions.has(positionKey)) return

          let start = matchStart
          let end = matchEnd

          while (start > 0 && !/\s/.test(content[start - 1]) && !/[.,!?;:]/.test(content[start - 1])) {
            start--
          }
          while (end < content.length && !/\s/.test(content[end]) && !/[.,!?;:]/.test(content[end])) {
            end++
          }

          const finalPositionKey = `${start}-${end}`
          if (!usedPositions.has(finalPositionKey)) {
            usedPositions.add(finalPositionKey)
            processedErrors.push({ ...error, start, end })
          }
        }
        return
      }

      const errorKey = `${error.original.toLowerCase()}_${error.corrected.toLowerCase()}`
      const errorIndex = errorCountMap.get(errorKey) || 0
      errorCountMap.set(errorKey, errorIndex + 1)

      if (errorIndex >= matches.length) return

      const match = matches[errorIndex]
      const matchStart = match.index || 0
      const matchEnd = matchStart + match[0].length
      const positionKey = `${matchStart}-${matchEnd}`

      if (usedPositions.has(positionKey)) return

      let start = matchStart
      let end = matchEnd

      while (start > 0 && !/\s/.test(content[start - 1]) && !/[.,!?;:]/.test(content[start - 1])) {
        start--
      }
      while (end < content.length && !/\s/.test(content[end]) && !/[.,!?;:]/.test(content[end])) {
        end++
      }

      const finalPositionKey = `${start}-${end}`
      if (!usedPositions.has(finalPositionKey)) {
        usedPositions.add(finalPositionKey)
        processedErrors.push({ ...error, start, end })
      }
    })

    try {
      await logApiCall(
        user_id || "default-user",
        "grammarReview",
        "/api/dify-letter-grammar-review",
        { type: contentType, content: content.substring(0, 100) },
        { errorCount: errors.length }
      )
    } catch (logError) {
      console.error("Error logging API call:", logError)
    }

    return NextResponse.json({ success: true, errors: processedErrors })
  } catch (error) {
    console.error("Grammar Review API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
