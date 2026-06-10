import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { simulatePixPayment } from '@/lib/abacatepay'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Não disponível em produção' }, { status: 403 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: tx } = await admin
    .from('transactions')
    .select('payment_id, status')
    .eq('id', id)
    .single()

  if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  if (!tx.payment_id) return NextResponse.json({ error: 'Cobrança Pix não iniciada' }, { status: 400 })
  if (tx.status !== 'pending') return NextResponse.json({ error: 'Transação já processada' }, { status: 409 })

  // Tenta chamar a AbacatePay mas não bloqueia se falhar — o update local garante o fluxo em dev
  try {
    await simulatePixPayment(tx.payment_id)
  } catch {
    // ignorado em dev — o update direto abaixo é suficiente
  }

  const paidAt = new Date()
  const trackingDeadline = new Date(paidAt.getTime() + 96 * 60 * 60 * 1000)

  const { error: updateError } = await admin
    .from('transactions')
    .update({
      status: 'paid',
      paid_at: paidAt.toISOString(),
      tracking_deadline: trackingDeadline.toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')

  if (updateError) {
    console.error('[simulate-pay] update failed:', updateError.message)
    // Tenta sem tracking_deadline (migração pode não ter sido aplicada ainda)
    const { error: retryError } = await admin
      .from('transactions')
      .update({ status: 'paid', paid_at: paidAt.toISOString() })
      .eq('id', id)
      .eq('status', 'pending')

    if (retryError) {
      console.error('[simulate-pay] retry failed:', retryError.message)
      return NextResponse.json({ error: retryError.message }, { status: 500 })
    }
  }

  await admin.from('escrow_events').insert({
    transaction_id: id,
    event_type: 'paid',
    actor_id: null,
    actor_role: 'system',
    metadata: { source: 'simulate_payment', dev_mode: true },
  })

  return NextResponse.json({ ok: true })
}
