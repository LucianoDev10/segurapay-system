import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  const evidenceUrls = Array.isArray(body.evidence_urls)
    ? (body.evidence_urls as unknown[]).filter((u): u is string => typeof u === 'string')
    : []

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('status, seller_id')
    .eq('id', id)
    .single()

  if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  if (tx.seller_id !== user.id) return NextResponse.json({ error: 'Apenas o vendedor pode enviar evidências' }, { status: 403 })
  if (tx.status !== 'disputed') return NextResponse.json({ error: 'Transação não está em disputa' }, { status: 422 })

  // Tenta salvar com evidências; se a coluna ainda não existir, salva só a nota
  const { error: errFull } = await admin
    .from('transactions')
    .update({ seller_dispute_note: note || null, seller_dispute_evidence_urls: evidenceUrls })
    .eq('id', id)

  if (errFull) {
    const { error: errBasic } = await admin
      .from('transactions')
      .update({ seller_dispute_note: note || null })
      .eq('id', id)
    if (errBasic) return NextResponse.json({ error: errBasic.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
