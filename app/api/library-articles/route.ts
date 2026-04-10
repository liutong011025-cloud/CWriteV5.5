import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractArticlesFromInteractions } from "@/lib/gallery-articles"

/** 全站Feed：控制体量，避免一次拉整库 */
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
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ articles: [] })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const rawLimit = searchParams.get("limit")

    let user: { id: string } | null = null
    if (userId) {
      user = await prisma.user.findUnique({
        where: { username: userId },
        select: { id: true },
      })
      if (!user) {
        return NextResponse.json({ articles: [] })
      }
    }

    const isSelfScope = !!user
    const defaultLimit = isSelfScope ? SELF_DEFAULT_LIMIT : GLOBAL_DEFAULT_LIMIT
    const maxLimit = isSelfScope ? SELF_MAX_LIMIT : GLOBAL_MAX_LIMIT
    let limit = defaultLimit
    if (rawLimit) {
      const n = parseInt(rawLimit, 10)
      if (Number.isFinite(n) && n > 0) {
        limit = Math.min(n, maxLimit)
      }
    }

    const where = user ? { userId: user.id } : {}

    const interactions = await prisma.interaction.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        id: true,
        stage: true,
        timestamp: true,
        user: { select: { username: true } },
      },
    })

    const storyIds = interactions.map((i) => i.id)
    if (storyIds.length === 0) {
      return NextResponse.json({ articles: [] })
    }

    const [stories, reviews, letters, dramas, poetries] = await Promise.all([
      prisma.story.findMany({
        where: { interactionId: { in: storyIds } },
        select: {
          interactionId: true,
          content: true,
          character: true,
        },
      }),
      prisma.review.findMany({
        where: { interactionId: { in: storyIds } },
        select: {
          interactionId: true,
          content: true,
          reviewType: true,
          bookTitle: true,
          bookCoverUrl: true,
        },
      }),
      prisma.letter.findMany({
        where: { interactionId: { in: storyIds } },
        select: {
          interactionId: true,
          content: true,
          recipient: true,
          occasion: true,
        },
      }),
      prisma.drama.findMany({
        where: { interactionId: { in: storyIds } },
        select: {
          interactionId: true,
          content: true,
          title: true,
          summary: true,
        },
      }),
      prisma.poetry.findMany({
        where: { interactionId: { in: storyIds } },
        select: {
          interactionId: true,
          content: true,
          form: true,
          topic: true,
        },
      }),
    ])

    const storyMap = new Map(stories.map((s) => [s.interactionId!, s]))
    const reviewMap = new Map(reviews.map((r) => [r.interactionId!, r]))
    const letterMap = new Map(letters.map((l) => [l.interactionId!, l]))
    const dramaMap = new Map(dramas.map((d) => [d.interactionId!, d]))
    const poetryMap = new Map(poetries.map((p) => [p.interactionId!, p]))

    const formattedInteractions = interactions.map((interaction) => {
      const story = storyMap.get(interaction.id)
      const review = reviewMap.get(interaction.id)
      const letter = letterMap.get(interaction.id)
      const drama = dramaMap.get(interaction.id)
      const poetry = poetryMap.get(interaction.id)

      const result: Record<string, unknown> = {
        user_id: interaction.user.username,
        timestamp: interaction.timestamp.getTime(),
        stage: interaction.stage,
      }

      if (story) {
        result.story = story.content
        result.character = story.character
      }
      if (review) {
        result.review = review.content
        result.reviewType = review.reviewType
        result.bookTitle = review.bookTitle
        result.bookCoverUrl = review.bookCoverUrl
      }
      if (letter) {
        result.letter = letter.content
        result.recipient = letter.recipient
        result.occasion = letter.occasion
      }
      if (drama) {
        result.drama = drama.content
        result.dramaTitle = drama.title
        result.dramaSummary = drama.summary
      }
      if (poetry) {
        result.poetry = poetry.content
        result.poetryForm = poetry.form
        result.poetryTopic = poetry.topic
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
