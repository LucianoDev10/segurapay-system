'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface DisputaTx {
  id: string
  product_name: string
  amount_cents: number
  status: string
  dispute_reason: string | null
  disputed_at: string | null
  created_at: string
  seller: { name: string; phone: string | null } | null
  buyer: { name: string; phone: string | null } | null
}

function formatPhone(raw: string | null) {
  if (!raw) return '—'
  return raw.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

export function DisputasAdmin() {
  const [disputas, setDisputas] = useState<DisputaTx[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status: 'disputed' })
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/transactions?${params}`)
    if (res.ok) {
      const json = await res.json()
      setDisputas(json.transactions)
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchData, search])

  return (
    <div className="flex flex-col gap-5">

      {/* Aviso */}
      {!loading && disputas.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#7F1D1D' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span><strong>{disputas.length} disputa{disputas.length > 1 ? 's' : ''}</strong> aguardando mediação. Acesse cada uma para resolver ou liberar o pagamento.</span>
        </div>
      )}

      {/* Busca */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar produto..."
        className="rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/20 transition-all duration-150"
      />

      {loading ? (
        <div className="text-center py-16 text-[13px] text-[#8890A4]">Carregando disputas...</div>
      ) : disputas.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-14 text-center">
          <div className="w-11 h-11 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#1A202C]">Nenhuma disputa aberta</p>
          <p className="text-[13px] text-[#8890A4] mt-1">Todas as transações estão fluindo normalmente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputas.map(tx => (
            <div key={tx.id} className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-[#F2F4F7] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-medium text-[#1A202C] truncate">{tx.product_name}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FEF2F2] text-[#EF4444] flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                      Em disputa
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8890A4] mt-0.5 font-mono">
                    {tx.id.slice(0, 8).toUpperCase()}
                    {tx.disputed_at && ` · aberta ${new Date(tx.disputed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}
                  </p>
                </div>
                <p className="text-[18px] font-medium text-[#1A202C] flex-shrink-0">
                  {(tx.amount_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              {/* Motivo */}
              {tx.dispute_reason && (
                <div className="px-5 py-3 border-b border-[#F2F4F7] bg-[#FEF2F2]/40">
                  <p className="text-[11px] font-medium text-[#EF4444] mb-0.5">Motivo da reclamação</p>
                  <p className="text-[13px] text-[#7F1D1D]">{tx.dispute_reason}</p>
                </div>
              )}

              {/* Partes + ação */}
              <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 min-w-0">
                  <div>
                    <p className="text-[10px] text-[#8890A4] font-medium uppercase tracking-wide">Vendedor</p>
                    <p className="text-[13px] text-[#1A202C]">{tx.seller?.name ?? '—'}</p>
                    <p className="text-[11px] text-[#8890A4]">{formatPhone(tx.seller?.phone ?? null)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8890A4] font-medium uppercase tracking-wide">Comprador</p>
                    <p className="text-[13px] text-[#1A202C]">{tx.buyer?.name ?? '—'}</p>
                    <p className="text-[11px] text-[#8890A4]">{formatPhone(tx.buyer?.phone ?? null)}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/transacao/${tx.id}`}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-2 text-[13px] font-medium transition-all flex-shrink-0"
                >
                  Mediar
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
