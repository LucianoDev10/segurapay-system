import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { EvidenciaVendedor } from '@/components/EvidenciaVendedor'

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
  dispute_evidence_urls: string[] | null
  seller_dispute_note: string | null
  seller_dispute_evidence_urls: string[] | null
  disputed_at: string | null
  seller: { name: string } | null
  buyer: { name: string } | null
}

function ImageGrid({ urls, label }: { urls: string[]; label: string }) {
  if (!urls.length) return null
  return (
    <div>
      <p className="text-[11px] font-medium text-[#8890A4] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#E4E8F0] flex-shrink-0 hover:border-[#1B4DFF] transition-colors block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`evidência ${i + 1}`} className="w-full h-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default async function DisputasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/disputas')

  const admin = createAdminClient()

  const { data: transactions, error: queryError } = await admin
    .from('transactions')
    .select(`
      id, seller_id, buyer_id, product_name, amount_cents, status,
      dispute_reason, dispute_evidence_urls,
      seller_dispute_note, seller_dispute_evidence_urls,
      disputed_at,
      seller:users!transactions_seller_id_fkey(name),
      buyer:users!transactions_buyer_id_fkey(name)
    `)
    .eq('status', 'disputed')
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('disputed_at', { ascending: false, nullsFirst: false })

  if (queryError) {
    console.error('[disputas] query error:', queryError.message)
  }

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
            <div className="flex flex-col gap-4">

              <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Nossa equipe está analisando as evidências e entrará em contato com ambas as partes.</span>
              </div>

              {disputas.map(tx => {
                const role = tx.seller_id === user.id ? 'seller' : 'buyer'
                const counterpart = role === 'seller' ? tx.buyer : tx.seller
                const counterpartLabel = role === 'seller' ? 'Comprador' : 'Vendedor'
                const buyerEvidenceUrls = tx.dispute_evidence_urls ?? []
                const sellerEvidenceUrls = tx.seller_dispute_evidence_urls ?? []
                const sellerSentEvidence = !!(tx.seller_dispute_note || sellerEvidenceUrls.length > 0)

                return (
                  <div key={tx.id} className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">

                    {/* Cabeçalho */}
                    <div className="px-5 py-4 border-b border-[#F2F4F7] flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-[#1A202C] truncate">{tx.product_name}</p>
                        <p className="text-[11px] text-[#8890A4] mt-0.5">
                          #{tx.id.slice(0, 8).toUpperCase()}
                          {tx.disputed_at && ` · ${formatDate(tx.disputed_at)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: '#FEF2F2', color: '#EF4444' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                          Em disputa
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: role === 'seller' ? '#EEF2FF' : '#ECFDF5', color: role === 'seller' ? '#1338CC' : '#047857' }}>
                            {role === 'seller' ? 'Você vende' : 'Você compra'}
                          </span>
                          <p className="text-[11px] text-[#8890A4]">
                            {counterpartLabel}: <span className="text-[#4A5568] font-medium">{counterpart?.name ?? '—'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="px-5 py-3 border-b border-[#F2F4F7] flex items-center justify-between">
                      <span className="text-[12px] text-[#8890A4]">Valor em disputa</span>
                      <span className="text-[18px] font-medium text-[#1A202C]">{formatCurrency(tx.amount_cents)}</span>
                    </div>

                    {/* Evidências do comprador */}
                    <div className="px-5 py-4 border-b border-[#F2F4F7]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <p className="text-[12px] font-medium text-[#4A5568]">Reclamação do comprador</p>
                      </div>

                      {tx.dispute_reason && (
                        <div className="mb-3 p-3 rounded-[10px] bg-[#FEF2F2]/60 border border-[#FCA5A5]/30">
                          <p className="text-[13px] text-[#7F1D1D] leading-relaxed">{tx.dispute_reason}</p>
                        </div>
                      )}

                      <ImageGrid urls={buyerEvidenceUrls} label="Evidências enviadas pelo comprador" />

                      {!tx.dispute_reason && buyerEvidenceUrls.length === 0 && (
                        <p className="text-[12px] text-[#8890A4]">Nenhuma evidência enviada.</p>
                      )}
                    </div>

                    {/* Evidências do vendedor */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1338CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <p className="text-[12px] font-medium text-[#4A5568]">Defesa do vendedor</p>
                      </div>

                      {sellerSentEvidence ? (
                        <div className="flex flex-col gap-3">
                          {tx.seller_dispute_note && (
                            <div className="p-3 rounded-[10px] bg-[#EEF2FF]/60 border border-[#C7D2FE]/40">
                              <p className="text-[13px] text-[#1338CC] leading-relaxed">{tx.seller_dispute_note}</p>
                            </div>
                          )}
                          <ImageGrid urls={sellerEvidenceUrls} label="Evidências enviadas pelo vendedor" />
                        </div>
                      ) : role === 'seller' ? (
                        <EvidenciaVendedor transactionId={tx.id} />
                      ) : (
                        <p className="text-[12px] text-[#8890A4]">O vendedor ainda não enviou evidências.</p>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>
    </>
  )
}
