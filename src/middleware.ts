import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/nova-transacao', '/transacao', '/minhas-transacoes', '/perfil', '/disputas', '/vault']
const ADMIN_ROUTES = ['/admin']
const ADMIN_PUBLIC = ['/admin/login']

function isProtected(pathname: string) {
  return PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    && !ADMIN_PUBLIC.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Coleta cookies que o Supabase precisar renovar
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookiesToSet.push(c)),
      },
    },
  )

  // Única chamada de auth — verifica e renova sessão se necessário
  const { data: { user } } = await supabase.auth.getUser()

  // ── Guards ────────────────────────────────────────────────
  if (isProtected(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/nova-transacao', request.url))
  }

  if (isAdminRoute(pathname)) {
    const token = request.cookies.get('admin_token')?.value
    if (!token || token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ── Monta resposta com headers para Server Components ─────
  const requestHeaders = new Headers(request.headers)
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email ?? '')
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Repassa cookies de sessão renovados para o browser
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
