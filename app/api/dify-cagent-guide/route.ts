import { NextRequest, NextResponse } from "next/server"

const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages"
// 使用環境變量中的真正 API Key
const DIFY_API_KEY = process.env.DIFY_API_KEY || ""
// Cagent 專用 Dify 應用 ID（你提供的）
const DIFY_CAGENT_APP_ID = "app-lOPsCIBr4Fb97gxv1fTDq1GU"

/**
 * Cagent page-context guide: tells the student what they did, how they're doing, and what to do next.
 * Uses simple, cute language with emojis.
 */
export async function POST(request: NextRequest) {
  try {
    if (!DIFY_API_KEY) {
      console.error("[dify-cagent-guide] DIFY_API_KEY not configured")
      return NextResponse.json(
        { error: "Guide unavailable", message: "Cagent is resting. Try again in a bit! 🧸" },
        { status: 200 }
      )
    }

    const { stage, contextSummary, user_id, userMessage } = await request.json()

    const basePrompt = `You are Cagent, a friendly AI assistant for elementary students in a creative writing app. You know every page of the app. Your answers must always be in simple English that a young child can understand.

Current page/stage: ${stage || "unknown"}
What the student has done so far on this page (if any): ${contextSummary || "Nothing yet"}

Reply in 2-3 very short sentences. Use simple, cute language and include 1 emoji (sometimes 2, but not more). Vary your openings (do NOT always start with "Hi there" or use the same sentence pattern every time). Tell the student:
1. What they have done on this page (if anything)
2. How they are doing
3. What to do next

Important quality rule:
- Avoid generic replies like "Good start" only.
- Mention at least one concrete thing from the provided context summary or user message, then give one clear next action.

Write in English only. Be encouraging and warm. Do not use markdown.`

    const chatAddon = userMessage
      ? `

The student just typed this message to you:
"${String(userMessage).slice(0, 300)}"

In your reply, respond directly to what they said while still sounding like a cute guide on this page.`
      : ""

    const prompt = `${basePrompt}${chatAddon}`

    const response = await fetch(DIFY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        response_mode: "blocking",
        user: user_id || "cagent-user",
        app_id: DIFY_CAGENT_APP_ID,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[dify-cagent-guide] Dify error:", response.status, errText)
      return NextResponse.json(
        { error: "Guide unavailable", message: "Cagent is resting. Try again in a bit! 🧸" },
        { status: 200 }
      )
    }

    const data = await response.json()
    const answer = data.answer || "Keep going! You're doing great! ✨"
    return NextResponse.json({ message: answer, answer })
  } catch (error) {
    console.error("[dify-cagent-guide] Error:", error)
    return NextResponse.json(
      { error: "Guide unavailable", message: "Something went wrong. Try again! 🌟" },
      { status: 200 }
    )
  }
}
