'use client'

import { useState } from 'react'

interface LinkGeradoProps {
  link: string
  productName: string
  amountCents: number
  onNova: () => void
}

export function LinkGerado({ link, productName, amountCents, onNova }: LinkGeradoProps) {
  const [copiado, setCopiado] = useState(false)

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function copiar() {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Criei um link seguro pelo Segura Pay para você pagar com proteção pelo produto "${productName}" (${valor}).\n\nAcesse aqui: ${link}`,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <div>
          <p className="font-medium">Link de pagamento gerado!</p>
          <p className="font-mono text-[11px] mt-1 break-all text-[#047857]/80">{link}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={copiar}
          className="w-full rounded-[10px] bg-[#EEF2FF] text-[#1338CC] border border-[#C7D2FE] px-5 py-2.5 text-[14px] font-medium hover:bg-[#C7D2FE]/40 transition-all duration-150"
        >
          {copiado ? '✓ Link copiado!' : 'Copiar link'}
        </button>

        <a
          href={`https://wa.me/?text=${mensagemWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-[10px] bg-[#25D366] hover:bg-[#1ebe5d] px-5 py-2.5 text-[14px] font-medium text-white text-center transition-all duration-150"
        >
          Enviar pelo WhatsApp
        </a>

        <button
          onClick={onNova}
          className="w-full rounded-[10px] bg-transparent border border-[#E4E8F0] hover:bg-[#F2F4F7] px-5 py-2.5 text-[14px] font-medium text-[#4A5568] transition-all duration-150"
        >
          Criar nova transação
        </button>
      </div>
    </div>
  )
}
