import { prisma } from './prisma'
import { startOfDay, startOfMonth, subDays } from 'date-fns'

interface DailySignup {
  date: string
  count: number
}

interface WorkDistribution {
  stories: number
  reviews: number
  letters: number
  dramas: number
  poetries: number
}

interface RecentUser {
  id: string
  username: string
  role: string
  createdAt: Date
  totalWorks: number
}

export interface DashboardData {
  totalUsers: number
  newThisMonth: number
  newToday: number
  totalWorks: number
  interactionsThisMonth: number
  workDistribution: WorkDistribution
  dailySignups: DailySignup[]
  recentUsers: RecentUser[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const startOfThisMonth = startOfMonth(now)
  const startOfToday = startOfDay(now)
  const thirtyDaysAgo = subDays(startOfDay(now), 30)

  const [
    totalUsers,
    newThisMonth,
    newToday,
    totalStories,
    totalReviews,
    totalLetters,
    totalDramas,
    totalPoetries,
    interactionsThisMonth,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.story.count(),
    prisma.review.count(),
    prisma.letter.count(),
    prisma.drama.count(),
    prisma.poetry.count(),
    prisma.interaction.count({ where: { timestamp: { gte: startOfThisMonth } } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
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
  ])

  const dailySignups = await prisma.$queryRaw<
    { date: string; count: bigint }[]
  >`
    SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
    FROM users
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `.then((rows) =>
    rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }))
  )

  return {
    totalUsers,
    newThisMonth,
    newToday,
    totalWorks: totalStories + totalReviews + totalLetters + totalDramas + totalPoetries,
    interactionsThisMonth,
    workDistribution: {
      stories: totalStories,
      reviews: totalReviews,
      letters: totalLetters,
      dramas: totalDramas,
      poetries: totalPoetries,
    },
    dailySignups,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      totalWorks:
        u._count.stories +
        u._count.reviews +
        u._count.letters +
        u._count.dramas +
        u._count.poetries,
    })),
  }
}
