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

type EvidenceItem = {
  sentence?: string
  overall_evidence?: string
  reason: string
}

type GrowthDiagnostics = {
  code: string
  title: string
  detail: string
  tips?: string[]
  missingEnv?: string[]
}

const buildDiagnostics = (
  code: string,
  title: string,
  detail: string,
  extra?: Partial<GrowthDiagnostics>
): GrowthDiagnostics => ({
  code,
  title,
  detail,
  ...(extra?.tips ? { tips: extra.tips } : {}),
  ...(extra?.missingEnv ? { missingEnv: extra.missingEnv } : {}),
})

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

const VALUES_KEYWORDS: Record<number, string[]> = {
  1: ["keep", "never give up", "try again", "persevere", "persist", "brave"],
  2: ["respect", "polite", "thank you", "listen", "kind words"],
  3: ["responsible", "duty", "promise", "must", "should", "help my people"],
  4: ["country", "nation", "flag", "heroes", "love my country", "national song"],
  5: ["commit", "dedicate", "devote", "promise to", "carry on"],
  6: ["honest", "truth", "integrity", "sincere"],
  7: ["care", "help others", "kind", "kindness", "support", "protect"],
  8: ["law", "rule", "obey", "follow rules", "law-abiding"],
  9: ["empathy", "understand feelings", "cry", "comfort", "hold my hand"],
  10: ["study hard", "work hard", "diligent", "practice", "effort"],
  11: ["grandpa", "grandma", "parents", "filial", "family respect"],
  12: ["together", "team", "unity", "friends", "we"],
}

const VALUES_REASONS: Record<number, string> = {
  1: "This sentence shows the child keeps trying when facing difficulty.",
  2: "This sentence shows respect and polite attitude toward others.",
  3: "This sentence shows responsibility and a sense of duty.",
  4: "This sentence clearly expresses national identity and respect for the country.",
  5: "This sentence shows commitment to doing what is right.",
  6: "This sentence reflects honesty and integrity.",
  7: "This sentence shows care and willingness to help others.",
  8: "This sentence shows respect for rules and law-abiding behavior.",
  9: "This sentence shows empathy for other people's feelings.",
  10: "This sentence shows diligence and willingness to work hard.",
  11: "This sentence shows filial respect for family elders.",
  12: "This sentence shows unity and cooperation with others.",
}

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

const localHeuristicValues = (text: string) => {
  const sentences = splitSentences(text)
  const matchedDimensions: number[] = []
  const evidenceByDimension: Record<number, EvidenceItem> = {}

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    for (let id = 1; id <= 12; id++) {
      if (matchedDimensions.includes(id)) continue
      const keywords = VALUES_KEYWORDS[id] || []
      const hit = keywords.some((k) => lower.includes(k))
      if (!hit) continue
      matchedDimensions.push(id)
      evidenceByDimension[id] = {
        sentence: sentence.slice(0, 220),
        reason: VALUES_REASONS[id] || "This sentence supports the value clearly.",
      }
    }
  }

  return { matchedDimensions, evidenceByDimension }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GrowthRequestBody
    const text = String(body.text || "").trim()
    if (!text) {
      return NextResponse.json(
        {
          error: "bad_request",
          message: "text is required",
          matchedDimensions: [],
          diagnostics: buildDiagnostics(
            "bad_request",
            "Values growth request is invalid",
            "No writing text was provided to values growth API."
          ),
        },
        { status: 400 }
      )
    }

    if (!DIFY_API_KEY || !DIFY_VALUES_GROWTH_APP_ID) {
      const missingEnv: string[] = []
      if (!DIFY_API_KEY) missingEnv.push("DIFY_API_KEY")
      if (!DIFY_VALUES_GROWTH_APP_ID) missingEnv.push("DIFY_VALUES_GROWTH_APP_ID")
      const local = localHeuristicValues(text)
      return NextResponse.json({
        matchedDimensions: local.matchedDimensions,
        evidenceByDimension: local.evidenceByDimension,
        source: local.matchedDimensions.length > 0 ? "local_heuristic_no_config" : "fallback_no_config",
        diagnostics: buildDiagnostics(
          "fallback_no_config",
          local.matchedDimensions.length > 0 ? "Using local values fallback" : "Values growth not configured",
          local.matchedDimensions.length > 0
            ? "Dify config is missing, so local heuristic values analysis is used."
            : "Dify config is missing, so tree growth analysis is skipped.",
          {
            missingEnv,
            tips: [
              "Set missing env vars in .env.local or deployment environment.",
              "Restart dev server after updating env vars.",
            ],
          }
        ),
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
  "matched_dimensions": [number, ...],
  "evidence_by_dimension": {
    "10": { "sentence": "...", "overall_evidence": "...", "reason": "..." }
  }
}
- Each number must be 1..12.
- If one dimension is strongly demonstrated, you may repeat that dimension once (e.g. [3,3,9]) to indicate two growth steps for that tree.
- Keep the list short (2 to 6 entries typically).
- Evidence rules:
  - Only include a dimension if the writing has clear support in the text.
  - Prefer "sentence" when possible (quoted/copied from writing).
  - If no single sentence is enough, you may use "overall_evidence" to explain how the whole passage supports the value.
  - "reason" must explain why this evidence supports that specific value.
  - If support is weak/unclear, DO NOT include that dimension.
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
      const local = localHeuristicValues(text)
      return NextResponse.json({
        matchedDimensions: local.matchedDimensions,
        evidenceByDimension: local.evidenceByDimension,
        source: local.matchedDimensions.length > 0 ? "local_heuristic_dify_error" : "fallback_dify_error",
        diagnostics: buildDiagnostics(
          "fallback_dify_error",
          "Dify request failed",
          `Dify returned HTTP ${res.status}.`,
          {
            tips: [
              "Check Dify app availability and API key permission.",
              "Retry once after 2-3 seconds if this is a transient error.",
            ],
          }
        ),
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
      const local = localHeuristicValues(text)
      return NextResponse.json({
        matchedDimensions: local.matchedDimensions,
        evidenceByDimension: local.evidenceByDimension,
        source: local.matchedDimensions.length > 0 ? "local_heuristic_parse_error" : "fallback_parse_error",
        diagnostics: buildDiagnostics(
          "fallback_parse_error",
          "Values result parsing failed",
          "Dify returned non-JSON content that could not be parsed.",
          {
            tips: [
              "Ensure Dify app output is strict JSON.",
              "Check Dify logs for prompt leakage or extra text.",
            ],
          }
        ),
      })
    }

    const matchedDimensions = Array.isArray(parsed.matched_dimensions)
      ? parsed.matched_dimensions
          .map((item) => clampDimensionId(item))
          .filter((id): id is number => id !== null)
          .slice(0, 12)
      : []

    const evidenceByDimension: Record<number, EvidenceItem> = {}
    const rawEvidence = (parsed as { evidence_by_dimension?: unknown }).evidence_by_dimension
    if (rawEvidence && typeof rawEvidence === "object") {
      Object.entries(rawEvidence as Record<string, unknown>).forEach(([k, v]) => {
        const id = clampDimensionId(k)
        if (!id || !v || typeof v !== "object") return
        const sentence = String((v as { sentence?: unknown }).sentence || "").trim()
        const overallEvidence = String((v as { overall_evidence?: unknown }).overall_evidence || "").trim()
        const reason = String((v as { reason?: unknown }).reason || "").trim()
        if ((!sentence && !overallEvidence) || !reason) return
        evidenceByDimension[id] = {
          ...(sentence ? { sentence } : {}),
          ...(overallEvidence ? { overall_evidence: overallEvidence } : {}),
          reason,
        }
      })
    }

    const strictlyEvidenceBasedDimensions = matchedDimensions.filter((id) => !!evidenceByDimension[id])

    if (strictlyEvidenceBasedDimensions.length === 0) {
      return NextResponse.json({
        matchedDimensions: [],
        evidenceByDimension: {},
        source: "fallback_empty_result",
        diagnostics: buildDiagnostics(
          "fallback_empty_result",
          "No evidence for tree growth",
          "No value dimension had both evidence and reason, so no tree grows this round.",
          {
            tips: [
              "Write one or two clearer action sentences showing values.",
              "Mention specific behavior (helping, responsibility, respect) explicitly.",
            ],
          }
        ),
      })
    }

    return NextResponse.json({
      matchedDimensions: strictlyEvidenceBasedDimensions,
      evidenceByDimension,
      dimensions: VALUE_DIMENSIONS,
      source: "dify",
      diagnostics: null,
    })
  } catch (error) {
    console.error("[writing-values-growth] Error:", error)
    return NextResponse.json({
      matchedDimensions: [],
      evidenceByDimension: {},
      source: "fallback_internal_error",
      diagnostics: buildDiagnostics(
        "fallback_internal_error",
        "Values growth internal error",
        "Unexpected server error happened while evaluating values growth."
      ),
    })
  }
}

