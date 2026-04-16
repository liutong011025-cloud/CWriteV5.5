import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAdminToken } from '@/lib/admin-auth'
import { startOfDay, startOfMonth, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Daily signups for last 30 days
  const dailySignups = await prisma.$queryRaw<
    { date: string; count: bigint }[]
  >`
    SELECT DATE("createdAt") as date, COUNT(*) as count
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

  return NextResponse.json({
    totalUsers,
    newThisMonth,
    newToday,
    totalWorks:
      totalStories + totalReviews + totalLetters + totalDramas + totalPoetries,
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
      ...u,
      totalWorks:
        u._count.stories +
        u._count.reviews +
        u._count.letters +
        u._count.dramas +
        u._count.poetries,
    })),
  })
}
