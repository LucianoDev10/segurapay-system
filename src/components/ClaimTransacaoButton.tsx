'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClaimTransacaoButton({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleClaim() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/claim-buyer`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao vincular'); return }
      router.refresh()
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] text-[13px]" style={{ background: '#EEF2FF', borderLeft: '3px solid #1B4DFF', color: '#1338CC' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Você pagou esta transação? Vincule-a à sua conta para acompanhar aqui e em Minhas transações.
      </div>
      {erro && (
        <p className="text-[12px] text-[#EF4444]">{erro}</p>
      )}
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150"
      >
        {loading ? 'Vinculando...' : 'Vincular à minha conta'}
      </button>
    </div>
  )
}
