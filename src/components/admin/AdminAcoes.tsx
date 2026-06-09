'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TransactionStatus } from '@/types/database'

interface AdminAcoesProps {
  transactionId: string
  status: TransactionStatus
}

export function AdminAcoes({ transactionId, status }: AdminAcoesProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [note, setNote] = useState('')
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
      allowedIn: ['delivered', 'complaint_period', 'disputed'],
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
          return (
            <div key={acao.endpoint} className="flex flex-col gap-2 rounded-[10px] border border-[#E4E8F0] p-3">
              <p className="text-[14px] font-medium text-[#1A202C]">{acao.label}</p>
              {acao.endpoint === 'resolve' && (
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nota de resolução (ex: reembolso aprovado, produto ok...)"
                  rows={2}
                  className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 resize-none transition-all duration-150"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmando(null)}
                  className="flex-1 rounded-[10px] border border-[#E4E8F0] px-3 py-2 text-[13px] font-medium text-[#4A5568] hover:bg-[#F2F4F7] transition-all duration-150"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => executar(acao.endpoint, acao.endpoint === 'resolve' ? { note } : undefined)}
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
