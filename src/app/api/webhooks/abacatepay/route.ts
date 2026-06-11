import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { emailPagamentoConfirmado } from '@/lib/email'

type BillingPaidData =
  | { payment: { method: string }; pixQrCode: { id: string; amount: number; kind: 'PIX'; status: 'PAID' } }
  | { payment: { method: string }; billing: { id: string; amount: number; externalId: string; status: 'PAID' } }

async function markTransactionPaid(
  admin: ReturnType<typeof createAdminClient>,
  txId: string,
  source: string,
  sourceId: string,
  amount: number,
  devMode: boolean,
) {
  const { data: tx } = await admin
    .from('transactions')
    .select('id, status, product_name, amount_cents, seller:users!transactions_seller_id_fkey(email,name), buyer:users!transactions_buyer_id_fkey(email,name)')
    .eq('id', txId)
    .single()

  if (!tx) return { error: 'not_found' }
  if (tx.status !== 'pending') return { ok: true } // idempotência

  const paidAt = new Date()
  const trackingDeadline = new Date(paidAt.getTime() + 96 * 60 * 60 * 1000)

  let result = await admin
    .from('transactions')
    .update({ status: 'paid', paid_at: paidAt.toISOString(), tracking_deadline: trackingDeadline.toISOString() })
    .eq('id', txId)

  if (result.error) {
    result = await admin
      .from('transactions')
      .update({ status: 'paid', paid_at: paidAt.toISOString() })
      .eq('id', txId)
  }

  if (result.error) return { error: 'update_failed' }

  await admin.from('escrow_events').insert({
    transaction_id: txId,
    event_type: 'paid',
    actor_id: null,
    actor_role: 'system',
    metadata: { source, abacatepay_id: sourceId, amount, dev_mode: devMode },
  })

  const seller = tx.seller as unknown as { email: string; name: string } | null
  const buyer = tx.buyer as unknown as { email: string; name: string } | null
  if (seller?.email && buyer?.email) {
    emailPagamentoConfirmado({
      vendedorEmail: seller.email,
      vendedorNome: seller.name,
      compradorEmail: buyer.email,
      compradorNome: buyer.name,
      produto: tx.product_name,
      valorCents: tx.amount_cents,
      transactionId: txId,
    }).catch(() => {})
  }

  return { ok: true }
}

export async function POST(request: NextRequest) {
  let body: { event: string; data: unknown; devMode: boolean }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (body.event !== 'billing.paid') {
    return NextResponse.json({ ok: true })
  }

  const data = body.data as Partial<BillingPaidData>
  const admin = createAdminClient()

  // Pagamento via Pix (transparent)
  if ('pixQrCode' in data && data.pixQrCode?.id) {
    const pixId = data.pixQrCode.id

    const { data: tx } = await admin
      .from('transactions')
      .select('id')
      .eq('payment_id', pixId)
      .single()

    if (!tx) {
      console.error('[webhook] transação não encontrada para pixQrCode:', pixId)
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    const result = await markTransactionPaid(admin, tx.id, 'abacatepay_pix', pixId, data.pixQrCode.amount, body.devMode)
    if (result.error === 'update_failed') return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    console.log('[webhook] pix pago:', tx.id)
    return NextResponse.json({ ok: true })
  }

  // Pagamento via Cartão (checkout)
  if ('billing' in data && data.billing?.externalId) {
    const txId = data.billing.externalId

    const result = await markTransactionPaid(admin, txId, 'abacatepay_card', data.billing.id, data.billing.amount, body.devMode)
    if (result.error === 'not_found') {
      console.error('[webhook] transação não encontrada para checkout:', txId)
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }
    if (result.error === 'update_failed') return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    console.log('[webhook] cartão pago:', txId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
