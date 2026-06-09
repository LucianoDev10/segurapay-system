import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimitKey = `admin-login:${ip}`

  const { allowed, retryAfter, remaining } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfter! / 60)} minutos.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const { password } = body

  const adminPassword = process.env.ADMIN_PASSWORD ?? ''

  if (
    !password ||
    typeof password !== 'string' ||
    !safeCompare(password, adminPassword)
  ) {
    return NextResponse.json(
      { error: `Senha incorreta. ${remaining} tentativa(s) restante(s).` },
      { status: 401 },
    )
  }

  // Login bem-sucedido — reseta o contador do IP
  resetRateLimit(rateLimitKey)

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}
