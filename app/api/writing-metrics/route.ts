import { NextRequest, NextResponse } from "next/server"

const DIFY_API_KEY = process.env.DIFY_API_KEY || ""
const DIFY_METRICS_APP_ID = process.env.DIFY_METRICS_APP_ID || ""
const DIFY_BASE_URL = "https://api.dify.ai/v1"

type WritingMetricsRequestBody = {
  text: string
  type: "story" | "review" | "letter"
  user_id?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!DIFY_API_KEY || !DIFY_METRICS_APP_ID) {
      return NextResponse.json(
        {
          error: "Dify not configured",
          message: "DIFY_API_KEY or DIFY_METRICS_APP_ID is missing in environment variables.",
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as WritingMetricsRequestBody
    const { text, type, user_id } = body

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

    const systemPrompt = `
You are an expert elementary writing coach.
Analyze the student's writing and score it on three metrics from 0 to 100:

1. vocabulary_richness: range and variety of words (higher = more varied vocabulary).
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
  }
`.trim()

    const userPrompt = `
Writing type: ${safeType}

Student writing:
${text}
`.trim()

    const url = `${DIFY_BASE_URL}/chat-messages`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIFY_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: {
          role: "writing_metrics",
          writing_type: safeType,
        },
        query: `${systemPrompt}\n\n${userPrompt}`,
        response_mode: "blocking",
        user: user_id || "metrics-user",
        app_id: DIFY_METRICS_APP_ID,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[writing-metrics] Dify error:", res.status, errText)
      return NextResponse.json(
        { error: "dify_error", message: "Failed to get metrics from Dify." },
        { status: 500 }
      )
    }

    const data = await res.json()
    const rawAnswer = String(data.answer || "").trim()

    let parsed: {
      vocab_richness?: number
      descriptive_accuracy?: number
      logical_coherence?: number
    } = {}

    try {
      // 有些模型可能會在 JSON 外多輸出文字，嘗試抓取第一個 { 到最後一個 } 之間的內容
      const firstBrace = rawAnswer.indexOf("{")
      const lastBrace = rawAnswer.lastIndexOf("}")
      const jsonSlice =
        firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
          ? rawAnswer.slice(firstBrace, lastBrace + 1)
          : rawAnswer

      parsed = JSON.parse(jsonSlice)
    } catch (e) {
      console.error("[writing-metrics] Failed to parse JSON answer:", rawAnswer)
      // 給一組保守的預設值，避免前端崩潰
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

