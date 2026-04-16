import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAdminToken } from '@/lib/admin-auth'
import { logAudit } from '@/lib/admin-audit'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id]
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
      profile: true,
      _count: {
        select: {
          stories: true,
          reviews: true,
          letters: true,
          dramas: true,
          poetries: true,
          interactions: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await logAudit(payload.sub, 'view_user_detail', 'user', id)

  return NextResponse.json({
    ...user,
    totalWorks:
      user._count.stories +
      user._count.reviews +
      user._count.letters +
      user._count.dramas +
      user._count.poetries,
  })
}

// PATCH /api/admin/users/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { username, role, noAi, grade, birthday, gender, email } = body

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Update user fields
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(username !== undefined && { username }),
      ...(role !== undefined && { role }),
      ...(noAi !== undefined && { noAi }),
    },
  })

  // Update profile fields
  if (grade !== undefined || birthday !== undefined || gender !== undefined || email !== undefined) {
    await prisma.userProfile.upsert({
      where: { userId: id },
      create: { userId: id, grade, birthday, gender, email },
      update: {
        ...(grade !== undefined && { grade }),
        ...(birthday !== undefined && { birthday }),
        ...(gender !== undefined && { gender }),
        ...(email !== undefined && { email }),
      },
    })
  }

  await logAudit(payload.sub, 'update_user', 'user', id, {
    before: { username: existing.username, role: existing.role, noAi: existing.noAi },
    after: { username, role, noAi },
  })

  return NextResponse.json({ ok: true, user: updated })
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Delete user (cascades to profile, stories, reviews, etc.)
  await prisma.user.delete({ where: { id } })

  await logAudit(payload.sub, 'delete_user', 'user', id, {
    before: { username: existing.username, role: existing.role },
  })

  return NextResponse.json({ ok: true })
}
