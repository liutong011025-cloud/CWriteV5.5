import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured } from "@/lib/deepseek"

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

    if (!isConfigured()) {
      const local = localHeuristicValues(text)
      return NextResponse.json({
        matchedDimensions: local.matchedDimensions,
        evidenceByDimension: local.evidenceByDimension,
        source:
          local.matchedDimensions.length > 0
            ? "local_heuristic_no_config"
            : "fallback_no_config",
        diagnostics: buildDiagnostics(
          "fallback_no_config",
          local.matchedDimensions.length > 0
            ? "Using local values fallback"
            : "Values growth not configured",
          local.matchedDimensions.length > 0
            ? "DeepSeek is not configured, so local heuristic values analysis is used."
            : "DeepSeek is not configured, so tree growth analysis is skipped.",
          {
            tips: [
              "Set DEEPSEEK_API_KEY in .env.local or deployment environment.",
              "Restart dev server after updating env vars.",
            ],
          }
        ),
      })
    }

    const type = body.type || "story"
    const systemPrompt = `You are an elementary writing values assessor.
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
  - If support is weak/unclear, DO NOT include that dimension.`

    const userPrompt = `Writing type: ${type}
Student writing:
${text.slice(0, 6000)}`

    let rawAnswer: string
    try {
      rawAnswer = await chat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 1024,
      })
    } catch (error) {
      console.error("[writing-values-growth] DeepSeek error:", error)
      const local = localHeuristicValues(text)
      return NextResponse.json({
        matchedDimensions: local.matchedDimensions,
        evidenceByDimension: local.evidenceByDimension,
        source:
          local.matchedDimensions.length > 0
            ? "local_heuristic_api_error"
            : "fallback_api_error",
        diagnostics: buildDiagnostics(
          "fallback_api_error",
          "DeepSeek request failed",
          `DeepSeek returned an error.`,
          {
            tips: [
              "Check DeepSeek API key and quota.",
              "Retry once after 2-3 seconds if this is a transient error.",
            ],
          }
        ),
      })
    }

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
        source:
          local.matchedDimensions.length > 0
            ? "local_heuristic_parse_error"
            : "fallback_parse_error",
        diagnostics: buildDiagnostics(
          "fallback_parse_error",
          "Values result parsing failed",
          "DeepSeek returned non-JSON content that could not be parsed.",
          {
            tips: [
              "Ensure the model returns strict JSON.",
              "Check API logs for prompt leakage or extra text.",
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
    const rawEvidence = (parsed as { evidence_by_dimension?: unknown })
      .evidence_by_dimension
    if (rawEvidence && typeof rawEvidence === "object") {
      Object.entries(rawEvidence as Record<string, unknown>).forEach(
        ([k, v]) => {
          const id = clampDimensionId(k)
          if (!id || !v || typeof v !== "object") return
          const sentence = String(
            (v as { sentence?: unknown }).sentence || ""
          ).trim()
          const overallEvidence = String(
            (v as { overall_evidence?: unknown }).overall_evidence || ""
          ).trim()
          const reason = String(
            (v as { reason?: unknown }).reason || ""
          ).trim()
          if ((!sentence && !overallEvidence) || !reason) return
          evidenceByDimension[id] = {
            ...(sentence ? { sentence } : {}),
            ...(overallEvidence
              ? { overall_evidence: overallEvidence }
              : {}),
            reason,
          }
        }
      )
    }

    const strictlyEvidenceBasedDimensions = matchedDimensions.filter(
      (id) => !!evidenceByDimension[id]
    )

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
      source: "deepseek",
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
