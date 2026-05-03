import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const { content, userId, isSuggestion } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    let prompt = ""
    if (isSuggestion) {
      prompt = content
    } else {
      prompt = `请总结以下drama内容，用小学生口吻，不要添加任何新内容，只总结已知信息。内容如下：

${content}

请用简单易懂的语言，以小学生口吻总结这个drama故事。`
    }

    const summary = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    await logApiCall(
      userId || "default-user",
      "dramaComplete",
      "/api/dify-drama-summary",
      { content, isSuggestion },
      { summary }
    )

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Drama summary API error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
