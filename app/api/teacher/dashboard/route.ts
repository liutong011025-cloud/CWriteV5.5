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
    const dayKeys = Array.from({ length: 14 }).map((_, index) => format(addDays(periodStart, index), "yyyy-MM-dd"))
    const tokenDailyMap = new Map(dayKeys.map((key) => [key, 0]))
    const hourlyTokenMap = new Map(Array.from({ length: 24 }).map((_, hour) => [String(hour).padStart(2, "0"), 0]))

    users.forEach((item) => {
      // keep warm for future class allocation logic
      void item.createdAt
    })

    const activeUserIds = new Set<string>()
    const activeThreshold = subHours(now, 24)
    let totalApiCalls = 0

    interactions.forEach((interaction) => {
      if (interaction.timestamp >= activeThreshold) {
        activeUserIds.add(interaction.userId)
      }
      const apiCallsLength = Array.isArray(interaction.apiCalls) ? interaction.apiCalls.length : 0
      const tokenEstimate = estimateTokensFromApiCalls(interaction.apiCalls)
      totalApiCalls += apiCallsLength

      const key = format(interaction.timestamp, "yyyy-MM-dd")
      if (tokenDailyMap.has(key)) {
        tokenDailyMap.set(key, (tokenDailyMap.get(key) ?? 0) + tokenEstimate)
      }
      const hourKey = String(interaction.timestamp.getHours()).padStart(2, "0")
      if (hourlyTokenMap.has(hourKey)) {
        hourlyTokenMap.set(hourKey, (hourlyTokenMap.get(hourKey) ?? 0) + tokenEstimate)
      }
    })

    const latestActivityMap = new Map<string, Date>()
    interactions.forEach((interaction) => {
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
        dailyTokenUsage: dayKeys.map((date) => ({ date, tokens: tokenDailyMap.get(date) ?? 0 })),
        hourlyTokenPeaks: Array.from(hourlyTokenMap.entries()).map(([hour, tokens]) => ({
          hour: `${hour}:00`,
          tokens,
        })),
      },
      classGroups: [
        {
          id: "class1",
          name: "Class 1",
          users: users
            .map((item) => ({
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
            .sort((a, b) => a.username.localeCompare(b.username)),
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

function estimateTokensFromApiCalls(apiCalls: unknown): number {
  if (!Array.isArray(apiCalls)) return 0
  return apiCalls.reduce((sum, call) => {
    try {
      const payload = JSON.stringify(call)
      return sum + Math.max(0, Math.round(payload.length / 4))
    } catch {
      return sum
    }
  }, 0)
}
