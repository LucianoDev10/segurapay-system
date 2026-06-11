import { createAdminClient } from '@/lib/supabase/server'
import { emailPagamentoConfirmado, emailDisputaResolvida, emailPagamentoLiberado } from '@/lib/email'
import type { TransactionStatus } from '@/types/database'

export async function listTransactions(filters?: { status?: TransactionStatus; search?: string }) {
  const supabase = createAdminClient()

  let query = supabase
    .from('transactions')
    .select('*, seller:users!transactions_seller_id_fkey(id,name,phone), buyer:users!transactions_buyer_id_fkey(id,name,phone)')
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.ilike('product_name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error('Erro ao listar transações')
  return data ?? []
}

export async function getTransactionAdmin(id: string) {
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

export async function adminMarkPaid(transactionId: string) {
  const supabase = createAdminClient()
  const paidAt = new Date()
  const trackingDeadline = new Date(paidAt.getTime() + 96 * 60 * 60 * 1000)

  let result = await supabase
    .from('transactions')
    .update({ status: 'paid', paid_at: paidAt.toISOString(), tracking_deadline: trackingDeadline.toISOString() })
    .eq('id', transactionId)
    .eq('status', 'pending')
    .select('*, seller:users!transactions_seller_id_fkey(email,name), buyer:users!transactions_buyer_id_fkey(email,name)')
    .single()

  // Fallback: migração da coluna tracking_deadline pode não ter sido aplicada
  if (result.error) {
    result = await supabase
      .from('transactions')
      .update({ status: 'paid', paid_at: paidAt.toISOString() })
      .eq('id', transactionId)
      .eq('status', 'pending')
      .select('*, seller:users!transactions_seller_id_fkey(email,name), buyer:users!transactions_buyer_id_fkey(email,name)')
      .single()
  }

  const { data, error } = result
  if (error || !data) throw new Error('Não foi possível confirmar pagamento')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'paid',
    actor_id: null,
    actor_role: 'system',
    metadata: { note: 'Confirmação manual pelo admin' },
  })

  // Notifica comprador e vendedor
  const seller = (data as Record<string, unknown>).seller as { email: string; name: string } | null
  const buyer = (data as Record<string, unknown>).buyer as { email: string; name: string } | null
  if (seller?.email && buyer?.email) {
    emailPagamentoConfirmado({
      vendedorEmail: seller.email,
      vendedorNome: seller.name,
      compradorEmail: buyer.email,
      compradorNome: buyer.name,
      produto: data.product_name,
      valorCents: data.amount_cents,
      transactionId,
    }).catch(() => {})
  }

  return data
}

export async function adminRelease(transactionId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', transactionId)
    .in('status', ['delivered', 'complaint_period'])
    .select('*, seller:users!transactions_seller_id_fkey(email,name)')
    .single()

  if (error || !data) throw new Error('Não foi possível liberar pagamento')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: 'released',
    actor_id: null,
    actor_role: 'system',
    metadata: { note: 'Liberação manual pelo admin' },
  })

  const seller = (data as Record<string, unknown>).seller as { email: string; name: string } | null
  if (seller?.email) {
    emailPagamentoLiberado({
      vendedorEmail: seller.email,
      vendedorNome: seller.name,
      produto: data.product_name,
      valorCents: data.amount_cents,
      transactionId,
    }).catch(() => {})
  }

  return data
}

export async function adminResolve(
  transactionId: string,
  decision: 'release_to_seller' | 'refund_to_buyer',
  note: string,
) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const isSeller = decision === 'release_to_seller'

  const { data, error } = await supabase
    .from('transactions')
    .update(isSeller
      ? { status: 'released', released_at: now }
      : { status: 'resolved', resolved_at: now },
    )
    .eq('id', transactionId)
    .eq('status', 'disputed')
    .select('*, seller:users!transactions_seller_id_fkey(email,name), buyer:users!transactions_buyer_id_fkey(email,name)')
    .single()

  if (error || !data) throw new Error('Não foi possível resolver disputa')

  await supabase.from('escrow_events').insert({
    transaction_id: transactionId,
    event_type: isSeller ? 'released' : 'resolved',
    actor_id: null,
    actor_role: 'admin',
    metadata: { decision, note },
  })

  const seller = (data as Record<string, unknown>).seller as { email: string; name: string } | null
  const buyer = (data as Record<string, unknown>).buyer as { email: string; name: string } | null
  if (seller?.email && buyer?.email) {
    emailDisputaResolvida({
      vendedorEmail: seller.email,
      vendedorNome: seller.name,
      compradorEmail: buyer.email,
      compradorNome: buyer.name,
      produto: data.product_name,
      valorCents: data.amount_cents,
      decision,
      transactionId,
    }).catch(() => {})
  }

  return data
}

export async function getStats() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('transactions')
    .select('status, amount_cents')

  if (!data) return null

  const statuses: TransactionStatus[] = ['pending', 'paid', 'tracked', 'delivered', 'disputed', 'released', 'resolved', 'cancelled']
  const counts = Object.fromEntries(statuses.map(s => [s, 0])) as Record<TransactionStatus, number>
  let totalEscrow = 0

  for (const tx of data) {
    counts[tx.status as TransactionStatus] = (counts[tx.status as TransactionStatus] ?? 0) + 1
    if (['paid', 'tracked', 'delivered', 'complaint_period', 'disputed'].includes(tx.status)) {
      totalEscrow += tx.amount_cents
    }
  }

  return { counts, totalEscrow, total: data.length }
}
