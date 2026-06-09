'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface PixInstrucoesProps {
  transactionId: string
  pixCopyPaste: string
  pixQrCode: string | null
  amountCents: number
  productName: string
  redirectOnPaid?: string
}

export function PixInstrucoes({
  transactionId,
  pixCopyPaste,
  pixQrCode,
  amountCents,
  productName,
  redirectOnPaid,
}: PixInstrucoesProps) {
  const router = useRouter()
  const [copiado, setCopiado] = useState(false)
  const [pago, setPago] = useState(false)
  const [simulando, setSimulando] = useState(false)
  const isDev = process.env.NODE_ENV !== 'production'

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/pix-status`)
      const json = await res.json()
      if (json.status === 'paid') setPago(true)
    } catch {
      // silently ignore — next poll will retry
    }
  }, [transactionId])

  useEffect(() => {
    if (pago) {
      if (redirectOnPaid) {
        const t = setTimeout(() => router.push(redirectOnPaid), 1500)
        return () => clearTimeout(t)
      }
      return
    }
    const interval = setInterval(checkStatus, 4000)
    return () => clearInterval(interval)
  }, [pago, checkStatus, redirectOnPaid, router])

  async function simularPagamento() {
    setSimulando(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/simulate-pay`, { method: 'POST' })
      if (res.ok) setPago(true)
    } catch {
      // ignora — polling vai detectar
    } finally {
      setSimulando(false)
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(pixCopyPaste)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (pago) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-[18px] font-medium text-[#1A202C]">Pagamento confirmado!</p>
          <p className="text-[13px] text-[#8890A4] mt-1">
            {redirectOnPaid
              ? 'Redirecionando para sua transação...'
              : 'O dinheiro está retido no Segura Pay. Aguarde a entrega do produto.'}
          </p>
        </div>
        <div className="w-full p-3 rounded-[10px] bg-[#ECFDF5] border-l-[3px] border-[#10B981] text-[13px] text-[#047857] text-left">
          {redirectOnPaid
            ? 'A transação já está em "Minhas transações → Comprador". Confirme o recebimento após receber o produto.'
            : 'Você receberá instruções sobre a entrega em breve. Confirme o recebimento após receber o produto para liberar o pagamento ao vendedor.'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Valor */}
      <div className="rounded-[16px] border border-[#E4E8F0] p-5 text-center">
        <p className="text-[13px] text-[#8890A4]">valor a pagar</p>
        <p className="text-[28px] font-medium text-[#1A202C] mt-1">{valor}</p>
        <p className="text-[12px] text-[#8890A4] mt-1">{productName}</p>
      </div>

      {/* QR Code */}
      {pixQrCode && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[12px] font-medium text-[#8890A4]">escaneie com o app do banco</p>
          <div className="p-3 bg-white border border-[#E4E8F0] rounded-[12px] inline-block">
            <Image
              src={pixQrCode}
              alt="QR Code Pix"
              width={200}
              height={200}
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Separador */}
      {pixQrCode && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E4E8F0]" />
          <span className="text-[12px] text-[#8890A4]">ou use copia e cola</span>
          <div className="flex-1 h-px bg-[#E4E8F0]" />
        </div>
      )}

      {/* Copia e cola */}
      <div className="rounded-[10px] border border-[#E4E8F0] bg-[#F2F4F7] p-4">
        <p className="text-[12px] font-medium text-[#8890A4] mb-2">chave pix (copia e cola)</p>
        <p className="text-[12px] font-mono text-[#1A202C] break-all leading-relaxed">{pixCopyPaste}</p>
      </div>

      <button
        onClick={copiar}
        className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
      >
        {copiado ? '✓ Código copiado!' : 'Copiar código Pix'}
      </button>

      {/* Instruções */}
      <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EEF2FF', borderLeft: '3px solid #1B4DFF', color: '#1338CC' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Abra o app do seu banco → Pix → Copia e cola → cole o código → confirme o valor de <strong>{valor}</strong>.</span>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#D97706' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>O dinheiro fica retido no Segura Pay até você confirmar o recebimento. Só então o vendedor recebe.</span>
      </div>

      {/* Indicador de aguardando */}
      <div className="flex items-center justify-center gap-2 text-[12px] text-[#8890A4]">
        <span className="inline-block w-2 h-2 rounded-full bg-[#8890A4] animate-pulse" />
        aguardando pagamento...
      </div>

      {/* Botão de simulação — apenas em ambiente de desenvolvimento */}
      {isDev && (
        <div className="border-t border-dashed border-[#E4E8F0] pt-4">
          <p className="text-[11px] text-[#8890A4] text-center mb-2">ambiente de teste</p>
          <button
            onClick={simularPagamento}
            disabled={simulando}
            className="w-full rounded-[10px] bg-[#F2F4F7] hover:bg-[#E4E8F0] disabled:opacity-50 px-5 py-2.5 text-[13px] font-medium text-[#4A5568] transition-all duration-150 border border-[#E4E8F0]"
          >
            {simulando ? 'Simulando...' : 'Simular pagamento (sandbox)'}
          </button>
        </div>
      )}
    </div>
  )
}
