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

  try {
    await simulatePixPayment(tx.payment_id)

    // Atualiza diretamente (fallback caso webhook não chegue a tempo no dev)
    const paidAt = new Date()
    const trackingDeadline = new Date(paidAt.getTime() + 96 * 60 * 60 * 1000)
    await admin
      .from('transactions')
      .update({
        status: 'paid',
        paid_at: paidAt.toISOString(),
        tracking_deadline: trackingDeadline.toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')

    await admin.from('escrow_events').insert({
      transaction_id: id,
      event_type: 'paid',
      actor_id: null,
      actor_role: 'system',
      metadata: { source: 'simulate_payment', dev_mode: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao simular pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
