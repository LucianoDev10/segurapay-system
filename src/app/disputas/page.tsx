import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Disputas — Segura Pay' }

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

type DisputaTx = {
  id: string
  seller_id: string
  buyer_id: string | null
  product_name: string
  amount_cents: number
  status: string
  dispute_reason: string | null
  disputed_at: string | null
  created_at: string
  seller: { name: string } | null
  buyer: { name: string } | null
}

export default async function DisputasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/disputas')

  const admin = createAdminClient()
  const { data: transactions } = await admin
    .from('transactions')
    .select(`
      id, seller_id, buyer_id, product_name, amount_cents,
      status, dispute_reason, disputed_at, created_at,
      seller:users!transactions_seller_id_fkey(name),
      buyer:users!transactions_buyer_id_fkey(name)
    `)
    .eq('status', 'disputed')
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('disputed_at', { ascending: false, nullsFirst: false })

  const disputas = (transactions ?? []) as unknown as DisputaTx[]

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[#F2F4F7] px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto">

          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-[10px] bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[20px] font-medium text-[#1A202C]">Disputas</h1>
              <p className="text-[13px] text-[#8890A4]">
                {disputas.length === 0
                  ? 'Nenhuma disputa aberta'
                  : `${disputas.length} disputa${disputas.length > 1 ? 's' : ''} em andamento`}
              </p>
            </div>
          </div>

          {disputas.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-12 text-center">
              <div className="w-11 h-11 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#1A202C]">Tudo certo por aqui</p>
              <p className="text-[13px] text-[#8890A4] mt-1">Você não tem nenhuma disputa aberta.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Aviso geral */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Disputas são mediadas pelo Segura Pay. Acesse cada transação para acompanhar e enviar evidências.</span>
              </div>

              {disputas.map(tx => {
                const role = tx.seller_id === user.id ? 'vendedor' : 'comprador'
                const counterpart = role === 'vendedor' ? tx.buyer : tx.seller
                const counterpartLabel = role === 'vendedor' ? 'Comprador' : 'Vendedor'

                return (
                  <Link
                    key={tx.id}
                    href={`/transacao/${tx.id}`}
                    className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden hover:border-[#FCA5A5] transition-colors group"
                  >
                    {/* Topo — produto + badge */}
                    <div className="px-5 py-4 border-b border-[#F2F4F7] flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-[#1A202C] truncate">{tx.product_name}</p>
                        <p className="text-[11px] text-[#8890A4] mt-0.5">
                          #{tx.id.slice(0, 8).toUpperCase()}
                          {tx.disputed_at && ` · disputa aberta em ${formatDate(tx.disputed_at)}`}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0"
                        style={{ background: '#FEF2F2', color: '#EF4444' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                        Em disputa
                      </span>
                    </div>

                    {/* Motivo da disputa */}
                    {tx.dispute_reason && (
                      <div className="px-5 py-3 border-b border-[#F2F4F7] bg-[#FEF2F2]/40">
                        <p className="text-[11px] font-medium text-[#EF4444] mb-0.5">Motivo da reclamação</p>
                        <p className="text-[13px] text-[#7F1D1D] line-clamp-2">{tx.dispute_reason}</p>
                      </div>
                    )}

                    {/* Rodapé — valor + papel + contraparte */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ background: role === 'vendedor' ? '#EEF2FF' : '#ECFDF5', color: role === 'vendedor' ? '#1338CC' : '#047857' }}>
                          {role === 'vendedor' ? 'Você vende' : 'Você compra'}
                        </span>
                        <p className="text-[11px] text-[#8890A4]">
                          {counterpartLabel}: <span className="text-[#4A5568] font-medium">{counterpart?.name ?? '—'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[18px] font-medium text-[#1A202C]">{formatCurrency(tx.amount_cents)}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#EF4444] transition-colors">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
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
