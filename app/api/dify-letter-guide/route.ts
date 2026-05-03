import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import {
  GOOD_ENOUGH_CODE,
  buildPassPromptRule,
  detectPassSignal,
  evaluateLetterWriting,
  finalizeEvaluationMessage,
} from "@/lib/cagent-writing-rubric"

function isGibberishOrMeaningless(text: string): boolean {
  if (!text || text.trim().length < 3) return false

  const trimmed = text.trim()
  const repeatedCharPattern = /(.)\1{4,}/g
  if (repeatedCharPattern.test(trimmed)) return true

  const randomPatterns = [
    /^[qwertyuiopasdfghjklzxcvbnm]{6,}$/i,
    /^[asdf]{4,}$/i,
    /^[zxcv]{4,}$/i,
  ]
  if (randomPatterns.some((pattern) => pattern.test(trimmed))) return true

  const onlyPunctuation = /^[^\w\u4e00-\u9fff\s]+$/
  if (onlyPunctuation.test(trimmed)) return true

  const meaninglessRatio = (trimmed.match(/[^a-zA-Z0-9\u4e00-\u9fff\s.,!?;:'"-]/g) || []).length / trimmed.length
  if (meaninglessRatio > 0.5 && trimmed.length > 10) return true

  return false
}

function hasBasicMeaning(text: string): boolean {
  if (!text || text.trim().length < 5) return false

  const trimmed = text.trim()
  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed.length >= 3

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0)
  if (words.length < 2) return false

  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length
  if (letterCount < 5) return false

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipient, occasion, currentSection, currentText, user_id, level: levelRaw } = body
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "letter")

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const textToCheck = currentText || ""
    const isGibberish = isGibberishOrMeaningless(textToCheck)
    const hasMeaning = hasBasicMeaning(textToCheck)
    const quality = evaluateLetterWriting(textToCheck, currentSection, level, recipient, occasion)

    if (isGibberish || !hasMeaning) {
      return NextResponse.json({
        message: `I see you're trying to write, but this doesn't look like meaningful text yet. Please write something real about ${currentSection.toLowerCase()} for ${recipient}. Try to express your thoughts clearly! ✨`,
        done: false,
        secretCodeDetected: false,
        secretCode: null,
        quality,
      })
    }

    const prompt = `Student writing to: "${recipient}", Reason: "${occasion}", Section: "${currentSection}", Text: "${currentText || "Just starting..."}"

CRITICAL:
- All your feedback MUST be in English only. Do not use Chinese or any other language.
- Use level ${level} only as a light guide. Do not be too strict during testing.
- Pass if the writing is real, not too short for this part, clearly fits the current letter section, and is safe.
- Reject if it is gibberish, too short, clearly unrelated to the letter section, or unsafe.
- STRICTLY REJECT gibberish, random characters, keyboard mashing, or meaningless text.
- ${buildPassPromptRule(currentSection, level)}
- Give brief feedback with emojis in English.${levelSuffix}`

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })
    const done = detectPassSignal(message) && quality.pass
    const finalMessage = finalizeEvaluationMessage(
      message,
      { ...quality, pass: done },
      `Please revise the ${currentSection.toLowerCase()} part with clearer, safer, and more suitable English.`
    )

    try {
      await logApiCall(
        user_id,
        "letterGuide",
        "/api/dify-letter-guide",
        { recipient, occasion, currentSection },
        {
          message: finalMessage,
          done,
          quality,
        }
      )
    } catch (logError) {
      console.error("Error logging API call:", logError)
    }

    return NextResponse.json({
      message: finalMessage,
      done,
      secretCodeDetected: done,
      secretCode: done ? GOOD_ENOUGH_CODE : null,
      quality,
    })
  } catch (error) {
    console.error("Error in letter guide API:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
