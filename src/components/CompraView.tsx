'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { TransactionStatus } from '@/types/database'

interface CompraViewProps {
  transactionId: string
  productName: string
  productDescription: string | null
  amountCents: number
  sellerName: string
  initialStatus: TransactionStatus
  pixCopyPaste: string | null
  pixQrCode: string | null
  carrier: string | null
  trackingCode: string | null
}

const CARRIER_LABEL: Record<string, string> = {
  correios: 'Correios',
  jadlog: 'Jadlog',
  total_express: 'Total Express',
  azul_cargo: 'Azul Cargo',
  outro: 'Outro',
}

export function CompraView({
  transactionId,
  productName,
  productDescription,
  amountCents,
  sellerName,
  initialStatus,
  pixCopyPaste,
  pixQrCode,
  carrier: initialCarrier,
  trackingCode: initialTrackingCode,
}: CompraViewProps) {
  const [status, setStatus] = useState<TransactionStatus>(initialStatus)
  const [carrier, setCarrier] = useState<string | null>(initialCarrier)
  const [trackingCode, setTrackingCode] = useState<string | null>(initialTrackingCode)
  const [copiado, setCopiado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [simulando, setSimulando] = useState(false)
  const [disputaAberta, setDisputaAberta] = useState(false)
  const [disputaReason, setDisputaReason] = useState('')
  const [disputando, setDisputando] = useState(false)
  const isDev = process.env.NODE_ENV !== 'production'

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/pix-status`)
      const json = await res.json()
      if (json.status && json.status !== status) {
        setStatus(json.status)
        if (json.carrier) setCarrier(json.carrier)
        if (json.tracking_code) setTrackingCode(json.tracking_code)
      }
    } catch { /* ignora */ }
  }, [transactionId, status])

  useEffect(() => {
    if (status === 'released' || status === 'resolved') return
    const interval = setInterval(pollStatus, 4000)
    return () => clearInterval(interval)
  }, [status, pollStatus])

  async function copiar() {
    if (!pixCopyPaste) return
    await navigator.clipboard.writeText(pixCopyPaste)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function confirmarRecebimento() {
    setConfirmando(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/confirm-delivery`, { method: 'POST' })
      if (res.ok) setStatus('delivered')
    } catch { /* ignora */ } finally {
      setConfirmando(false)
    }
  }

  async function abrirDisputa() {
    setDisputando(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputaReason || 'Sem descrição' }),
      })
      if (res.ok) setStatus('disputed')
    } catch { /* ignora */ } finally {
      setDisputando(false)
    }
  }

  async function simularPagamento() {
    setSimulando(true)
    try {
      await fetch(`/api/transactions/${transactionId}/simulate-pay`, { method: 'POST' })
      setStatus('paid')
    } catch { /* ignora */ } finally {
      setSimulando(false)
    }
  }

  // ── Header comum ────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center gap-2 mb-6">
      <div className="w-7 h-7 rounded-[8px] bg-[#1B4DFF] flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <span className="text-[15px] font-medium text-[#1A202C]">Segura Pay</span>
    </div>
  )

  // ── Produto resumo ────────────────────────────────────────────────────────
  const produtoCard = (
    <div className="rounded-[12px] border border-[#E4E8F0] overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-[#E4E8F0]">
        <p className="text-[12px] font-medium text-[#8890A4] uppercase tracking-wide mb-0.5">produto</p>
        <p className="text-[15px] font-medium text-[#1A202C]">{productName}</p>
        {productDescription && <p className="text-[13px] text-[#4A5568] mt-0.5">{productDescription}</p>}
      </div>
      <div className="px-4 py-3 flex justify-between items-baseline">
        <span className="text-[13px] text-[#8890A4]">vendedor: <span className="text-[#4A5568] font-medium">{sellerName}</span></span>
        <span className="text-[22px] font-medium text-[#1A202C]">{valor}</span>
      </div>
    </div>
  )

  // ── Estado: aguardando pagamento (pending) ────────────────────────────────
  if (status === 'pending' && pixCopyPaste) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}

        {pixQrCode && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[12px] text-[#8890A4]">escaneie com o app do banco</p>
            <div className="p-3 bg-white border border-[#E4E8F0] rounded-[12px]">
              <Image src={pixQrCode} alt="QR Code Pix" width={200} height={200} unoptimized />
            </div>
          </div>
        )}

        {pixQrCode && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E4E8F0]" />
            <span className="text-[12px] text-[#8890A4]">ou copia e cola</span>
            <div className="flex-1 h-px bg-[#E4E8F0]" />
          </div>
        )}

        <div className="rounded-[10px] border border-[#E4E8F0] bg-[#F2F4F7] p-4">
          <p className="text-[12px] font-medium text-[#8890A4] mb-2">código pix</p>
          <p className="text-[12px] font-mono text-[#1A202C] break-all leading-relaxed">{pixCopyPaste}</p>
        </div>

        <button onClick={copiar} className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]">
          {copiado ? '✓ Código copiado!' : 'Copiar código Pix'}
        </button>

        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#D97706' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>O dinheiro fica retido no Segura Pay. Só é liberado ao vendedor após você confirmar o recebimento.</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8890A4]">
          <span className="w-2 h-2 rounded-full bg-[#8890A4] animate-pulse inline-block" />
          aguardando pagamento...
        </div>

        {isDev && (
          <div className="border-t border-dashed border-[#E4E8F0] pt-4">
            <p className="text-[11px] text-[#8890A4] text-center mb-2">ambiente de teste</p>
            <button onClick={simularPagamento} disabled={simulando} className="w-full rounded-[10px] bg-[#F2F4F7] hover:bg-[#E4E8F0] disabled:opacity-50 px-5 py-2.5 text-[13px] font-medium text-[#4A5568] transition-all border border-[#E4E8F0]">
              {simulando ? 'Simulando...' : 'Simular pagamento (sandbox)'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Estado: pago, aguardando envio ────────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EEF2FF', borderLeft: '3px solid #1B4DFF', color: '#1338CC' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span><strong>Pagamento confirmado!</strong> O dinheiro está retido no Segura Pay. Aguardando o vendedor enviar o produto.</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8890A4]">
          <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse inline-block" />
          aguardando envio...
        </div>
      </div>
    )
  }

  // ── Estado: em transporte ─────────────────────────────────────────────────
  if (status === 'tracked') {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}

        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <div>
            <p><strong>Produto a caminho!</strong></p>
            {carrier && trackingCode && (
              <p className="mt-0.5">
                {CARRIER_LABEL[carrier] ?? carrier} · <span className="font-mono">{trackingCode}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[14px] text-[#4A5568]">Já recebeu o produto?</p>
          <button
            onClick={confirmarRecebimento}
            disabled={confirmando}
            className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            {confirmando ? 'Confirmando...' : 'Produto recebido'}
          </button>
          <p className="text-[11px] text-[#8890A4] text-center">Ao confirmar, o pagamento é liberado ao vendedor.</p>
        </div>
      </div>
    )
  }

  // ── Estado: entregue — comprador avalia ──────────────────────────────────
  if (status === 'delivered') {
    if (disputaAberta) {
      return (
        <div className="flex flex-col gap-4">
          {header}
          {produtoCard}
          <div>
            <label className="block text-[13px] font-medium text-[#4A5568] mb-1">Descreva o problema</label>
            <textarea
              value={disputaReason}
              onChange={e => setDisputaReason(e.target.value)}
              rows={3}
              placeholder="Ex: produto não corresponde ao anúncio, veio com defeito..."
              className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDisputaAberta(false)}
              className="flex-1 rounded-[10px] border border-[#E4E8F0] px-4 py-2.5 text-[14px] font-medium text-[#4A5568] hover:bg-[#F2F4F7] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={abrirDisputa}
              disabled={disputando}
              className="flex-1 rounded-[10px] bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 disabled:opacity-60 px-4 py-2.5 text-[14px] font-medium transition-all"
            >
              {disputando ? 'Enviando...' : 'Confirmar disputa'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Produto recebido. Tudo de acordo?</span>
        </div>
        <button
          onClick={confirmarRecebimento}
          disabled={confirmando}
          className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all active:scale-[0.98]"
        >
          {confirmando ? 'Confirmando...' : 'Produto de acordo com o esperado'}
        </button>
        <button
          onClick={() => setDisputaAberta(true)}
          className="w-full rounded-[10px] bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 px-5 py-2.5 text-[14px] font-medium transition-all"
        >
          Abrir disputa
        </button>
        <p className="text-[11px] text-[#8890A4] text-center">
          Ao confirmar, o pagamento é liberado ao vendedor.
        </p>
      </div>
    )
  }

  // ── Estado: liberado ──────────────────────────────────────────────────────
  if (status === 'released' || status === 'resolved') {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Transação concluída. O pagamento foi liberado ao vendedor.</span>
        </div>
      </div>
    )
  }

  // ── Estado: disputed ─────────────────────────────────────────────────────
  if (status === 'disputed') {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {produtoCard}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
          <span>Disputa em andamento. Nossa equipe irá entrar em contato.</span>
        </div>
      </div>
    )
  }

  return null
}
