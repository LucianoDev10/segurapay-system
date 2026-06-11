'use client'

import { useState } from 'react'
import { PixInstrucoes } from '@/components/PixInstrucoes'
import { maskPhone, maskCpf } from '@/lib/masks'
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

interface PayPixResponse {
  transaction: Transaction
  pix_copy_paste: string
  pix_qr_code: string | null
}

interface PayCardResponse {
  checkout_url: string
}

type PayMethod = 'pix' | 'card'

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
  const [method, setMethod] = useState<PayMethod>('pix')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [pago, setPago] = useState<PayPixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const cpfValido = cpf.replace(/\D/g, '').length === 11
  const phoneValido = phone.replace(/\D/g, '').length >= 10

  const guestBaseOk = isLoggedIn || (nome.trim().length >= 2 && emailValido)
  const cardExtraOk = cpfValido && phoneValido
  const podePagar = !loading && guestBaseOk && (method === 'pix' || cardExtraOk)

  async function handlePagar() {
    setErro(null)
    setLoading(true)
    try {
      const body: Record<string, string> = { method }
      if (!isLoggedIn) {
        body.buyer_name = nome.trim()
        body.buyer_email = email.trim()
      }
      if (method === 'card') {
        body.buyer_cpf = cpf
        body.buyer_phone = phone
      }

      const res = await fetch(`/api/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao processar pagamento'); return }

      if (method === 'card') {
        window.location.href = (json as PayCardResponse).checkout_url
        return
      }

      setPago(json as PayPixResponse)
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

      {/* Método de pagamento */}
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-medium text-[#8890A4] uppercase tracking-wide">forma de pagamento</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'pix',  label: 'Pix',            icon: '⚡', sub: 'Instantâneo' },
            { value: 'card', label: 'Cartão',          icon: '💳', sub: 'Crédito / débito' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setMethod(opt.value); setErro(null) }}
              className="flex flex-col items-center gap-1 rounded-[10px] border py-3 px-2 text-center transition-all duration-150"
              style={method === opt.value
                ? { background: '#EEF2FF', borderColor: '#1B4DFF' }
                : { background: '#fff', borderColor: '#E4E8F0' }
              }
            >
              <span className="text-[20px] leading-none">{opt.icon}</span>
              <span className="text-[13px] font-medium" style={{ color: method === opt.value ? '#1338CC' : '#1A202C' }}>{opt.label}</span>
              <span className="text-[11px]" style={{ color: method === opt.value ? '#1338CC' : '#8890A4' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campos extras para cartão */}
      {method === 'card' && (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] font-medium text-[#8890A4] uppercase tracking-wide">dados para antifraude</p>
          <input
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={e => setCpf(maskCpf(e.target.value))}
            placeholder="CPF (000.000.000-00)"
            autoComplete="off"
            className={inputClass}
          />
          <div className="flex rounded-[10px] border border-[#E4E8F0] overflow-hidden bg-white focus-within:border-[#1B4DFF] focus-within:ring-1 focus-within:ring-[#1B4DFF]/20 transition-all duration-150">
            <span className="px-3.5 py-2.5 bg-[#F2F4F7] border-r border-[#E4E8F0] text-[13px] text-[#8890A4] select-none">+55</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              autoComplete="tel-national"
              className="flex-1 px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] bg-transparent outline-none"
            />
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-[8px] text-[11px]" style={{ background: '#FFF8E6', color: '#92400E' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Você será redirecionado para a página segura da AbacatePay para inserir os dados do cartão.
          </div>
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
        {loading
          ? (method === 'card' ? 'Redirecionando...' : 'Processando...')
          : method === 'card'
            ? `Pagar ${valor} com cartão`
            : `Pagar ${valor} via Pix`
        }
      </button>
    </div>
  )
}
