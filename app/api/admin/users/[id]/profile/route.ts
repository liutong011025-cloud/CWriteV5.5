import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAdminToken } from '@/lib/admin-auth'
import { logAudit } from '@/lib/admin-audit'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id]/profile — full learning profile
export async function GET(request: NextRequest, { params }: Params) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      noAi: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          grade: true,
          gender: true,
          birthday: true,
          email: true,
          avatarEmoji: true,
          avatarUrl: true,
          trees: true,
          lastMetrics: true,
        },
      },
      stories: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          character: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      reviews: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          bookTitle: true,
          reviewType: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      letters: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          recipient: true,
          occasion: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      dramas: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      poetries: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          form: true,
          topic: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      interactions: {
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true,
          stage: true,
          timestamp: true,
        },
      },
      _count: true,
      reviewsReceived: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          reviewerRole: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const totalWorks =
    (user._count as Record<string, number>).stories +
    (user._count as Record<string, number>).reviews +
    (user._count as Record<string, number>).letters +
    (user._count as Record<string, number>).dramas +
    (user._count as Record<string, number>).poetries

  return NextResponse.json({
    ...user,
    totalWorks,
  })
}
