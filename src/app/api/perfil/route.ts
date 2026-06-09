import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  let { data } = await admin.from('users').select('*').eq('id', user.id).single()

  if (!data) {
    const name = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuário'
    const { data: created } = await admin
      .from('users')
      .upsert({ id: user.id, email: user.email!, name, role: 'buyer' }, { onConflict: 'id' })
      .select('*')
      .single()
    data = created
  }

  if (!data) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const { name, phone } = body

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .update({
      ...(name ? { name: (name as string).trim() } : {}),
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
    })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  return NextResponse.json(data)
}
