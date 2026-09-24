import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { chat, isConfigured } from "@/lib/deepseek"

type Piece = { type: string; text: string }

const clampLevel = (value: number) => Math.min(5, Math.max(1, Math.round(value)))
const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

function localScores(pieces: Piece[]) {
  const text = pieces.map((piece) => piece.text).join("\n")
  const words = text.toLowerCase().match(/[a-z']+/g) || []
  const sentences = text.split(/[.!?。！？]+/).map((part) => part.trim()).filter(Boolean)
  const unique = words.length ? new Set(words).size / words.length : 0
  const avgLen = sentences.length ? words.length / sentences.length : words.length
  const endings = (text.match(/[.!?]/g) || []).length
  const grammar = clampScore(35 + endings * 4 + Math.min(30, unique * 40))
  const coverage = clampScore(30 + Math.min(50, words.length / 8) + unique * 20)
  const alignment = clampScore(25 + Math.min(45, sentences.length * 8) + (paragraphs(text) > 1 ? 15 : 0))
  const density = clampScore(avgLen >= 6 && avgLen <= 18 ? 75 : avgLen < 6 ? 45 : 60)
  const avg = (grammar + coverage + alignment + density) / 4
  const level = avg < 40 ? 1 : avg < 55 ? 2 : avg < 70 ? 3 : avg < 84 ? 4 : 5
  return {
    grammarFluency: grammar,
    contentCoverage: coverage,
    stageAlignment: alignment,
    lengthDensity: density,
    level,
  }
}

function paragraphs(text: string) {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).length
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { user_id?: string; language?: string; testLevel?: number }
    const username = body.user_id?.trim()
    if (!username) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [stories, reviews, letters, dramas, poetries] = await Promise.all([
      prisma.story.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 3, select: { content: true } }),
      prisma.review.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 2, select: { content: true, bookTitle: true } }),
      prisma.letter.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 2, select: { content: true } }),
      prisma.drama.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 2, select: { content: true, title: true } }),
      prisma.poetry.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 2, select: { content: true, topic: true } }),
    ])

    const pieces: Piece[] = [
      ...stories.map((item) => ({ type: "story", text: item.content })),
      ...reviews.map((item) => ({ type: "book review", text: `${item.bookTitle || ""}\n${item.content}` })),
      ...letters.map((item) => ({ type: "letter", text: item.content })),
      ...dramas.map((item) => ({ type: "drama", text: `${item.title || ""}\n${item.content}` })),
      ...poetries.map((item) => ({ type: "poetry", text: `${item.topic || ""}\n${item.content}` })),
    ]
      .map((piece) => ({ ...piece, text: piece.text.replace(/\s+/g, " ").trim() }))
      .filter((piece) => piece.text.length >= 40)
      .slice(0, 4)

    const testLevel = clampLevel(body.testLevel || 1)
    if (!pieces.length) {
      return NextResponse.json({
        source: "test",
        level: testLevel,
        sampleCount: 0,
        scores: null,
        reason: "This level comes from your first level check. After you finish a piece of writing, the shelf will look at that writing and suggest the next level.",
      })
    }

    const fallback = localScores(pieces)

    if (!isConfigured()) {
      return NextResponse.json({
        source: "heuristic",
        level: fallback.level,
        sampleCount: pieces.length,
        scores: fallback,
        reason: `I looked at ${pieces.length} past piece${pieces.length > 1 ? "s" : ""}. Grammar & fluency, how much of the task you covered, whether the writing matches its stage, and how long and full the sentences are all point to Level ${fallback.level}.`,
      })
    }

    const samples = pieces
      .map((piece, index) => `Piece ${index + 1} (${piece.type}):\n${piece.text.slice(0, 900)}`)
      .join("\n\n")

    let raw = ""
    try {
      raw = await chat({
        messages: [
          {
            role: "system",
            content: `You place a child writer on a level from 1 to 5.
Score these four dimensions from 0 to 100 using the past writings:
- grammarFluency: Grammar & Fluency
- contentCoverage: Content Coverage Matcher (how fully the writing covers what that genre should include)
- stageAlignment: Stage Alignment Classifier (does the text match the genre: story, review, letter, drama, or poetry)
- lengthDensity: Length & Information Density
Then choose one level. 1 is short simple sentences. 5 is richer, accurate, well organized writing.
Reply with ONE JSON object only:
{"level":1-5,"grammarFluency":0-100,"contentCoverage":0-100,"stageAlignment":0-100,"lengthDensity":0-100,"reason":"2-4 short sentences"}
The reason MUST be in simple English only, even if the writing is discussed in another language. Name the four dimensions in plain words, and mention what in the past writing led to this level. Do not mention scores as the only evidence.`,
          },
          { role: "user", content: `Current tested level: ${testLevel}\n\n${samples}` },
        ],
        temperature: 0.2,
        maxTokens: 500,
      })
    } catch (error) {
      console.error("[writing-level] DeepSeek error:", error)
      return NextResponse.json({
        source: "heuristic",
        level: fallback.level,
        sampleCount: pieces.length,
        scores: fallback,
        reason: `I looked at ${pieces.length} past piece${pieces.length > 1 ? "s" : ""}. Grammar & fluency, content coverage, stage alignment, and length & information density point to Level ${fallback.level}.`,
      })
    }

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({
        source: "heuristic",
        level: fallback.level,
        sampleCount: pieces.length,
        scores: fallback,
        reason: `Your past writing fits Level ${fallback.level}.`,
      })
    }

    const parsed = JSON.parse(match[0]) as {
      level?: number
      grammarFluency?: number
      contentCoverage?: number
      stageAlignment?: number
      lengthDensity?: number
      reason?: string
    }

    return NextResponse.json({
      source: "ai",
      level: clampLevel(Number(parsed.level) || fallback.level),
      sampleCount: pieces.length,
      scores: {
        grammarFluency: clampScore(Number(parsed.grammarFluency) || fallback.grammarFluency),
        contentCoverage: clampScore(Number(parsed.contentCoverage) || fallback.contentCoverage),
        stageAlignment: clampScore(Number(parsed.stageAlignment) || fallback.stageAlignment),
        lengthDensity: clampScore(Number(parsed.lengthDensity) || fallback.lengthDensity),
      },
      reason: String(parsed.reason || "").trim() || `Your past writing fits Level ${fallback.level}.`,
    })
  } catch (error) {
    console.error("[writing-level]", error)
    return NextResponse.json({ error: "level_check_failed" }, { status: 500 })
  }
}
