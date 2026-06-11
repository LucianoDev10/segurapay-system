import { createAdminClient } from '@/lib/supabase/server'
import { createPixCharge } from '@/lib/abacatepay'
import type { Transaction, TransactionWithParties, User } from '@/types/database'

interface CreateTransactionInput {
  product_name: string
  product_description?: string
  amount_cents: number
  seller_name: string
  seller_phone?: string
  authenticated_seller_id?: string  // quando o vendedor está autenticado, usa o ID diretamente
}

interface CreateTransactionResult {
  transaction: Transaction
  link: string
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<CreateTransactionResult> {
  const supabase = createAdminClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Resolve o vendedor: usuário autenticado tem prioridade sobre guest
  let seller: User

  if (input.authenticated_seller_id) {
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'seller' })
      .eq('id', input.authenticated_seller_id)
      .select('*')
      .single()

    if (error || !data) throw new Error('Erro ao carregar vendedor autenticado')
    seller = data
  } else if (input.seller_phone) {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('phone', input.seller_phone.replace(/\D/g, ''))
      .eq('role', 'seller')
      .single()

    if (existing) {
      seller = existing
    } else {
      const { data: created, error } = await supabase
        .from('users')
        .insert({
          name: input.seller_name,
          phone: input.seller_phone.replace(/\D/g, ''),
          email: `${input.seller_phone.replace(/\D/g, '')}@guest.seguropay.com.br`,
          role: 'seller',
        })
        .select('*')
        .single()

      if (error || !created) throw new Error('Erro ao criar vendedor')
      seller = created
    }
  } else {
    const { data: created, error } = await supabase
      .from('users')
      .insert({
        name: input.seller_name,
        email: `${Date.now()}@guest.seguropay.com.br`,
        role: 'seller',
      })
      .select('*')
      .single()

    if (error || !created) throw new Error('Erro ao criar vendedor')
    seller = created
  }

  // Cria a transação
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      seller_id: seller.id,
      product_name: input.product_name,
      product_description: input.product_description ?? null,
      amount_cents: input.amount_cents,
      fee_cents: 80,
      status: 'pending',
    })
    .select('*')
    .single()

  if (txError || !transaction) throw new Error('Erro ao criar transação')

  // Registra evento
  await supabase.from('escrow_events').insert({
    transaction_id: transaction.id,
    event_type: 'created',
    actor_id: seller.id,
    actor_role: 'seller',
    metadata: { product_name: input.product_name, amount_cents: input.amount_cents },
  })

  return {
    transaction,
    link: `${appUrl}/pagar/${transaction.id}`,
  }
}

export async function getTransaction(id: string): Promise<TransactionWithParties | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('transactions')
    .select('*, seller:users!transactions_seller_id_fkey(*), buyer:users!transactions_buyer_id_fkey(*)')
    .eq('id', id)
    .single()

  return data ?? null
}

interface InitiatePayInput {
  transaction_id: string
  buyer_name?: string
  buyer_email?: string
  authenticated_buyer_id?: string
}

interface InitiatePayResult {
  transaction: Transaction
  pix_copy_paste: string
  pix_qr_code: string | null
}

export async function initiatePay(input: InitiatePayInput): Promise<InitiatePayResult> {
  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', input.transaction_id)
    .single()

  if (!tx) throw new Error('Transação não encontrada')
  if (tx.status !== 'pending') throw new Error('Transação não está disponível para pagamento')

  let buyer: User

  if (input.authenticated_buyer_id) {
    // Usuário logado: usa perfil existente, atualiza role
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'buyer' })
      .eq('id', input.authenticated_buyer_id)
      .select('*')
      .single()
    if (error || !data) throw new Error('Erro ao carregar comprador autenticado')
    buyer = data
  } else {
    // Guest: find-or-create by email
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.buyer_email!)
      .single()

    if (existing) {
      buyer = existing
    } else {
      const { data: created, error } = await supabase
        .from('users')
        .insert({ name: input.buyer_name!, email: input.buyer_email!, role: 'buyer' })
        .select('*')
        .single()
      if (error || !created) throw new Error('Erro ao registrar comprador')
      buyer = created
    }
  }

  // Cria cobrança Pix na AbacatePay
  const pixCharge = await createPixCharge({
    amount: tx.amount_cents,
    description: tx.product_name,
    expiresIn: 3600,
  })

  const { data: updated, error: updateError } = await supabase
    .from('transactions')
    .update({
      buyer_id: buyer.id,
      payment_id: pixCharge.id,
      pix_copy_paste: pixCharge.brCode,
      pix_qr_code: pixCharge.brCodeBase64,
      status: 'pending',
    })
    .eq('id', input.transaction_id)
    .select('*')
    .single()

  if (updateError || !updated) throw new Error('Erro ao atualizar transação')

  await supabase.from('escrow_events').insert({
    transaction_id: input.transaction_id,
    event_type: 'paid',
    actor_id: buyer.id,
    actor_role: 'buyer',
    metadata: { buyer_name: input.buyer_name, abacatepay_id: pixCharge.id },
  })

  return {
    transaction: updated,
    pix_copy_paste: pixCharge.brCode,
    pix_qr_code: pixCharge.brCodeBase64,
  }
}

export async function getTransactionWithEvents(id: string) {
  const supabase = createAdminClient()

  const [{ data: tx }, { data: events }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, seller:users!transactions_seller_id_fkey(*), buyer:users!transactions_buyer_id_fkey(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('escrow_events')
      .select('*')
      .eq('transaction_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!tx) return null
  return { ...tx, events: events ?? [] }
}

export async function addTracking(
  transactionId: string,
  carrier: string,
  trackingCode: string,
): Promise<Transaction> {
  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, seller_id')
    .eq('id', transactionId)
    .single()

  if (!tx) throw new Error('Transação não encontrada')
  if (tx.status !== 'paid') throw new Error('Rastreio só pode ser adicionado após pagamento confirmado')

  const { data: updated, error } = await supabase
    .from('transactions')
    .update({ carrier, tracking_code: trackingCode, status: 'tracked', tracked_at: new Date().toISOString() })
    .eq('id', transactionId)
    .select('*')
    .single()

  if (error || !updated) throw new Error('Erro ao adicionar rastreio')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'tracking_added',
    actor_id: tx.seller_id,
    actor_role: 'seller',
    metadata: { carrier, tracking_code: trackingCode },
  })

  return updated
}

export async function confirmDelivery(transactionId: string): Promise<Transaction> {
  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('status, buyer_id')
    .eq('id', transactionId)
    .single()

  if (!tx) throw new Error('Transação não encontrada')
  if (!['tracked', 'paid'].includes(tx.status)) {
    throw new Error('Entrega só pode ser confirmada após pagamento')
  }

  const deliveredAt = new Date()
  const complaintDeadline = new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000)

  const { data: updated, error } = await supabase
    .from('transactions')
    .update({
      status: 'delivered',
      delivered_at: deliveredAt.toISOString(),
      complaint_deadline: complaintDeadline.toISOString(),
    })
    .eq('id', transactionId)
    .select('*')
    .single()

  if (error || !updated) throw new Error('Erro ao confirmar entrega')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'delivered',
    actor_id: tx.buyer_id,
    actor_role: 'buyer',
    metadata: { complaint_deadline: complaintDeadline.toISOString() },
  })

  return updated
}

export async function openDispute(transactionId: string, reason: string, evidenceUrls: string[] = []): Promise<Transaction> {
  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, buyer_id')
    .eq('id', transactionId)
    .single()

  if (!tx) throw new Error('Transação não encontrada')
  if (tx.status !== 'delivered') throw new Error('Disputa só pode ser aberta após confirmação de entrega')

  // Tenta salvar com evidências; se a coluna ainda não existir, salva sem ela
  let updated: Transaction | null = null
  const baseUpdate = { status: 'disputed' as const, disputed_at: new Date().toISOString(), dispute_reason: reason }

  const { data: withEvidence, error: errFull } = await supabase
    .from('transactions')
    .update({ ...baseUpdate, dispute_evidence_urls: evidenceUrls })
    .eq('id', transactionId)
    .select('*')
    .single()

  if (errFull) {
    const { data: withoutEvidence, error: errBasic } = await supabase
      .from('transactions')
      .update(baseUpdate)
      .eq('id', transactionId)
      .select('*')
      .single()
    if (errBasic || !withoutEvidence) throw new Error('Erro ao abrir disputa')
    updated = withoutEvidence
  } else {
    updated = withEvidence
  }

  if (!updated) throw new Error('Erro ao abrir disputa')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'disputed',
    actor_id: tx.buyer_id,
    actor_role: 'buyer',
    metadata: { reason, evidence_count: evidenceUrls.length },
  })

  return updated
}

export async function cancelExpiredTransactions(): Promise<number> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: expired } = await supabase
    .from('transactions')
    .select('id')
    .eq('status', 'paid')
    .lt('tracking_deadline', now)

  if (!expired?.length) return 0

  let count = 0
  for (const tx of expired) {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', tx.id)
      .eq('status', 'paid')

    if (!error) {
      count++
      await supabase.from('escrow_events').insert({
        transaction_id: tx.id,
        event_type: 'tracking_expired',
        actor_id: null,
        actor_role: 'system',
        metadata: { reason: 'Prazo de 96h para adicionar rastreio expirado' },
      })
    }
  }

  return count
}

export async function releasePayment(transactionId: string): Promise<Transaction> {
  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('status, seller_id')
    .eq('id', transactionId)
    .single()

  if (!tx) throw new Error('Transação não encontrada')
  if (!['delivered', 'complaint_period'].includes(tx.status)) {
    throw new Error('Liberação inválida para o status atual')
  }

  const { data: updated, error } = await supabase
    .from('transactions')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', transactionId)
    .select('*')
    .single()

  if (error || !updated) throw new Error('Erro ao liberar pagamento')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'released',
    actor_id: null,
    actor_role: 'system',
    metadata: {},
  })

  return updated
}
