import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAdminToken } from '@/lib/admin-auth'
import { logAudit } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') ?? '20', 10)))
  const skip = (page - 1) * pageSize

  const role = searchParams.get('role')      // 'student' | 'teacher' | null
  const noAi = searchParams.get('noAi')       // 'true' | 'false' | null
  const grade = searchParams.get('grade')     // 'P1'-'P6' or null
  const search = searchParams.get('search')   // keyword or null

  const where: Record<string, unknown> = {}
  if (role && role !== 'all') where.role = role
  if (noAi === 'true') where.noAi = true
  else if (noAi === 'false') where.noAi = false
  if (grade && grade !== 'all') {
    where.profile = { grade }
  }
  if (search) {
    where.username = { contains: search, mode: 'insensitive' }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        noAi: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: { grade: true, avatarEmoji: true, avatarUrl: true },
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
    prisma.user.count({ where }),
  ])

  // Log view
  await logAudit(payload.sub, 'view_user', 'system', undefined, {
    extra: { role, noAi, grade, search },
  })

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      noAi: u.noAi,
      grade: u.profile?.grade ?? null,
      avatarEmoji: u.profile?.avatarEmoji ?? null,
      createdAt: u.createdAt,
      totalWorks:
        u._count.stories +
        u._count.reviews +
        u._count.letters +
        u._count.dramas +
        u._count.poetries,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
