import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Minhas transações — Segura Pay' }

interface Props {
  searchParams: Promise<{ tab?: string }>
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Aguardando pagamento', bg: '#FFF8E6', color: '#D97706' },
  paid:             { label: 'Pago — em escrow',     bg: '#EEF2FF', color: '#1338CC' },
  tracked:          { label: 'A caminho',             bg: '#EFF6FF', color: '#1D4ED8' },
  delivered:        { label: 'Entregue',              bg: '#ECFDF5', color: '#047857' },
  complaint_period: { label: 'Período de reclamação', bg: '#FFF8E6', color: '#D97706' },
  disputed:         { label: 'Em disputa',            bg: '#FEF2F2', color: '#EF4444' },
  released:         { label: 'Liberado',              bg: '#1B4DFF', color: '#ffffff' },
  resolved:         { label: 'Resolvido',             bg: '#ECFDF5', color: '#047857' },
  cancelled:        { label: 'Cancelada',             bg: '#F2F4F7', color: '#4A5568' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, bg: '#F2F4F7', color: '#8890A4' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

type TxRow = {
  id: string
  seller_id: string
  buyer_id: string | null
  product_name: string
  amount_cents: number
  status: string
  created_at: string
  seller: { name: string } | null
  buyer: { name: string } | null
}

export default async function MinhasTransacoesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/minhas-transacoes')

  const { tab } = await searchParams
  const activeTab = tab === 'comprador' ? 'comprador' : 'vendedor'

  const admin = createAdminClient()
  const { data: transactions } = await admin
    .from('transactions')
    .select('*, seller:users!transactions_seller_id_fkey(id,name), buyer:users!transactions_buyer_id_fkey(id,name)')
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const all = (transactions ?? []) as TxRow[]
  const vendedor = all.filter(tx => tx.seller_id === user.id)
  const comprador = all.filter(tx => tx.buyer_id === user.id)
  const list = activeTab === 'vendedor' ? vendedor : comprador

  const tabs = [
    { key: 'vendedor', label: 'Vendedor', count: vendedor.length },
    { key: 'comprador', label: 'Comprador', count: comprador.length },
  ]

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[#F2F4F7] px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-[20px] font-medium text-[#1A202C]">Minhas transações</h1>
              <p className="text-[13px] text-[#8890A4] mt-1">Acompanhe todas as suas negociações</p>
            </div>
            <Link
              href="/nova-transacao"
              className="bg-[#1B4DFF] text-white px-4 py-2 rounded-[10px] text-[13px] font-medium hover:bg-[#1338CC] transition-colors"
            >
              + Nova
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-[12px] border border-[#E4E8F0] p-1 mb-5">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/minhas-transacoes?tab=${t.key}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-[#1B4DFF] text-white'
                    : 'text-[#4A5568] hover:bg-[#F2F4F7]'
                }`}
              >
                {t.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F2F4F7] text-[#8890A4]'
                }`}>
                  {t.count}
                </span>
              </Link>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-12 text-center">
              <div className="w-11 h-11 bg-[#F2F4F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <p className="text-[14px] text-[#8890A4]">
                {activeTab === 'vendedor' ? 'Nenhuma venda ainda.' : 'Nenhuma compra ainda.'}
              </p>
              {activeTab === 'vendedor' && (
                <Link href="/nova-transacao" className="inline-block mt-4 text-[13px] text-[#1B4DFF] hover:text-[#1338CC] font-medium">
                  Criar primeira transação →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((tx) => {
                const counterpart = activeTab === 'vendedor' ? tx.buyer : tx.seller
                const counterpartLabel = activeTab === 'vendedor' ? 'Comprador' : 'Vendedor'

                return (
                  <Link
                    key={tx.id}
                    href={`/transacao/${tx.id}`}
                    className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden hover:border-[#C7D2FE] transition-colors"
                  >
                    <div className="px-5 py-4 border-b border-[#F2F4F7] flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-[#1A202C] truncate">{tx.product_name}</p>
                        <p className="text-[11px] text-[#8890A4] mt-0.5">
                          #{tx.id.slice(0, 8).toUpperCase()} · {formatDate(tx.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>

                    <div className="px-5 py-3 flex items-center justify-between">
                      <p className="text-[11px] text-[#8890A4]">
                        {counterpartLabel}: <span className="text-[#4A5568] font-medium">{counterpart?.name ?? '—'}</span>
                      </p>
                      <p className="text-[18px] font-medium text-[#1A202C]">
                        {formatCurrency(tx.amount_cents)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </main>
    </>
  )
}
