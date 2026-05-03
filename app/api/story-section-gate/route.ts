import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured } from "@/lib/deepseek"

function countWords(text: string): number {
  if (!text?.trim()) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishText = text.replace(/[\u4e00-\u9fff]/g, " ").trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(Boolean).length : 0
  return chineseChars + englishWords
}

function levelParams(level: number) {
  const lv = Math.min(5, Math.max(1, Math.floor(level) || 1))
  const minWords = lv <= 1 ? 15 : lv >= 4 ? 25 : 20
  const tAccuracy = lv <= 1 ? 0.42 : lv <= 3 ? 0.52 : 0.64
  const tVocab = lv <= 1 ? 0.38 : lv <= 3 ? 0.48 : 0.6
  const tStructure = lv <= 1 ? 0.4 : lv <= 3 ? 0.5 : 0.62
  return { minWords, tAccuracy, tVocab, tStructure, level: lv }
}

function heuristicPass(
  text: string,
  sectionName: string,
  plot: { setting?: string; conflict?: string; goal?: string },
  minWords: number,
): { pass: boolean; accuracy: number; vocabulary: number; structure_fit: number; feedback: string } {
  const wc = countWords(text)
  if (wc < minWords) {
    return {
      pass: false,
      accuracy: 0.2,
      vocabulary: 0.2,
      structure_fit: 0.2,
      feedback: `Write at least ${minWords} words for this section (your level).`,
    }
  }
  const lower = text.toLowerCase()
  const words = lower.split(/\s+/).filter((w) => w.length > 1)
  const unique = new Set(words)
  const ttr = words.length ? unique.size / words.length : 0

  const plotBits = [plot.setting, plot.conflict, plot.goal]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  let overlap = 0
  for (const p of plotBits.slice(0, 12)) {
    if (p && lower.includes(p)) overlap++
  }
  const accuracy = Math.min(1, 0.35 + overlap * 0.08 + (wc >= minWords + 5 ? 0.15 : 0))
  const vocabulary = Math.min(1, ttr * 1.4 + (words.length > 8 ? 0.15 : 0))
  const sn = sectionName.toLowerCase()
  const structureHints = ["exposition", "rising", "climax", "falling", "resolution", "setup", "confrontation", "crisis"]
  const structure_fit =
    structureHints.some((h) => sn.includes(h) || lower.includes(h)) || wc >= minWords + 8 ? 0.72 : 0.55

  const pass = accuracy >= 0.45 && vocabulary >= 0.4 && structure_fit >= 0.45 && ttr >= 0.28
  return {
    pass,
    accuracy,
    vocabulary,
    structure_fit,
    feedback: pass
      ? "Good work — this section meets the basics. Keep going!"
      : "Add more detail, richer words, and make sure this part matches your plot and this section’s job in the story.",
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sectionName?: string
      sectionText?: string
      plot?: { setting?: string; conflict?: string; goal?: string }
      character?: { name?: string; species?: string }
      structureOutline?: string[]
      level?: number
    }

    const sectionName = (body.sectionName || "Section").trim()
    const sectionText = typeof body.sectionText === "string" ? body.sectionText : ""
    const plot = body.plot || {}
    const level = body.level ?? 1
    const { minWords, tAccuracy, tVocab, tStructure } = levelParams(level)

    const wc = countWords(sectionText)
    if (wc < minWords) {
      return NextResponse.json({
        pass: false,
        accuracy: 0,
        vocabulary: 0,
        structure_fit: 0,
        feedback: `Need at least ${minWords} words for your level (Level ${level}). Currently about ${wc}.`,
        minWords,
      })
    }

    if (!isConfigured()) {
      const h = heuristicPass(sectionText, sectionName, plot, minWords)
      return NextResponse.json({ ...h, minWords, source: "heuristic" })
    }

    const outline = (body.structureOutline || []).join(" → ")
    const system = `You score ONE section of a child's story. Return ONLY valid JSON, no markdown.
Scores are 0–1 decimals.
- accuracy: fits the plot (setting/conflict/goal) and character
- vocabulary: varied, age-appropriate words (not repeating one word endlessly)
- structure_fit: this section does what "${sectionName}" should do in the outline: ${outline || "n/a"}

Level ${level} (1=easiest): pass=true only if accuracy>=${tAccuracy} AND vocabulary>=${tVocab} AND structure_fit>=${tStructure}.

JSON shape: {"pass":boolean,"accuracy":number,"vocabulary":number,"structure_fit":number,"feedback":"one short encouraging sentence in English"}`

    const user = `Plot — Setting: ${plot.setting || ""} | Conflict: ${plot.conflict || ""} | Goal: ${plot.goal || ""}
Character: ${body.character?.name || ""} (${body.character?.species || ""})
Section title: ${sectionName}
Student draft:
---
${sectionText}
---`

    const raw = await chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.25,
      maxTokens: 400,
      timeout: 45_000,
    })

    let parsed: {
      pass?: boolean
      accuracy?: number
      vocabulary?: number
      structure_fit?: number
      feedback?: string
    } = {}
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {
      const h = heuristicPass(sectionText, sectionName, plot, minWords)
      return NextResponse.json({ ...h, minWords, source: "heuristic_parse_fail" })
    }

    const accuracy = Number(parsed.accuracy) || 0
    const vocabulary = Number(parsed.vocabulary) || 0
    const structure_fit = Number(parsed.structure_fit) || 0
    const pass =
      !!parsed.pass &&
      accuracy >= tAccuracy &&
      vocabulary >= tVocab &&
      structure_fit >= tStructure

    return NextResponse.json({
      pass,
      accuracy,
      vocabulary,
      structure_fit,
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Keep revising this section.",
      minWords,
      source: "ai",
    })
  } catch (e) {
    console.error("[story-section-gate]", e)
    return NextResponse.json(
      { pass: false, feedback: "Could not check this section right now. Try again.", error: "gate_failed" },
      { status: 200 },
    )
  }
}
