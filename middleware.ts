import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/login']

// Routes only admins can access (teachers are redirected away)
const ADMIN_ONLY_PATHS = ['/admin/admins', '/admin/audit-logs', '/admin/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — always let through
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // All other /admin/* and /api/admin/* routes require authentication
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin')
  ) {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return handleUnauthenticated(request, pathname)
    }

    const payload = await verifyAdminToken(token)
    if (!payload) {
      // Token invalid/expired — clear it and redirect
      const response = handleUnauthenticated(request, pathname)
      response.cookies.delete(COOKIE_NAME)
      return response
    }

    // Admin-only routes: teachers cannot access
    if (
      payload.role !== 'admin' &&
      ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))
    ) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

function handleUnauthenticated(
  request: NextRequest,
  pathname: string
): NextResponse {
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
