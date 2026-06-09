import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL!),
  )

  // Remove todos os cookies de sessão do Supabase
  const sessionCookies = ['sb-access-token', 'sb-refresh-token']
  sessionCookies.forEach(name => response.cookies.delete(name))

  return response
}
