import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAdminToken, buildSetCookieHeader } from '@/lib/admin-auth'
import { logAudit } from '@/lib/admin-audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update lastLoginAt
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    // Log audit
    await logAudit(admin.id, 'login', 'admin', admin.id, {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    })

    // Sign JWT
    const token = await signAdminToken({
      sub: admin.id,
      username: admin.username,
      role: admin.role as 'admin' | 'teacher',
      name: admin.name ?? undefined,
    })

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        assignedClass: admin.assignedClass,
      },
    })

    response.headers.set('Set-Cookie', buildSetCookieHeader(token))
    return response
  } catch (error) {
    console.error('[admin/login]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
