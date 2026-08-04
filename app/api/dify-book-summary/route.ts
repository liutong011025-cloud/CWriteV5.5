import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, user_id } = await request.json()

    if (!bookTitle) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const prompt = `Please provide a brief introduction and summary of the book: ${bookTitle}. Include what the book is about, main themes, and key information that would help a student write a book review.`

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    await logApiCall(
      user_id || "default-user",
      "bookReviewWriting",
      "/api/dify-book-summary",
      { bookTitle },
      { answer: message }
    )

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Book summary API error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
