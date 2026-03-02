import { NextRequest, NextResponse } from "next/server"

const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages"
const DIFY_API_KEY = process.env.DIFY_API_KEY || "app-TFDykrjN8LpJROY6eTRNjwo5"

/**
 * Cagent page-context guide: tells the student what they did, how they're doing, and what to do next.
 * Uses simple, cute language with emojis.
 */
export async function POST(request: NextRequest) {
  try {
    const { stage, contextSummary, user_id, userMessage } = await request.json()

    const basePrompt = `You are Cagent, a friendly AI assistant for elementary students in a creative writing app. You know every page of the app.

Current page/stage: ${stage || "unknown"}
What the student has done so far on this page (if any): ${contextSummary || "Nothing yet"}

Reply in 2-4 short sentences. Use simple, cute language and include 1-2 emojis. Vary your openings (do NOT always start with "Hi there" or use the same sentence pattern every time). Tell the student:
1. What they have done on this page (if anything)
2. How they are doing
3. What to do next

Write in English. Be encouraging and warm. Do not use markdown.`

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
