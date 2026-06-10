import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface PixQrCodePaidData {
  payment: { amount: number; fee: number; method: string }
  pixQrCode: { id: string; amount: number; kind: 'PIX'; status: 'PAID' }
}

export async function POST(request: NextRequest) {
  let body: { event: string; data: unknown; devMode: boolean }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Apenas processa billing.paid com pixQrCode
  if (body.event !== 'billing.paid') {
    return NextResponse.json({ ok: true })
  }

  const data = body.data as Partial<PixQrCodePaidData>
  if (!data.pixQrCode?.id) {
    return NextResponse.json({ ok: true })
  }

  const pixId = data.pixQrCode.id
  const admin = createAdminClient()

  // Busca a transação pelo payment_id
  const { data: tx, error } = await admin
    .from('transactions')
    .select('id, status, seller_id')
    .eq('payment_id', pixId)
    .single()

  if (error || !tx) {
    console.error('[webhook] transação não encontrada para payment_id:', pixId)
    return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  }

  if (tx.status !== 'pending') {
    // Idempotência — já foi processado
    return NextResponse.json({ ok: true })
  }

  const paidAt = new Date()
  const trackingDeadline = new Date(paidAt.getTime() + 96 * 60 * 60 * 1000)

  let updateResult = await admin
    .from('transactions')
    .update({ status: 'paid', paid_at: paidAt.toISOString(), tracking_deadline: trackingDeadline.toISOString() })
    .eq('id', tx.id)

  // Fallback: migração da coluna tracking_deadline pode não ter sido aplicada
  if (updateResult.error) {
    updateResult = await admin
      .from('transactions')
      .update({ status: 'paid', paid_at: paidAt.toISOString() })
      .eq('id', tx.id)
  }

  if (updateResult.error) {
    console.error('[webhook] erro ao atualizar transação:', updateResult.error.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  await admin.from('escrow_events').insert({
    transaction_id: tx.id,
    event_type: 'paid',
    actor_id: null,
    actor_role: 'system',
    metadata: {
      source: 'abacatepay_webhook',
      abacatepay_id: pixId,
      amount: data.pixQrCode.amount,
      dev_mode: body.devMode,
    },
  })

  console.log('[webhook] pagamento confirmado:', tx.id)
  return NextResponse.json({ ok: true })
}
