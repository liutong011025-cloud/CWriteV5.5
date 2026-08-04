import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import {
  GOOD_ENOUGH_CODE,
  buildPassPromptRule,
  detectPassSignal,
  evaluateBookWriting,
  finalizeEvaluationMessage,
} from "@/lib/cagent-writing-rubric"

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { text, reviewType, bookTitle, structure, currentSection, user_id, level: levelRaw } =
      await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "book")

    if (!text || !reviewType || !bookTitle) {
      return NextResponse.json(
        { error: "Text, review type, and book title are required" },
        { status: 400 }
      )
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const currentSectionName =
      currentSection !== undefined ? structure?.outline?.[currentSection] || "" : ""
    const quality = evaluateBookWriting(String(text || ""), currentSectionName, level, bookTitle)

    const prompt = `You are Luna, a friendly book review writing teacher for elementary students.

Student is writing a ${reviewType} review for the book: "${bookTitle}"
Current section: "${currentSectionName}"
Student's writing: "${text || ""}"

EVALUATION RULES:
1. Give brief, encouraging feedback (1-2 sentences) with emojis ✨
2. Be supportive and encouraging
3. Use level ${level} only as a light guide. Do NOT be too strict during testing.
4. Pass the writing if it is real, not too short for this section, clearly related to the book review, and safe.
5. Reject if it is gibberish, too short, clearly unrelated to the book review, or unsafe.
6. ${buildPassPromptRule(currentSectionName || "current section", level)}
7. If the writing does not pass, explain what to improve and do NOT output the pass sentence or code.

Remember: focus on basic quality control, not strict scoring. Slightly raise expectations for higher levels, but keep testing-friendly.${levelSuffix}`

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })
    const done = detectPassSignal(message) && quality.pass
    const finalMessage = finalizeEvaluationMessage(
      message,
      { ...quality, pass: done },
      "Please revise this review section with clearer ideas and stronger detail."
    )

    await logApiCall(
      user_id || "default-user",
      "bookReviewWriting",
      "/api/dify-book-writing-aid",
      { text, reviewType, bookTitle, structure, currentSection },
      {
        answer: finalMessage,
        done,
        quality,
      }
    )

    return NextResponse.json({
      message: finalMessage,
      done,
      secretCodeDetected: done,
      secretCode: done ? GOOD_ENOUGH_CODE : null,
      quality,
    })
  } catch (error) {
    console.error("Book writing aid API error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json(
        { error: "timeout", message: "DeepSeek took too long. Try a shorter paragraph." },
        { status: 504 }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
