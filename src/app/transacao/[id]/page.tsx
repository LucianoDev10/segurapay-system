import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { AcoesTransacao } from '@/components/AcoesTransacao'
import { StatusTimeline } from '@/components/StatusTimeline'
import { CopiarLinkCard } from '@/components/CopiarLinkCard'
import { ClaimTransacaoButton } from '@/components/ClaimTransacaoButton'
import type { EscrowEvent, TransactionStatus, TransactionWithParties } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()
  const { data } = await admin.from('transactions').select('product_name').eq('id', id).single()
  if (!data) return { title: 'Transação não encontrada — Segura Pay' }
  return { title: `${data.product_name} — Segura Pay` }
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending:          'Aguardando pagamento',
  paid:             'Pago — em escrow',
  tracked:          'Em transporte',
  delivered:        'Entregue',
  complaint_period: 'Período de reclamação',
  disputed:         'Disputa aberta',
  released:         'Pagamento liberado',
  resolved:         'Resolvido',
  cancelled:        'Cancelada',
}

const STATUS_BADGE: Record<TransactionStatus, { bg: string; color: string }> = {
  pending:          { bg: '#FFF8E6', color: '#D97706' },
  paid:             { bg: '#EEF2FF', color: '#1338CC' },
  tracked:          { bg: '#EFF6FF', color: '#1D4ED8' },
  delivered:        { bg: '#ECFDF5', color: '#047857' },
  complaint_period: { bg: '#FFF8E6', color: '#D97706' },
  disputed:         { bg: '#FEF2F2', color: '#EF4444' },
  released:         { bg: '#1B4DFF', color: '#ffffff' },
  resolved:         { bg: '#ECFDF5', color: '#047857' },
  cancelled:        { bg: '#F2F4F7', color: '#4A5568' },
}

const EVENT_LABEL: Record<string, string> = {
  created:           'Transação criada',
  paid:              'Pagamento confirmado',
  tracking_added:    'Rastreio adicionado',
  delivered:         'Recebimento confirmado',
  complaint_opened:  'Reclamação aberta',
  complaint_expired: 'Prazo de reclamação expirado',
  tracking_expired:  'Prazo de rastreio expirado — transação cancelada',
  released:          'Pagamento liberado',
  disputed:          'Disputa aberta',
  resolved:          'Disputa resolvida',
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-[#F2F4F7] last:border-0">
      <span className="text-[13px] text-[#8890A4]">{label}</span>
      <span className={`text-[14px] font-medium text-[#1A202C] text-right max-w-[60%] ${mono ? 'font-mono text-[12px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export default async function TransacaoPage({ params }: Props) {
  const { id } = await params

  // Auth — não redireciona, mas detecta quem está vendo
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('*, seller:users!transactions_seller_id_fkey(*), buyer:users!transactions_buyer_id_fkey(*)')
    .eq('id', id)
    .single() as { data: TransactionWithParties | null }

  if (!tx) notFound()

  const { data: events } = await admin
    .from('escrow_events')
    .select('*')
    .eq('transaction_id', id)
    .order('created_at', { ascending: true })

  // Determina papel com base no usuário autenticado
  const role: 'seller' | 'buyer' | 'observer' = !user
    ? 'observer'
    : user.id === tx.seller_id
    ? 'seller'
    : user.id === tx.buyer_id
    ? 'buyer'
    : 'observer'

  // Usuário não tem nada a ver com essa transação e não está logado — exige login
  if (!user && role === 'observer') {
    redirect(`/login?next=/transacao/${id}`)
  }

  const valor = (tx.amount_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const taxaTotal = ((tx.amount_cents + tx.fee_cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const badge = STATUS_BADGE[tx.status as TransactionStatus]
  const statusLabel = STATUS_LABEL[tx.status as TransactionStatus] ?? tx.status

  return (
    <main className="min-h-screen bg-[#F2F4F7] px-4 py-8 pb-16">
      <div className="max-w-lg mx-auto flex flex-col gap-4">

        {/* Topo: voltar + logo */}
        <div className="flex items-center justify-between">
          <Link
            href={user ? '/minhas-transacoes' : '/'}
            className="flex items-center gap-1.5 text-[13px] text-[#4A5568] hover:text-[#1A202C] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Minhas transações
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-[#1B4DFF] rounded-[5px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#1A202C]">Segura Pay</span>
          </div>
        </div>

        {/* Status header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-medium text-[#1A202C] leading-tight">{tx.product_name}</h1>
            <p className="text-[11px] text-[#8890A4] mt-0.5">
              #{id.slice(0, 8).toUpperCase()} · {new Date(tx.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
            style={{ background: badge.bg, color: badge.color }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <StatusTimeline status={tx.status} />
        </div>

        {/* Ações — só para seller e buyer */}
        {role !== 'observer' && (
          <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
            <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">
              {role === 'seller' ? 'Ações do vendedor' : 'Ações do comprador'}
            </h2>
            <AcoesTransacao
              transactionId={tx.id}
              status={tx.status}
              role={role}
              complaintDeadline={tx.complaint_deadline}
              trackingDeadline={tx.tracking_deadline}
              carrier={tx.carrier}
              trackingCode={tx.tracking_code}
            />
          </div>
        )}

        {/* Vincular à conta — para usuário logado que pagou como guest */}
        {role === 'observer' && user && ['paid', 'tracked', 'delivered', 'complaint_period', 'disputed', 'released'].includes(tx.status) && (
          <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
            <ClaimTransacaoButton transactionId={tx.id} />
          </div>
        )}

        {/* Link de pagamento — só para o vendedor enquanto aguarda pagamento */}
        {role === 'seller' && tx.status === 'pending' && (
          <CopiarLinkCard
            link={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pagar/${tx.id}`}
            productName={tx.product_name}
            amountCents={tx.amount_cents}
          />
        )}

        {/* Detalhes financeiros */}
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-1">Resumo financeiro</h2>
          <div className="flex items-baseline justify-between py-3 border-b border-[#F2F4F7]">
            <span className="text-[13px] text-[#8890A4]">valor do produto</span>
            <span className="text-[28px] font-medium text-[#1A202C]">{valor}</span>
          </div>
          <Row label="taxa Segura Pay" value={`R$ ${(tx.fee_cents / 100).toFixed(2).replace('.', ',')}`} />
          <div className="flex justify-between items-baseline py-2.5">
            <span className="text-[13px] font-medium text-[#4A5568]">total pago pelo comprador</span>
            <span className="text-[15px] font-medium text-[#1A202C]">{taxaTotal}</span>
          </div>
        </div>

        {/* Partes */}
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-1">Partes</h2>
          <Row label="vendedor" value={tx.seller?.name ?? '—'} />
          <Row label="comprador" value={tx.buyer?.name ?? 'Aguardando pagamento'} />
        </div>

        {/* Produto */}
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-1">Produto</h2>
          <Row label="nome" value={tx.product_name} />
          {tx.product_description && (
            <div className="pt-2.5">
              <p className="text-[13px] text-[#8890A4] mb-1">descrição</p>
              <p className="text-[14px] text-[#1A202C]">{tx.product_description}</p>
            </div>
          )}
          {tx.tracking_code && (
            <>
              <Row label="transportadora" value={tx.carrier ?? '—'} />
              <Row label="rastreio" value={tx.tracking_code} mono />
            </>
          )}
          {tx.dispute_reason && (
            <div className="mt-2.5 p-3 rounded-[10px] bg-[#FEF2F2] border-l-[3px] border-[#EF4444]">
              <p className="text-[11px] font-medium text-[#EF4444] mb-0.5">Motivo da disputa</p>
              <p className="text-[13px] text-[#EF4444]">{tx.dispute_reason}</p>
            </div>
          )}
        </div>

        {/* Histórico de eventos */}
        {events && events.length > 0 && (
          <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
            <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">Histórico</h2>
            <div className="flex flex-col gap-4">
              {events.map((ev: EscrowEvent, i: number) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${i === events.length - 1 ? 'bg-[#1B4DFF]' : 'bg-[#C7D2FE]'}`} />
                    {i < events.length - 1 && <div className="w-px flex-1 bg-[#E4E8F0] mt-1.5" style={{ height: '24px' }} />}
                  </div>
                  <div className="flex flex-col pb-1">
                    <p className="text-[14px] text-[#1A202C] font-medium leading-tight">
                      {EVENT_LABEL[ev.event_type] ?? ev.event_type}
                    </p>
                    <p className="text-[11px] text-[#8890A4] mt-0.5">
                      {new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-center text-[#8890A4]">
          Segura Pay · Escrow protegido · {id}
        </p>

      </div>
    </main>
  )
}
