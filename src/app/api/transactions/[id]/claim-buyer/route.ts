import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('status, buyer_id')
    .eq('id', id)
    .single()

  if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })

  // Já está associado a este usuário
  if (tx.buyer_id === user.id) {
    return NextResponse.json({ ok: true, redirectTo: `/transacao/${id}` })
  }

  // Transação ainda não foi paga
  const paidStatuses = ['paid', 'tracked', 'delivered', 'complaint_period', 'disputed', 'released', 'resolved']
  if (!paidStatuses.includes(tx.status)) {
    return NextResponse.json({ error: 'Transação ainda não foi paga' }, { status: 409 })
  }

  // Garante que o usuário tenha role buyer na tabela users
  await admin.from('users').update({ role: 'buyer' }).eq('id', user.id)

  // Associa a transação ao usuário logado
  const { error } = await admin
    .from('transactions')
    .update({ buyer_id: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, redirectTo: `/transacao/${id}` })
}
