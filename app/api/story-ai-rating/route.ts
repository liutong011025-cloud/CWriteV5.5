import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export const maxDuration = 120

type Dim = "Vocabulary" | "Grammar" | "Coherence" | "Creativity" | "Structure"

function clampStar(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(5, Math.round(v)))
}

function extractJsonObject(text: string): any | null {
  const s = String(text || "")
  const first = s.indexOf("{")
  const last = s.lastIndexOf("}")
  if (first < 0 || last < 0 || last <= first) return null
  const candidate = s.slice(first, last + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function fallbackScore(textRaw: string) {
  const text = String(textRaw || "").trim()
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const sentenceCount = text.split(/[.!?。！？\n]+/).map((s) => s.trim()).filter(Boolean).length
  const vocabulary = clampStar(Math.min(5, 1 + Math.floor(wordCount / 40)))
  const grammar = clampStar(Math.min(5, 1 + Math.floor(sentenceCount / 3)))
  const coherence = clampStar(sentenceCount >= 3 ? 3 : 2)
  const creativity = clampStar(wordCount >= 60 ? 4 : 3)
  const structure = clampStar(sentenceCount >= 4 ? 4 : 3)
  return {
    scores: {
      Vocabulary: vocabulary,
      Grammar: grammar,
      Coherence: coherence,
      Creativity: creativity,
      Structure: structure,
    } as Record<Dim, number>,
    praise: "Nice work! You have a clear story.",
    improvements: [
      "Add 1-2 stronger describing words (colors, sounds, feelings).",
      "Use 1 connector like \"then\" or \"because\" to link events.",
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string
      character?: any
      plot?: any
      structure?: any
      user_id?: string
      language?: string
    }
    const text = String(body.text || "").trim()
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ ...fallbackScore(text), source: "fallback_local_no_config" })
    }

    const characterName = body.character?.name || "the character"
    const languageRule =
      body.language === "zh"
        ? `Write "praise" and "improvements" in Simplified Chinese. Keep JSON keys and score dimension names in English. The story itself is English — do not ask the student to rewrite it in Chinese.`
        : `Write "praise" and "improvements" in English.`
    const prompt = `You are a kind elementary school English writing teacher.
You will rate a student's COMPLETE story in 5 dimensions, each 1-5 stars:
- Vocabulary
- Grammar
- Coherence
- Creativity
- Structure

Story context:
Character name: ${characterName}
Species: ${body.character?.species || ""}
Setting: ${body.plot?.setting || ""}
Conflict: ${body.plot?.conflict || ""}
Goal: ${body.plot?.goal || ""}
Structure type: ${body.structure?.type || ""}

Student story:
${text}

Return ONLY valid JSON in this exact shape:
{
  "scores": {
    "Vocabulary": 1,
    "Grammar": 1,
    "Coherence": 1,
    "Creativity": 1,
    "Structure": 1
  },
  "praise": "1-2 short sentences",
  "improvements": ["bullet 1", "bullet 2", "bullet 3"]
}

Rules:
- Each score must be an integer 1..5.
- Praise must be friendly and specific.
- Improvements must be concrete and easy to do.
- ${languageRule}`

    let answer = ""
    try {
      answer = await chat({
        messages: [{ role: "user", content: prompt }],
        timeout: 110_000,
        temperature: 0.2,
        maxTokens: 1200,
      })
    } catch (err) {
      if (err instanceof DeepSeekError && err.isTimeout) {
        return NextResponse.json(
          { error: "timeout", message: "DeepSeek timeout. Please try again." },
          { status: 504 }
        )
      }
      throw err
    }

    const json = extractJsonObject(answer)
    const rawScores = json?.scores || {}
    const scores = {
      Vocabulary: clampStar(rawScores.Vocabulary) || 1,
      Grammar: clampStar(rawScores.Grammar) || 1,
      Coherence: clampStar(rawScores.Coherence) || 1,
      Creativity: clampStar(rawScores.Creativity) || 1,
      Structure: clampStar(rawScores.Structure) || 1,
    } as Record<Dim, number>

    const praise = typeof json?.praise === "string" ? json.praise : ""
    const improvements = Array.isArray(json?.improvements)
      ? json.improvements.map((x: any) => String(x || "").trim()).filter(Boolean).slice(0, 6)
      : []

    return NextResponse.json({
      scores,
      praise,
      improvements,
      source: "deepseek",
    })
  } catch (error) {
    console.error("story-ai-rating error:", error)
    return NextResponse.json({ ...fallbackScore(""), source: "fallback_error" }, { status: 200 })
  }
}

