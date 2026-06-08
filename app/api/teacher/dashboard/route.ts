import { NextResponse } from "next/server"
import { format, startOfDay, subDays, subHours } from "date-fns"
import { prisma } from "@/lib/prisma"
import { isDatabaseConnectionError } from "@/lib/prisma-errors"

interface DashboardUser {
  id: string
  username: string
  role: string
  createdAt: Date
  profile: {
    avatarUrl: string | null
    avatarEmoji: string | null
    grade: string | null
  } | null
  _count: {
    stories: number
    reviews: number
    letters: number
    dramas: number
    poetries: number
  }
}

interface DashboardInteraction {
  userId: string
  timestamp: Date
  apiCalls: unknown
}

export async function GET() {
  try {
    const [users, interactions] = (await prisma.$transaction([
      prisma.user.findMany({
        where: { role: "student" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
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
      prisma.interaction.findMany({
        select: {
          userId: true,
          timestamp: true,
          apiCalls: true,
        },
        orderBy: { timestamp: "desc" },
      }),
    ])) as [DashboardUser[], DashboardInteraction[]]

    const now = new Date()
    const periodStart = subDays(startOfDay(now), 13)
    const dayKeys = Array.from({ length: 14 }).map((_, index) => format(addDays(periodStart, index), "yyyy-MM-dd"))
    const registrationsMap = new Map(dayKeys.map((key) => [key, 0]))
    const tokenDailyMap = new Map(dayKeys.map((key) => [key, 0]))
    const hourlyTokenMap = new Map(Array.from({ length: 24 }).map((_, hour) => [String(hour).padStart(2, "0"), 0]))

    users.forEach((item: DashboardUser) => {
      const key = format(item.createdAt, "yyyy-MM-dd")
      if (registrationsMap.has(key)) {
        registrationsMap.set(key, (registrationsMap.get(key) ?? 0) + 1)
      }
    })

    const activeUserIds = new Set<string>()
    const activeThreshold = subHours(now, 24)
    let totalApiCalls = 0
    let totalStories = 0
    let totalReviews = 0
    let totalLetters = 0
    let totalDramas = 0
    let totalPoetries = 0

    users.forEach((item: DashboardUser) => {
      totalStories += item._count.stories
      totalReviews += item._count.reviews
      totalLetters += item._count.letters
      totalDramas += item._count.dramas
      totalPoetries += item._count.poetries
    })

    interactions.forEach((interaction: DashboardInteraction) => {
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
    interactions.forEach((interaction: DashboardInteraction) => {
      const previous = latestActivityMap.get(interaction.userId)
      if (!previous || interaction.timestamp > previous) {
        latestActivityMap.set(interaction.userId, interaction.timestamp)
      }
    })

    const classGroups = buildClassGroups(users, latestActivityMap)

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
        dailyTokenUsage: dayKeys.map((date) => ({ date, tokens: tokenDailyMap.get(date) ?? 0 })),
        hourlyTokenPeaks: Array.from(hourlyTokenMap.entries()).map(([hour, tokens]) => ({
          hour: `${hour}:00`,
          tokens,
        })),
      },
      classGroups,
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("[teacher dashboard] GET failed:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(buildEmptyDashboardPayload(new Date(), true))
    }
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

function buildEmptyDashboardPayload(now: Date, degraded = false) {
  const periodStart = subDays(startOfDay(now), 13)
  const dayKeys = Array.from({ length: 14 }).map((_, index) => format(addDays(periodStart, index), "yyyy-MM-dd"))

  return {
    metrics: {
      registeredUsers: 0,
      activeUsers: 0,
      totalArticles: 0,
      totalApiCalls: 0,
    },
    workDistribution: {
      stories: 0,
      reviews: 0,
      letters: 0,
      dramas: 0,
      poetries: 0,
    },
    trends: {
      dailyRegistrations: dayKeys.map((date) => ({ date, count: 0 })),
      dailyTokenUsage: dayKeys.map((date) => ({ date, tokens: 0 })),
      hourlyTokenPeaks: Array.from({ length: 24 }).map((_, hour) => ({
        hour: `${String(hour).padStart(2, "0")}:00`,
        tokens: 0,
      })),
    },
    classGroups: [
      {
        id: "class1",
        name: "Class 1",
        users: [],
      },
    ],
    degraded,
    updatedAt: now.toISOString(),
  }
}

interface DashboardUserSummary {
  id: string
  username: string
  role: string
  avatarUrl: string | null
  avatarEmoji: string | null
  grade: string | null
  totalWorks: number
  latestActiveAt: string | null
}

const UNASSIGNED_CLASS = "Unassigned"

function toUserSummary(
  item: DashboardUser,
  latestActivityMap: Map<string, Date>,
): DashboardUserSummary {
  return {
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
  }
}

function buildClassGroups(
  users: DashboardUser[],
  latestActivityMap: Map<string, Date>,
): Array<{ id: string; name: string; users: DashboardUserSummary[] }> {
  const buckets = new Map<string, DashboardUserSummary[]>()

  for (const item of users) {
    const className = item.profile?.grade?.trim() || UNASSIGNED_CLASS
    const summary = toUserSummary(item, latestActivityMap)
    const list = buckets.get(className) ?? []
    list.push(summary)
    buckets.set(className, list)
  }

  const classNames = Array.from(buckets.keys()).sort((a, b) => {
    if (a === "JCPS") return -1
    if (b === "JCPS") return 1
    if (a === UNASSIGNED_CLASS) return 1
    if (b === UNASSIGNED_CLASS) return -1
    return a.localeCompare(b)
  })

  return classNames.map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    users: (buckets.get(name) ?? []).sort((a, b) => a.username.localeCompare(b.username)),
  }))
}
