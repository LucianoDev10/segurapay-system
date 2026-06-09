import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/nova-transacao'

  // Sanitiza o next para evitar open redirect
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/nova-transacao'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // Monta a response de redirect primeiro para poder escrever cookies nela
  const redirectTo = `${origin}${next}`
  const response = NextResponse.redirect(redirectTo)

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // Escreve os cookies de sessão na response de redirect
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
  )

  return response
}
