import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured } from "@/lib/deepseek"

type WritingMetricsRequestBody = {
  text: string
  type: "story" | "review" | "letter"
  user_id?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: "DeepSeek not configured",
          message: "DEEPSEEK_API_KEY is missing in environment variables.",
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as WritingMetricsRequestBody
    const { text, type, user_id: _userId } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        {
          error: "bad_request",
          message: "Text is required to evaluate writing metrics.",
        },
        { status: 400 }
      )
    }

    const safeType = type || "story"

    const systemPrompt = `You are an expert elementary writing coach.
Analyze the student's writing and score it on three metrics from 0 to 100:

1. vocab_richness: range and variety of words (higher = more varied vocabulary).
2. descriptive_accuracy: clarity and precision of descriptions and details (higher = clearer, more concrete images).
3. logical_coherence: how well ideas are connected and organized (higher = smoother flow and clear structure).

IMPORTANT:
- Always respond with a SINGLE LINE of pure JSON.
- Do NOT include any explanation, markdown, or extra text.
- JSON shape MUST be:
  {
    "vocab_richness": number (0-100),
    "descriptive_accuracy": number (0-100),
    "logical_coherence": number (0-100)
  }`

    const userPrompt = `Writing type: ${safeType}

Student writing:
${text}`

    let rawAnswer: string
    try {
      rawAnswer = await chat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 256,
      })
    } catch (error) {
      console.error("[writing-metrics] DeepSeek error:", error)
      return NextResponse.json(
        { error: "deepseek_error", message: "Failed to get metrics from DeepSeek." },
        { status: 500 }
      )
    }

    let parsed: {
      vocab_richness?: number
      descriptive_accuracy?: number
      logical_coherence?: number
    } = {}

    try {
      const firstBrace = rawAnswer.indexOf("{")
      const lastBrace = rawAnswer.lastIndexOf("}")
      const jsonSlice =
        firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
          ? rawAnswer.slice(firstBrace, lastBrace + 1)
          : rawAnswer
      parsed = JSON.parse(jsonSlice)
    } catch {
      console.error("[writing-metrics] Failed to parse JSON answer:", rawAnswer)
      parsed = {
        vocab_richness: 40,
        descriptive_accuracy: 40,
        logical_coherence: 40,
      }
    }

    const clamp = (value: unknown) => {
      const n = Number(value)
      if (!Number.isFinite(n)) return 40
      return Math.min(100, Math.max(0, Math.round(n)))
    }

    const metrics = {
      vocabRichness: clamp(parsed.vocab_richness),
      descriptiveAccuracy: clamp(parsed.descriptive_accuracy),
      logicalCoherence: clamp(parsed.logical_coherence),
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("[writing-metrics] Error:", error)
    return NextResponse.json(
      { error: "internal_error", message: "Failed to compute writing metrics." },
      { status: 500 }
    )
  }
}
