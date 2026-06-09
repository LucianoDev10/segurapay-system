'use client'

import { useState } from 'react'
import { PixInstrucoes } from '@/components/PixInstrucoes'
import type { Transaction } from '@/types/database'

interface PagamentoViewProps {
  transactionId: string
  productName: string
  productDescription: string | null
  amountCents: number
  sellerName: string
  buyerName?: string | null
  buyerEmail?: string | null
}

interface PayResponse {
  transaction: Transaction
  pix_copy_paste: string
  pix_qr_code: string | null
}

export function PagamentoView({
  transactionId,
  productName,
  productDescription,
  amountCents,
  sellerName,
  buyerName,
  buyerEmail,
}: PagamentoViewProps) {
  const isLoggedIn = !!(buyerName && buyerEmail)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pago, setPago] = useState<PayResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const podePagar = isLoggedIn
    ? !loading
    : nome.trim().length >= 2 && emailValido && !loading

  async function handlePagar() {
    setErro(null)
    setLoading(true)
    try {
      const body = isLoggedIn
        ? {}
        : { buyer_name: nome.trim(), buyer_email: email.trim() }
      const res = await fetch(`/api/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao processar pagamento'); return }
      setPago(json)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (pago) {
    return (
      <PixInstrucoes
        transactionId={transactionId}
        pixCopyPaste={pago.pix_copy_paste}
        pixQrCode={pago.pix_qr_code}
        amountCents={amountCents}
        productName={productName}
        redirectOnPaid={isLoggedIn ? `/transacao/${transactionId}` : undefined}
      />
    )
  }

  const inputClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"

  return (
    <div className="flex flex-col gap-5">
      {/* Produto */}
      <div className="rounded-[16px] border border-[#E4E8F0] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4E8F0]">
          <p className="text-[12px] font-medium text-[#8890A4] uppercase tracking-wide">produto</p>
          <p className="font-medium text-[#1A202C] text-[15px] mt-0.5">{productName}</p>
          {productDescription && <p className="text-[13px] text-[#4A5568] mt-1">{productDescription}</p>}
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between text-[14px]">
            <span className="text-[#4A5568]">vendedor</span>
            <span className="font-medium text-[#1A202C]">{sellerName}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[14px] text-[#4A5568]">valor</span>
            <span className="text-[28px] font-medium text-[#1A202C]">{valor}</span>
          </div>
        </div>
      </div>

      {/* Proteção */}
      <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EEF2FF', borderLeft: '3px solid #1B4DFF', color: '#1338CC' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Seu dinheiro fica retido no Segura Pay até você confirmar o recebimento do produto.</span>
      </div>

      {/* Dados do comprador */}
      {isLoggedIn ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#F2F4F7] border border-[#E4E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#1B4DFF] flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0">
            {buyerName![0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#1A202C] truncate">{buyerName}</p>
            <p className="text-[11px] text-[#8890A4] truncate">{buyerEmail}</p>
          </div>
          <span className="ml-auto text-[11px] text-[#8890A4] flex-shrink-0">comprador</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] font-medium text-[#8890A4] uppercase tracking-wide">seus dados</p>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Seu e-mail"
            autoComplete="email"
            className={inputClass}
          />
        </div>
      )}

      {erro && (
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
          {erro}
        </div>
      )}

      <button
        onClick={handlePagar}
        disabled={!podePagar}
        className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
      >
        {loading ? 'Processando...' : `Pagar ${valor} via Pix`}
      </button>
    </div>
  )
}
