import { NextRequest, NextResponse } from 'next/server'
import { buildClearCookieHeader } from '@/lib/admin-auth'
import { getTokenFromRequest } from '@/lib/admin-auth'
import { verifyAdminToken } from '@/lib/admin-auth'
import { logAudit } from '@/lib/admin-audit'

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request)
  let adminId = 'unknown'

  if (token) {
    const payload = await verifyAdminToken(token)
    if (payload) {
      adminId = payload.sub
      await logAudit(adminId, 'logout', 'admin', adminId)
    }
  }

  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', buildClearCookieHeader())
  return response
}
