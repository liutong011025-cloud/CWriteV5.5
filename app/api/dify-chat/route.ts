import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const SYSTEM_PROMPT = `You are a creative writing assistant for elementary school students (ages 8-12).
You help students with their creative writing projects, including stories, book reviews, letters, and drama scripts.
Be encouraging, friendly, and use simple language appropriate for children.
Always be supportive of the student's creative efforts.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id, history } = await request.json()

    const queryText = typeof message === "string" ? message.trim() : ""
    if (!queryText) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json(
        { error: "DeepSeek API not configured" },
        { status: 500 }
      )
    }

    // 建構 messages 陣列
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // 添加歷史上下文（如果有的話）
    if (history && Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    // 添加當前消息
    messages.push({ role: "user", content: queryText })

    const answer = await chat({
      messages,
      timeout: 45_000,
    })

    // 記錄 API 調用
    await logApiCall(
      user_id,
      "plot",
      "/api/dify-chat",
      { message, conversation_id },
      { answer }
    )

    return NextResponse.json({
      answer,
      conversation_id: conversation_id || "new",
    })
  } catch (error) {
    console.error("Error calling DeepSeek Chat API:", error)
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
