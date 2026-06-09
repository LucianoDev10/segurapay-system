'use client'

import { useState } from 'react'

interface CopiarLinkCardProps {
  link: string
  productName: string
  amountCents: number
}

export function CopiarLinkCard({ link, productName, amountCents }: CopiarLinkCardProps) {
  const [copiado, setCopiado] = useState(false)

  const valor = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function copiar() {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const mensagem = encodeURIComponent(
    `Olá! Criei um link seguro pelo Segura Pay para você pagar com proteção o produto "${productName}" (${valor}).\n\nAcesse aqui: ${link}`,
  )

  return (
    <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Link de pagamento</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#D97706] font-medium">Aguardando pagamento</span>
      </div>

      {/* URL */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[#F2F4F7] border border-[#E4E8F0]">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <p className="text-[12px] font-mono text-[#4A5568] truncate flex-1">{link}</p>
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        <button
          onClick={copiar}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#EEF2FF] text-[#1338CC] border border-[#C7D2FE] px-4 py-2.5 text-[13px] font-medium hover:bg-[#C7D2FE]/40 transition-all duration-150 active:scale-[0.98]"
        >
          {copiado ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copiar link
            </>
          )}
        </button>

        <a
          href={`https://wa.me/?text=${mensagem}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  )
}
