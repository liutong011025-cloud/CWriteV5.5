import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

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

    const prompt = `You are Luna, a friendly book review writing teacher for elementary students.

Student is writing a ${reviewType} review for the book: "${bookTitle}"
Current section: "${currentSectionName}"
Student's writing: "${text || ""}"

EVALUATION RULES:
1. Give brief, encouraging feedback (1-2 sentences) with emojis ✨
2. Be supportive and encouraging
3. EVALUATE BASED ON CONTENT QUALITY, NOT WORD COUNT:
   - Different sections have different length expectations:
     * Introduction: Usually 1-2 sentences to introduce the book
     * Body sections: Usually 2-3+ sentences with some details
     * Conclusion: Usually 1-2 sentences to wrap up
   - Focus on whether the writing:
     * Makes basic sense and is readable
     * Relates to the section and book
     * Shows some effort
     * Fulfills the basic purpose of the section
4. Say "you can move to the next part" when:
   - The content is meaningful and makes sense
   - The writing relates to the section and book
   - The writing shows reasonable effort
   - The writing is NOT just random characters or complete gibberish
   - The writing fulfills the basic purpose of the ${currentSectionName} section
5. Be generous - approve if the student has written something reasonable, even if it's brief
6. Only reject if:
   - Text is completely random characters or gibberish
   - Text has no relation to the book or section at all
   - Text is completely empty or just placeholder text

Remember: Be encouraging and supportive. Approve reasonable writing that shows effort, even if brief. Only say "you can move to the next part" when the writing is good enough for its purpose or his total number of words is beyond 10.如果有乱码组成或者显然没有逻辑，一定不要说you can move to the next part这句话${levelSuffix}`

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    await logApiCall(
      user_id || "default-user",
      "bookReviewWriting",
      "/api/dify-book-writing-aid",
      { text, reviewType, bookTitle, structure, currentSection },
      { answer: message }
    )

    return NextResponse.json({ message })
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
