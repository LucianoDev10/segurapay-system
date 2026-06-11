'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TransactionStatus } from '@/types/database'

interface AdminAcoesProps {
  transactionId: string
  status: TransactionStatus
}

type Decision = 'release_to_seller' | 'refund_to_buyer'

export function AdminAcoes({ transactionId, status }: AdminAcoesProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<Decision>('release_to_seller')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function executar(endpoint: string, body?: object) {
    setLoading(endpoint)
    setErro(null)
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error); return }
      setConfirmando(null)
      router.refresh()
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  const acoes: { endpoint: string; label: string; variant: 'primary' | 'success' | 'warning'; allowedIn: TransactionStatus[] }[] = [
    {
      endpoint: 'mark-paid',
      label: 'Confirmar pagamento manualmente',
      variant: 'primary',
      allowedIn: ['pending'],
    },
    {
      endpoint: 'release',
      label: 'Liberar pagamento ao vendedor',
      variant: 'success',
      allowedIn: ['delivered', 'complaint_period'],
    },
    {
      endpoint: 'resolve',
      label: 'Resolver disputa',
      variant: 'warning',
      allowedIn: ['disputed'],
    },
  ]

  const variantClass = {
    primary: 'bg-[#1B4DFF] hover:bg-[#1338CC] text-white',
    success: 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30 hover:bg-[#10B981]/10',
    warning: 'bg-[#FFF8E6] text-[#D97706] border border-[#D97706]/30 hover:bg-[#D97706]/10',
  }

  const disponiveis = acoes.filter(a => a.allowedIn.includes(status))

  if (disponiveis.length === 0) {
    return <p className="text-[13px] text-[#8890A4]">Nenhuma ação disponível para este status.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {disponiveis.map(acao => {
        if (confirmando === acao.endpoint) {
          const isResolve = acao.endpoint === 'resolve'
          return (
            <div key={acao.endpoint} className="flex flex-col gap-3 rounded-[10px] border border-[#E4E8F0] p-4">
              <p className="text-[14px] font-medium text-[#1A202C]">{acao.label}</p>

              {isResolve && (
                <>
                  {/* Decisão */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] font-medium text-[#4A5568]">Decisão <span className="text-[#EF4444]">*</span></p>
                    {(
                      [
                        { value: 'release_to_seller', label: 'Favorável ao vendedor', sub: 'Dinheiro liberado ao vendedor', color: '#047857', bg: '#ECFDF5', border: '#10B981' },
                        { value: 'refund_to_buyer',   label: 'Favorável ao comprador', sub: 'Reembolso manual ao comprador', color: '#1338CC', bg: '#EEF2FF', border: '#1B4DFF' },
                      ] as const
                    ).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDecision(opt.value)}
                        className="flex items-center gap-3 w-full rounded-[10px] border px-3.5 py-2.5 text-left transition-all duration-150"
                        style={decision === opt.value
                          ? { background: opt.bg, borderColor: opt.border }
                          : { background: '#fff', borderColor: '#E4E8F0' }
                        }
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={decision === opt.value
                            ? { borderColor: opt.border, background: opt.bg }
                            : { borderColor: '#CBD5E0', background: '#fff' }
                          }
                        >
                          {decision === opt.value && (
                            <div className="w-2 h-2 rounded-full" style={{ background: opt.border }} />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: decision === opt.value ? opt.color : '#1A202C' }}>{opt.label}</p>
                          <p className="text-[11px]" style={{ color: decision === opt.value ? opt.color : '#8890A4' }}>{opt.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Nota */}
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Nota interna (ex: comprador enviou foto comprovando dano, vendedor não contestou...)"
                    rows={2}
                    className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 resize-none transition-all duration-150"
                  />

                  {decision === 'refund_to_buyer' && (
                    <div className="flex items-start gap-2 p-2.5 rounded-[8px] text-[11px]" style={{ background: '#EEF2FF', color: '#1338CC' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      O reembolso é manual — faça o Pix ao comprador antes ou logo após confirmar.
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmando(null)}
                  className="flex-1 rounded-[10px] border border-[#E4E8F0] px-3 py-2 text-[13px] font-medium text-[#4A5568] hover:bg-[#F2F4F7] transition-all duration-150"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => executar(acao.endpoint, isResolve ? { decision, note } : undefined)}
                  disabled={loading !== null}
                  className={`flex-1 rounded-[10px] px-3 py-2 text-[13px] font-medium disabled:opacity-60 transition-all duration-150 ${variantClass[acao.variant]}`}
                >
                  {loading === acao.endpoint ? 'Executando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )
        }

        return (
          <button
            key={acao.endpoint}
            onClick={() => setConfirmando(acao.endpoint)}
            disabled={loading !== null}
            className={`w-full rounded-[10px] px-4 py-2.5 text-[14px] font-medium disabled:opacity-60 transition-all duration-150 ${variantClass[acao.variant]}`}
          >
            {acao.label}
          </button>
        )
      })}

      {erro && (
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
          {erro}
        </div>
      )}
    </div>
  )
}
