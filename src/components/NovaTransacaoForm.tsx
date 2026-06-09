'use client'

import { useState, useEffect } from 'react'
import { LinkGerado } from '@/components/LinkGerado'
import { maskCurrency, parseCurrencyCents } from '@/lib/masks'
import { createClient } from '@/lib/supabase/client'
import type { Transaction } from '@/types/database'

interface ApiResponse {
  transaction: Transaction
  link: string
}

type Role = 'vendedor' | 'comprador'

const STEPS = ['Seu papel', 'Detalhes', 'Pronto']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  done || active ? 'bg-[#1B4DFF] text-white' : 'bg-[#F2F4F7] text-[#8890A4]'
                }`}
              >
                {done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : step}
              </div>
              <span className={`text-[12px] font-medium hidden sm:inline ${active ? 'text-[#1A202C]' : 'text-[#8890A4]'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${done ? 'bg-[#C7D2FE]' : 'bg-[#E4E8F0]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function RoleCard({ role, selected, onClick }: { role: Role; selected: boolean; onClick: () => void }) {
  const isVendedor = role === 'vendedor'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[10px] border-2 p-4 transition-all duration-150 ${
        selected ? 'border-[#1B4DFF] bg-[#EEF2FF]' : 'border-[#E4E8F0] bg-white hover:border-[#C7D2FE] hover:bg-[#F2F4F7]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${selected ? 'bg-[#C7D2FE]' : 'bg-[#F2F4F7]'}`}>
          {isVendedor ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected ? '#1338CC' : '#8890A4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected ? '#1338CC' : '#8890A4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          )}
        </div>
        <div>
          <p className={`font-medium text-[14px] ${selected ? 'text-[#1338CC]' : 'text-[#1A202C]'}`}>
            {isVendedor ? 'Sou vendedor' : 'Sou comprador'}
          </p>
          <p className="text-[12px] text-[#8890A4] mt-0.5">
            {isVendedor ? 'Quero gerar um link de pagamento seguro' : 'Recebi um link e quero pagar com segurança'}
          </p>
        </div>
        <div className="ml-auto">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#1B4DFF]' : 'border-[#E4E8F0]'}`}>
            {selected && <div className="w-2 h-2 rounded-full bg-[#1B4DFF]" />}
          </div>
        </div>
      </div>
    </button>
  )
}

const inputClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"
const labelClass = "block text-[13px] font-medium text-[#4A5568] mb-1"

export function NovaTransacaoForm() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [resultado, setResultado] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [linkComprador, setLinkComprador] = useState('')
  const [erroLink, setErroLink] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('name, phone').eq('id', user.id).single()
      if (data) {
        setUserName(data.name ?? null)
        setUserPhone(data.phone ?? null)
      }
    })
  }, [])

  function handleAcessarLink() {
    setErroLink(null)
    const trimmed = linkComprador.trim()
    const match = trimmed.match(/\/pagar\/([0-9a-f-]{36})/i)
    if (!match) {
      setErroLink('Link inválido. Cole o link completo enviado pelo vendedor.')
      return
    }
    window.location.href = `/pagar/${match[1]}`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const amountCents = parseCurrencyCents(amount)
    if (amountCents < 100) {
      setErro('O valor mínimo é R$ 1,00')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: data.get('product_name'),
          product_description: data.get('product_description') || undefined,
          amount_cents: amountCents,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao criar transação'); return }
      setResultado(json)
      setStep(3)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function resetar() {
    setStep(1); setRole(null); setResultado(null); setErro(null)
    setAmount('')
  }

  return (
    <div>
      <StepIndicator current={step} />

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[#4A5568] mb-1">Como você vai usar o Segura Pay nessa transação?</p>
          <RoleCard role="vendedor" selected={role === 'vendedor'} onClick={() => setRole('vendedor')} />
          <RoleCard role="comprador" selected={role === 'comprador'} onClick={() => setRole('comprador')} />
          <button
            type="button"
            disabled={!role}
            onClick={() => setStep(role === 'comprador' ? 2 : 2)}
            className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98] mt-2"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && role === 'comprador' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EEF2FF', borderLeft: '3px solid #1B4DFF', color: '#1338CC' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Cole aqui o link enviado pelo vendedor pelo WhatsApp.</span>
          </div>
          <div>
            <label className={labelClass}>link de pagamento <span className="text-[#EF4444]">*</span></label>
            <input
              type="url"
              placeholder="https://... ou cole o link aqui"
              value={linkComprador}
              onChange={e => { setLinkComprador(e.target.value); setErroLink(null) }}
              className={inputClass}
            />
          </div>
          {erroLink && (
            <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
              {erroLink}
            </div>
          )}
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white hover:bg-[#F2F4F7] px-5 py-2.5 text-[14px] font-medium text-[#1A202C] transition-all">
              Voltar
            </button>
            <button
              type="button"
              disabled={!linkComprador.trim()}
              onClick={handleAcessarLink}
              className="flex-1 rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-[14px] font-medium text-white transition-all active:scale-[0.98]"
            >
              Acessar link
            </button>
          </div>
        </div>
      )}

      {step === 2 && role === 'vendedor' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Card com dados do vendedor — vem do cadastro */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#F2F4F7] border border-[#E4E8F0]">
            <div className="w-8 h-8 rounded-full bg-[#1B4DFF] flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0">
              {userName ? userName[0].toUpperCase() : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#1A202C] truncate">{userName ?? '—'}</p>
              <p className="text-[11px] text-[#8890A4] truncate">
                {userPhone
                  ? `+55 ${userPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}`
                  : 'WhatsApp não cadastrado'}
              </p>
            </div>
            <span className="ml-auto text-[11px] text-[#8890A4] flex-shrink-0">vendedor</span>
          </div>

          <div>
            <label className={labelClass}>nome do produto <span className="text-[#EF4444]">*</span></label>
            <input name="product_name" required placeholder="ex: iPhone 13 Pro 128GB" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>descrição</label>
            <textarea name="product_description" rows={3} placeholder="Condição, acessórios incluídos..." className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>valor <span className="text-[#EF4444]">*</span></label>
            <div className="flex rounded-[10px] border border-[#E4E8F0] overflow-hidden bg-white focus-within:border-[#1B4DFF] focus-within:ring-1 focus-within:ring-[#1B4DFF]/20 transition-all duration-150">
              <span className="px-3.5 py-2.5 bg-[#F2F4F7] border-r border-[#E4E8F0] text-[14px] font-medium text-[#8890A4]">R$</span>
              <input
                name="amount"
                required
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(maskCurrency(e.target.value))}
                className="flex-1 px-3.5 py-2.5 text-[14px] text-[#1A202C] bg-transparent outline-none placeholder:text-[#8890A4]"
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
              {erro}
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white hover:bg-[#F2F4F7] px-5 py-2.5 text-[14px] font-medium text-[#1A202C] transition-all duration-150">
              Voltar
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]">
              {loading ? 'Gerando...' : 'Gerar link'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && resultado && (
        <LinkGerado
          link={resultado.link}
          productName={resultado.transaction.product_name}
          amountCents={resultado.transaction.amount_cents}
          onNova={resetar}
        />
      )}
    </div>
  )
}
