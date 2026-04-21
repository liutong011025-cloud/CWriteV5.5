import { NextResponse } from "next/server"
import { format, startOfDay, subDays, subHours } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [users, totalStories, totalReviews, totalLetters, totalDramas, totalPoetries, interactions] =
      await Promise.all([
        prisma.user.findMany({
          where: { role: "student" },
          orderBy: { createdAt: "asc" },
          include: {
            profile: {
              select: {
                avatarUrl: true,
                avatarEmoji: true,
                grade: true,
              },
            },
            _count: {
              select: {
                stories: true,
                reviews: true,
                letters: true,
                dramas: true,
                poetries: true,
              },
            },
          },
        }),
        prisma.story.count(),
        prisma.review.count(),
        prisma.letter.count(),
        prisma.drama.count(),
        prisma.poetry.count(),
        prisma.interaction.findMany({
          select: {
            id: true,
            userId: true,
            timestamp: true,
            apiCalls: true,
          },
          orderBy: { timestamp: "desc" },
        }),
      ])

    const now = new Date()
    const periodStart = subDays(startOfDay(now), 13)
    const dayKeys = Array.from({ length: 14 }).map((_, index) =>
      format(addDays(periodStart, index), "yyyy-MM-dd"),
    )
    const registrationsMap = new Map(dayKeys.map((key) => [key, 0]))
    const apiCallsMap = new Map(dayKeys.map((key) => [key, 0]))
    const tokensMap = new Map(dayKeys.map((key) => [key, 0]))
    const hourlyKeys = Array.from({ length: 24 }).map((_, index) => {
      const d = subHours(now, 23 - index)
      return format(d, "MM-dd HH:00")
    })
    const hourlyTokensMap = new Map(hourlyKeys.map((key) => [key, 0]))

    users.forEach((item: (typeof users)[number]) => {
      const key = format(item.createdAt, "yyyy-MM-dd")
      if (registrationsMap.has(key)) {
        registrationsMap.set(key, (registrationsMap.get(key) ?? 0) + 1)
      }
    })

    const activeUserIds = new Set<string>()
    const activeThreshold = subHours(now, 24)
    let totalApiCalls = 0

    interactions.forEach((interaction: (typeof interactions)[number]) => {
      if (interaction.timestamp >= activeThreshold) {
        activeUserIds.add(interaction.userId)
      }
      const calls = normalizeApiCalls(interaction.apiCalls)
      const apiCallsLength = calls.length
      totalApiCalls += apiCallsLength
      const tokenCount = calls.reduce((sum, call) => sum + estimateTokens(call), 0)

      const key = format(interaction.timestamp, "yyyy-MM-dd")
      if (apiCallsMap.has(key)) {
        apiCallsMap.set(key, (apiCallsMap.get(key) ?? 0) + apiCallsLength)
      }
      if (tokensMap.has(key)) {
        tokensMap.set(key, (tokensMap.get(key) ?? 0) + tokenCount)
      }

      const hourKey = format(interaction.timestamp, "MM-dd HH:00")
      if (hourlyTokensMap.has(hourKey)) {
        hourlyTokensMap.set(hourKey, (hourlyTokensMap.get(hourKey) ?? 0) + tokenCount)
      }
    })

    const latestActivityMap = new Map<string, Date>()
    interactions.forEach((interaction: (typeof interactions)[number]) => {
      const previous = latestActivityMap.get(interaction.userId)
      if (!previous || interaction.timestamp > previous) {
        latestActivityMap.set(interaction.userId, interaction.timestamp)
      }
    })

    return NextResponse.json({
      metrics: {
        registeredUsers: users.length,
        activeUsers: activeUserIds.size,
        totalArticles: totalStories + totalReviews + totalLetters + totalDramas + totalPoetries,
        totalApiCalls,
      },
      workDistribution: {
        stories: totalStories,
        reviews: totalReviews,
        letters: totalLetters,
        dramas: totalDramas,
        poetries: totalPoetries,
      },
      trends: {
        dailyRegistrations: dayKeys.map((date) => ({ date, count: registrationsMap.get(date) ?? 0 })),
        dailyApiCalls: dayKeys.map((date) => ({ date, count: apiCallsMap.get(date) ?? 0 })),
      },
      analytics: {
        articleTypePie: [
          { name: "Story", value: totalStories },
          { name: "Review", value: totalReviews },
          { name: "Letter", value: totalLetters },
          { name: "Drama", value: totalDramas },
          { name: "Poetry", value: totalPoetries },
        ],
        tokenUsageDaily: dayKeys.map((date) => ({ date, tokens: tokensMap.get(date) ?? 0 })),
        tokenPeakHourly: hourlyKeys.map((time) => ({ time, tokens: hourlyTokensMap.get(time) ?? 0 })),
      },
      classGroups: [
        {
          id: "class1",
          name: "Class 1",
          users: users
            .map((item: (typeof users)[number]) => ({
              id: item.id,
              username: item.username,
              role: item.role,
              avatarUrl: item.profile?.avatarUrl ?? null,
              avatarEmoji: item.profile?.avatarEmoji ?? null,
              grade: item.profile?.grade ?? null,
              totalWorks:
                item._count.stories +
                item._count.reviews +
                item._count.letters +
                item._count.dramas +
                item._count.poetries,
              latestActiveAt: latestActivityMap.get(item.id)?.toISOString() ?? null,
            }))
            .sort(
              (
                a: {
                  username: string
                },
                b: {
                  username: string
                },
              ) => a.username.localeCompare(b.username),
            ),
        },
      ],
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("[teacher dashboard] GET failed:", error)
    return NextResponse.json({ error: "Failed to load teacher dashboard data" }, { status: 500 })
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function normalizeApiCalls(input: unknown): Array<Record<string, unknown>> {
  if (!input) return []
  if (Array.isArray(input)) return input.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>
  if (typeof input === "object") return [input as Record<string, unknown>]
  return []
}

function estimateTokens(call: Record<string, unknown>): number {
  const directTotal = Number(call.total_tokens ?? call.totalTokens ?? 0)
  if (Number.isFinite(directTotal) && directTotal > 0) return directTotal

  const usage = call.usage
  if (usage && typeof usage === "object") {
    const usageObj = usage as Record<string, unknown>
    const usageTotal = Number(usageObj.total_tokens ?? usageObj.totalTokens ?? 0)
    if (Number.isFinite(usageTotal) && usageTotal > 0) return usageTotal
    const prompt = Number(usageObj.prompt_tokens ?? usageObj.promptTokens ?? 0)
    const completion = Number(usageObj.completion_tokens ?? usageObj.completionTokens ?? 0)
    const sum = (Number.isFinite(prompt) ? prompt : 0) + (Number.isFinite(completion) ? completion : 0)
    if (sum > 0) return sum
  }

  const roughChars = JSON.stringify(call.request ?? {}).length + JSON.stringify(call.response ?? {}).length
  return Math.max(1, Math.round(roughChars / 4))
}
