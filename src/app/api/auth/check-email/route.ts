import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ exists: false })
  }

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers()
  const exists = data?.users?.some(u => u.email?.toLowerCase() === email) ?? false

  return NextResponse.json({ exists })
}
