import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// ─── Environment ───────────────────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'dev-secret-change-in-production'
)
const TOKEN_EXPIRY = '24h'
const COOKIE_NAME = 'admin_token'

// ─── Payload shape ──────────────────────────────────────────────────────────
export interface AdminJWTPayload extends JWTPayload {
  sub: string        // adminId (cuid)
  username: string
  role: 'admin' | 'teacher'
  name?: string
}

// ─── JWT Sign / Verify ───────────────────────────────────────────────────────
export async function signAdminToken(
  payload: Omit<AdminJWTPayload, keyof JWTPayload>
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(payload.sub)
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(
  token: string
): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })
    return payload as AdminJWTPayload
  } catch {
    return null
  }
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────
export function getTokenFromRequest(request: Request): string | null {
  // Support both cookie header and Authorization: Bearer header
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => {
      const [k, ...v] = c.split('=')
      return [k, v.join('=')]
    })
  )
  return (
    cookies[COOKIE_NAME] ??
    request.headers.get('Authorization')?.replace('Bearer ', '') ??
    null
  )
}

export function buildSetCookieHeader(
  token: string,
  maxAge = 60 * 60 * 24
): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export function buildClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export { COOKIE_NAME }
