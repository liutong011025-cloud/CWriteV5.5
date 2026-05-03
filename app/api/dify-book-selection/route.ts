import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const GOOD_ENOUGH_PHRASES = [
  "Let's start writing",
  "Let's begin writing",
  "Let's start writing now",
  "Let's begin writing now",
  "Ready to start writing",
  "Let's write",
  "Let's get started",
]

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, user_id, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "book")

    if (!bookTitle) {
      return NextResponse.json(
        { error: "Book title is required" },
        { status: 400 }
      )
    }

    if (!isConfigured()) {
      return NextResponse.json(
        { error: "DeepSeek API not configured" },
        { status: 500 }
      )
    }

    const prompt = `You are a judge evaluating whether a book is suitable for an elementary student to write a book review about. Speak like a friendly, cute elementary teacher with a warm and encouraging tone. Use emojis appropriately. Keep your response to about 30-40 words (a bit longer to be more friendly and cute).

The book: "${bookTitle}"

Your task:
1. Judge if this book is suitable for an elementary student to review
2. If NOT suitable, use a cute, friendly tone to explain why and suggest a similar book that would be better. CRITICAL: Do NOT use any phrases like "Let's start writing", "Let's begin writing", "Let's write", or "Let's get started" in your response.
3. If suitable, you MUST end your response with one of these exact phrases: "Let's start writing", "Let's begin writing", "Let's start writing now", "Let's begin writing now", "Ready to start writing", "Let's write", or "Let's get started". Use a cute, encouraging tone with emojis.

CRITICAL RULES:
- If the book is suitable: Your response MUST contain one of the phrases: "Let's start writing", "Let's begin writing", "Let's start writing now", "Let's begin writing now", "Ready to start writing", "Let's write", or "Let's get started"
- If the book is NOT suitable: Your response MUST NOT contain any of these phrases

Be warm, cute, and encouraging. Use English.${levelSuffix}`

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    // 記錄 API 調用
    await logApiCall(
      user_id,
      "bookSelection",
      "/api/dify-book-selection",
      { bookTitle },
      { answer: message }
    )

    return NextResponse.json({
      message,
      suitable: GOOD_ENOUGH_PHRASES.some((phrase) => message.includes(phrase)),
    })
  } catch (error) {
    console.error("Book selection API error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json(
        { error: "timeout", message: "DeepSeek API timed out. Please try again." },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
