import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipient, occasion, user_id, level: levelRaw } = body
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "letter")

    if (!recipient || !occasion) {
      return NextResponse.json({ error: "recipient and occasion are required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const prompt = `A student wants to write a letter:
- To: "${recipient}"
- Reason: "${occasion}"

Please provide a brief, kid-friendly guidance (2-3 sentences max) on how to write this letter. Use simple words and be encouraging! Include emojis to make it fun! 这次结尾也不要回复六个单词✨${levelSuffix}`

    const guidance = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    try {
      await logApiCall(
        user_id,
        "letterSetup",
        "/api/dify-letter-setup",
        { recipient, occasion },
        { guidance }
      )
    } catch (logError) {
      console.error("Error logging API call:", logError)
    }

    return NextResponse.json({ guidance })
  } catch (error) {
    console.error("Error in letter setup API:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
