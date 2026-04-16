import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  // Import verifyAdminToken lazily to avoid circular issues
  const { verifyAdminToken } = await import('@/lib/admin-auth')
  const payload = await verifyAdminToken(token)

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: payload.sub,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    },
  })
}
