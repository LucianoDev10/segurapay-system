'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TransactionStatus } from '@/types/database'

interface AcoesTransacaoProps {
  transactionId: string
  status: TransactionStatus
  role: 'buyer' | 'seller'
  complaintDeadline: string | null
  trackingDeadline: string | null
}

const inputClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"

function ConfirmacaoModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-6 flex flex-col gap-4">
        {/* Ícone */}
        <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1A202C]">Confirmar recebimento</p>
          <p className="text-[13px] text-[#4A5568] mt-2 leading-relaxed">
            Você confirma que recebeu o produto <strong>exatamente como anunciado</strong>, sem avarias ou divergências?
          </p>
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#92400E' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Após confirmar, o pagamento é <strong>liberado ao vendedor</strong>. Essa ação não pode ser desfeita.</span>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white hover:bg-[#F2F4F7] px-4 py-2.5 text-[14px] font-medium text-[#4A5568] transition-all duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-[10px] bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? 'Confirmando...' : 'Sim, recebi'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DisputaModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-6 flex flex-col gap-4">
        {/* Ícone */}
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1A202C]">Abrir disputa</p>
          <p className="text-[13px] text-[#4A5568] mt-2 leading-relaxed">
            Descreva o problema com o produto recebido. O Segura Pay irá mediar a situação.
          </p>
        </div>

        {/* Textarea */}
        <div>
          <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
            Motivo da disputa <span className="text-[#EF4444]">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: produto não corresponde ao anúncio, veio com defeito, item faltando..."
            className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/20 transition-all duration-150 resize-none"
          />
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#7F1D1D' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>O pagamento ficará <strong>retido</strong> até a resolução. Nossa equipe entrará em contato com ambas as partes.</span>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white hover:bg-[#F2F4F7] px-4 py-2.5 text-[14px] font-medium text-[#4A5568] transition-all duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || 'Sem descrição')}
            disabled={loading || !reason.trim()}
            className="flex-1 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? 'Enviando...' : 'Abrir disputa'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AcoesTransacao({ transactionId, status, role, complaintDeadline, trackingDeadline }: AcoesTransacaoProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDisputa, setShowDisputa] = useState(false)

  async function action(endpoint: string, body?: object) {
    setLoading(endpoint)
    setErro(null)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro'); return }
      router.refresh()
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  const deadlineStr = complaintDeadline
    ? new Date(complaintDeadline).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null

  // "Produto recebido" visível para qualquer papel quando em transporte
  if (status === 'tracked') {
    return (
      <>
        {showConfirm && (
          <ConfirmacaoModal
            onConfirm={() => { setShowConfirm(false); action('confirm-delivery') }}
            onCancel={() => setShowConfirm(false)}
            loading={loading === 'confirm-delivery'}
          />
        )}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>O produto está a caminho. Clique assim que receber.</span>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading !== null}
            className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            Produto recebido
          </button>
          {erro && <p className="text-[12px] text-[#EF4444]">{erro}</p>}
        </div>
      </>
    )
  }

  if (role === 'seller') {
    if (status === 'paid') {
      return <TrackingForm transactionId={transactionId} trackingDeadline={trackingDeadline} onAction={action} loading={loading} erro={erro} />
    }
    if (status === 'released') {
      return (
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
          <span className="font-medium">Pagamento liberado! O valor será transferido em até 1 dia útil.</span>
        </div>
      )
    }
    return null
  }

  if (role === 'buyer') {
    if (status === 'paid') {
      return (
        <>
          {showConfirm && (
            <ConfirmacaoModal
              onConfirm={() => { setShowConfirm(false); action('confirm-delivery') }}
              onCancel={() => setShowConfirm(false)}
              loading={loading === 'confirm-delivery'}
            />
          )}
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[#4A5568]">Recebeu o produto em perfeitas condições?</p>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading !== null}
              className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
            >
              Confirmar recebimento
            </button>
            {erro && <p className="text-[12px] text-[#EF4444]">{erro}</p>}
          </div>
        </>
      )
    }

    if (status === 'delivered') {
      return (
        <>
          {showConfirm && (
            <ConfirmacaoModal
              onConfirm={() => { setShowConfirm(false); action('confirm-delivery') }}
              onCancel={() => setShowConfirm(false)}
              loading={loading === 'confirm-delivery'}
            />
          )}
          {showDisputa && (
            <DisputaModal
              onConfirm={(reason) => { setShowDisputa(false); action('dispute', { reason }) }}
              onCancel={() => setShowDisputa(false)}
              loading={loading === 'dispute'}
            />
          )}
          <div className="flex flex-col gap-3">
            {deadlineStr && (
              <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#D97706' }}>
                Você tem até <strong className="mx-1">{deadlineStr}</strong> para abrir uma disputa caso haja algum problema.
              </div>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading !== null}
              className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
            >
              Produto de acordo com o esperado
            </button>
            <button
              onClick={() => setShowDisputa(true)}
              disabled={loading !== null}
              className="w-full rounded-[10px] bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium transition-all duration-150"
            >
              Abrir disputa
            </button>
            {erro && <p className="text-[12px] text-[#EF4444]">{erro}</p>}
          </div>
        </>
      )
    }
  }

  return null
}

function formatTrackingDeadline(deadline: string): { text: string; urgent: boolean; expired: boolean } {
  const now = new Date()
  const end = new Date(deadline)
  const msLeft = end.getTime() - now.getTime()

  if (msLeft <= 0) {
    return { text: 'Prazo expirado', urgent: true, expired: true }
  }

  const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000))
  const daysLeft = Math.floor(hoursLeft / 24)
  const remHours = hoursLeft % 24
  const timeStr = daysLeft > 0 ? `${daysLeft}d ${remHours}h` : `${hoursLeft}h`

  return { text: timeStr, urgent: hoursLeft < 24, expired: false }
}

function TrackingForm({
  trackingDeadline,
  onAction,
  loading,
  erro,
}: {
  transactionId?: string
  trackingDeadline: string | null
  onAction: (endpoint: string, body?: object) => Promise<void>
  loading: string | null
  erro: string | null
}) {
  const [carrier, setCarrier] = useState('')
  const [code, setCode] = useState('')
  const selectClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"
  const inputClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"

  const deadline = trackingDeadline ? formatTrackingDeadline(trackingDeadline) : null

  return (
    <div className="flex flex-col gap-3">
      {deadline && (
        deadline.expired ? (
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#7F1D1D' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Prazo expirado. Esta transação será <strong>cancelada em breve</strong> e o comprador reembolsado.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{
            background: deadline.urgent ? '#FEF2F2' : '#FFF8E6',
            borderLeft: `3px solid ${deadline.urgent ? '#EF4444' : '#D97706'}`,
            color: deadline.urgent ? '#7F1D1D' : '#92400E',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={deadline.urgent ? '#EF4444' : '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>
              Você tem <strong>{deadline.text}</strong> para adicionar o rastreio.
              Sem isso, a transação é <strong>cancelada</strong> e o comprador reembolsado.
            </span>
          </div>
        )
      )}
      <p className="text-[13px] font-medium text-[#4A5568]">Adicionar código de rastreio</p>
      <select value={carrier} onChange={e => setCarrier(e.target.value)} className={selectClass}>
        <option value="">Transportadora</option>
        <option value="correios">Correios</option>
        <option value="jadlog">Jadlog</option>
        <option value="total_express">Total Express</option>
        <option value="azul_cargo">Azul Cargo</option>
        <option value="outro">Outro</option>
      </select>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Código de rastreio (ex: BR123456789BR)"
        className={inputClass}
      />
      <button
        onClick={() => onAction('tracking', { carrier, tracking_code: code })}
        disabled={!carrier || !code || loading !== null}
        className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
      >
        {loading === 'tracking' ? 'Salvando...' : 'Adicionar rastreio'}
      </button>
      {erro && <p className="text-[12px] text-[#EF4444]">{erro}</p>}
    </div>
  )
}
