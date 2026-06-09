import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_token')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const role = searchParams.get('role') ?? ''

  const supabase = createAdminClient()

  let query = supabase
    .from('users')
    .select('id, name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })

  return NextResponse.json(data ?? [])
}
