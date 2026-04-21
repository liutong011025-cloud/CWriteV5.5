import { NextRequest, NextResponse } from "next/server"
import { prisma, isDatabaseUrlConfigured } from "@/lib/prisma"
import { extractArticlesFromInteractions } from "@/lib/gallery-articles"

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : ""
}

/** 与旧版 /api/interactions 一致：正文可能在关联表，也可能只在 interaction.output / output.data 里 */
function mergeFromOutput(
  output: unknown,
  keys: { top: string[]; data: string[] }
): Record<string, string> {
  const o = asRecord(output)
  const d = asRecord(o.data)
  const out: Record<string, string> = {}
  for (const k of keys.top) {
    const v = asStr(o[k])
    if (v) out[k] = v
  }
  for (const k of keys.data) {
    const v = asStr(d[k])
    if (v && !out[k]) out[k] = v
  }
  return out
}

/** 全站Feed：默认限流；用户要求全量时可显式 all=1 */
const GLOBAL_DEFAULT_LIMIT = 300
const GLOBAL_MAX_LIMIT = 600
/** 指定 user_id 时：拉该用户自己的交互（与旧版「全量 interactions」对个人而言一致） */
const SELF_DEFAULT_LIMIT = 10000
const SELF_MAX_LIMIT = 15000

/**
 * 图书馆专用：只查最近 N 条交互及关联作品，不返回 input/output/apiCalls 等大字段。
 * 不带 user_id：全站最近 GLOBAL_*；带 user_id：该用户最近 SELF_*（上限更高）。
 */
export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseUrlConfigured()) {
      return NextResponse.json({ articles: [] })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const rawLimit = searchParams.get("limit")
    const requestAll = searchParams.get("all") === "1"

    const isSelfScope = !!userId
    const defaultLimit = isSelfScope ? SELF_DEFAULT_LIMIT : GLOBAL_DEFAULT_LIMIT
    const maxLimit = isSelfScope ? SELF_MAX_LIMIT : GLOBAL_MAX_LIMIT
    let limit = defaultLimit
    if (rawLimit) {
      const n = parseInt(rawLimit, 10)
      if (Number.isFinite(n) && n > 0) {
        limit = Math.min(n, maxLimit)
      }
    }

    const interactions = await prisma.interaction.findMany({
      where: userId ? { user: { username: userId } } : undefined,
      orderBy: { timestamp: "desc" },
      take: requestAll ? undefined : limit,
      select: {
        id: true,
        stage: true,
        timestamp: true,
        output: true,
        user: { select: { username: true } },
        stories: {
          select: {
            content: true,
            character: true,
          },
        },
        reviews: {
          select: {
            content: true,
            reviewType: true,
            bookTitle: true,
            bookCoverUrl: true,
          },
        },
        letters: {
          select: {
            content: true,
            recipient: true,
            occasion: true,
          },
        },
        drama: {
          select: {
            content: true,
            title: true,
            summary: true,
          },
        },
        poetry: {
          select: {
            content: true,
            form: true,
            topic: true,
          },
        },
      },
    })

    if (interactions.length === 0) {
      return NextResponse.json({ articles: [] })
    }

    const formattedInteractions = interactions.map((interaction) => {
      const story = interaction.stories
      const review = interaction.reviews
      const letter = interaction.letters
      const drama = interaction.drama
      const poetry = interaction.poetry
      const out = interaction.output

      const reviewFromOut = mergeFromOutput(out, {
        top: ["review", "reviewType", "bookTitle", "bookCoverUrl"],
        data: ["review", "reviewType", "bookTitle", "bookCoverUrl"],
      })
      const letterFromOut = mergeFromOutput(out, {
        top: ["letter", "recipient", "occasion"],
        data: ["letter", "recipient", "occasion"],
      })
      const dramaFromOut = mergeFromOutput(out, {
        top: ["drama", "dramaTitle", "dramaSummary"],
        data: ["drama", "dramaTitle", "dramaSummary"],
      })
      const poetryFromOut = mergeFromOutput(out, {
        top: ["poetry", "poetryForm", "poetryTopic"],
        data: ["poetry", "poetryForm", "poetryTopic"],
      })

      const result: Record<string, unknown> = {
        user_id: interaction.user.username,
        timestamp: interaction.timestamp.getTime(),
        stage: interaction.stage,
      }

      if (story) {
        result.story = story.content || asStr(asRecord(out).story)
        result.character = story.character
      }
      // asStr(x) || y 在 x 为 "" 且 y 为 undefined 时会得到 undefined，禁止对 undefined 调 .trim()
      const rawReview = asStr(review?.content || reviewFromOut.review)
      if (rawReview.trim()) {
        result.review = rawReview
        result.reviewType = review?.reviewType ?? reviewFromOut.reviewType ?? undefined
        result.bookTitle = review?.bookTitle ?? reviewFromOut.bookTitle ?? undefined
        result.bookCoverUrl = review?.bookCoverUrl ?? reviewFromOut.bookCoverUrl ?? undefined
      }
      const rawLetter = asStr(letter?.content || letterFromOut.letter)
      if (rawLetter.trim()) {
        result.letter = rawLetter
        result.recipient = letter?.recipient ?? letterFromOut.recipient ?? undefined
        result.occasion = letter?.occasion ?? letterFromOut.occasion ?? undefined
      }
      const rawDrama = asStr(drama?.content || dramaFromOut.drama)
      if (rawDrama.trim()) {
        result.drama = rawDrama
        result.dramaTitle = drama?.title ?? dramaFromOut.dramaTitle ?? undefined
        result.dramaSummary = drama?.summary ?? dramaFromOut.dramaSummary ?? undefined
      }
      const rawPoetry = asStr(poetry?.content || poetryFromOut.poetry)
      if (rawPoetry.trim()) {
        result.poetry = rawPoetry
        result.poetryForm = poetry?.form ?? poetryFromOut.poetryForm ?? undefined
        result.poetryTopic = poetry?.topic ?? poetryFromOut.poetryTopic ?? undefined
      }

      return result
    })

    const articles = extractArticlesFromInteractions(formattedInteractions)
    return NextResponse.json({ articles })
  } catch (error) {
    console.error("library-articles GET error:", error)
    return NextResponse.json({ articles: [] }, { status: 200 })
  }
}
