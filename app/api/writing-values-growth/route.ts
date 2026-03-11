import { NextRequest, NextResponse } from "next/server"

const DIFY_API_KEY = process.env.DIFY_API_KEY || ""
const DIFY_VALUES_GROWTH_APP_ID =
  process.env.DIFY_VALUES_GROWTH_APP_ID || process.env.DIFY_METRICS_APP_ID || ""
const DIFY_BASE_URL = "https://api.dify.ai/v1"

const VALUE_DIMENSIONS = [
  "Perseverance",
  "Respect for Others",
  "Responsibility",
  "National Identity",
  "Commitment",
  "Integrity",
  "Benevolence",
  "Law-abidingness",
  "Empathy",
  "Diligence",
  "Filial Piety",
  "Unity",
] as const

type GrowthRequestBody = {
  text: string
  type?: "story" | "review" | "letter"
  user_id?: string
}

const randomPickIds = (count: number) => {
  const ids = Array.from({ length: 12 }, (_, i) => i + 1)
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = ids[i]
    ids[i] = ids[j]
    ids[j] = temp
  }
  return ids.slice(0, count)
}

const buildFallbackMatchedDimensions = (text: string) => {
  const normalized = text.trim().toLowerCase()
  const looksLikeTestOnly = normalized.length > 0 && /^test(\s+test)*[.!?]*$/i.test(normalized)
  const base = looksLikeTestOnly ? randomPickIds(4) : randomPickIds(3)
  // 通过重复 id 表示同一棵树可一次成长两级（最多到 tree4）
  if (looksLikeTestOnly && base.length > 0) {
    return [base[0], base[0], ...base.slice(1)]
  }
  return base
}

const clampDimensionId = (value: unknown) => {
  if (typeof value === "string") {
    const maybeNum = Number(value)
    if (Number.isFinite(maybeNum)) {
      const id = Math.round(maybeNum)
      return id >= 1 && id <= 12 ? id : null
    }
    const normalized = value.toLowerCase().replace(/[^a-z]/g, "")
    const idx = VALUE_DIMENSIONS.findIndex(
      (name) => name.toLowerCase().replace(/[^a-z]/g, "") === normalized
    )
    return idx >= 0 ? idx + 1 : null
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const id = Math.round(n)
  if (id < 1 || id > 12) return null
  return id
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GrowthRequestBody
    const text = String(body.text || "").trim()
    if (!text) {
      return NextResponse.json(
        { error: "bad_request", message: "text is required", matchedDimensions: [] },
        { status: 400 }
      )
    }

    const fallbackMatchedDimensions = buildFallbackMatchedDimensions(text)

    if (!DIFY_API_KEY || !DIFY_VALUES_GROWTH_APP_ID) {
      return NextResponse.json({
        matchedDimensions: fallbackMatchedDimensions,
        source: "fallback_no_config",
      })
    }

    const type = body.type || "story"
    const systemPrompt = `
You are an elementary writing values assessor.
Assess the student's writing against 12 dimensions:
1. Perseverance
2. Respect for Others
3. Responsibility
4. National Identity
5. Commitment
6. Integrity
7. Benevolence
8. Law-abidingness
9. Empathy
10. Diligence
11. Filial Piety
12. Unity

Rules:
- Output JSON only, no markdown.
- Use this exact shape:
{
  "matched_dimensions": [number, ...]
}
- Each number must be 1..12.
- If one dimension is strongly demonstrated, you may repeat that dimension once (e.g. [3,3,9]) to indicate two growth steps for that tree.
- Keep the list short (2 to 6 entries typically).
`.trim()

    const userPrompt = `
Writing type: ${type}
Student writing:
${text.slice(0, 6000)}
`.trim()

    const res = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIFY_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: {
          role: "writing_values_growth",
          writing_type: type,
        },
        query: `${systemPrompt}\n\n${userPrompt}`,
        response_mode: "blocking",
        user: body.user_id || "values-growth-user",
        app_id: DIFY_VALUES_GROWTH_APP_ID,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[writing-values-growth] Dify error:", res.status, errText)
      return NextResponse.json({
        matchedDimensions: fallbackMatchedDimensions,
        source: "fallback_dify_error",
      })
    }

    const data = await res.json()
    const rawAnswer = String(data.answer || "").trim()

    let parsed: { matched_dimensions?: unknown[] } = {}
    try {
      const firstBrace = rawAnswer.indexOf("{")
      const lastBrace = rawAnswer.lastIndexOf("}")
      const jsonSlice =
        firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
          ? rawAnswer.slice(firstBrace, lastBrace + 1)
          : rawAnswer
      parsed = JSON.parse(jsonSlice)
    } catch {
      return NextResponse.json({
        matchedDimensions: fallbackMatchedDimensions,
        source: "fallback_parse_error",
      })
    }

    const matchedDimensions = Array.isArray(parsed.matched_dimensions)
      ? parsed.matched_dimensions
          .map((item) => clampDimensionId(item))
          .filter((id): id is number => id !== null)
          .slice(0, 12)
      : []

    if (matchedDimensions.length === 0) {
      return NextResponse.json({
        matchedDimensions: fallbackMatchedDimensions,
        source: "fallback_empty_result",
      })
    }

    return NextResponse.json({
      matchedDimensions,
      dimensions: VALUE_DIMENSIONS,
      source: "dify",
    })
  } catch (error) {
    console.error("[writing-values-growth] Error:", error)
    return NextResponse.json({
      matchedDimensions: randomPickIds(3),
      source: "fallback_internal_error",
    })
  }
}

