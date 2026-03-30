import { NextRequest, NextResponse } from "next/server"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const { text, character, plot, structure, user_id, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "story")

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const context = `
Character: ${character?.name || "Unknown"}, Age: ${character?.age || "Unknown"}, Traits: ${character?.traits?.join(", ") || "None"}, Description: ${character?.description || "None"}
Plot: Setting: ${plot?.setting || "Unknown"}, Conflict: ${plot?.conflict || "Unknown"}, Goal: ${plot?.goal || "Unknown"}
Structure: ${structure?.type || "Unknown"}, Outline: ${structure?.outline?.join(" -> ") || "None"}
Current text: ${text || ""}
`.trim()

    const prompt = `Please provide writing suggestions based on this context: ${context}${levelSuffix}`

    const answer = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({ answer, suggestion: answer })
  } catch (error) {
    console.error("Writing aid API error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
