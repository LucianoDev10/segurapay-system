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
  carrier?: string | null
  trackingCode?: string | null
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

      <div className="relative w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1A202C]">Confirmar entrega</p>
          <p className="text-[13px] text-[#4A5568] mt-2 leading-relaxed">
            Confirme que o produto chegou até você. Você terá <strong>24 horas</strong> para avaliar e abrir uma disputa se necessário.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Se não houver disputa dentro do prazo, o pagamento é <strong>liberado automaticamente</strong> ao vendedor.</span>
        </div>

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
            {loading ? 'Confirmando...' : 'Recebi o produto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LiberarPagamentoModal({
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

      <div className="relative w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1338CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1A202C]">Liberar pagamento</p>
          <p className="text-[13px] text-[#4A5568] mt-2 leading-relaxed">
            Confirme que o produto está <strong>exatamente como anunciado</strong>. Ao confirmar, o pagamento será liberado imediatamente ao vendedor.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[12px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#92400E' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Esta ação é <strong>irreversível</strong>. Se houver algum problema com o produto, use <strong>"Abrir disputa"</strong> em vez disso.</span>
        </div>

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
            className="flex-1 rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? 'Liberando...' : 'Confirmar e liberar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DISPUTE_CATEGORIES = [
  { value: 'nao_recebeu', label: 'Não recebi o pedido' },
  { value: 'item_danificado', label: 'O item foi danificado durante o transporte' },
  { value: 'item_diferente', label: 'O item é diferente / não corresponde ao anúncio' },
]

function DisputaModal({
  transactionId,
  onConfirm,
  onCancel,
  loading,
}: {
  transactionId: string
  onConfirm: (reason: string, evidenceUrls: string[]) => void
  onCancel: () => void
  loading: boolean
}) {
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function addImages(files: FileList | null) {
    if (!files) return
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'))
    const merged = [...images, ...allowed].slice(0, 5)
    setImages(merged)
    setPreviews(merged.map(f => URL.createObjectURL(f)))
    setUploadError(null)
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i)
    setImages(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  async function handleSubmit() {
    setUploadError(null)
    let evidenceUrls: string[] = []

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('transactionId', transactionId)
      images.forEach(f => fd.append('files', f))
      const res = await fetch('/api/upload/dispute-evidence', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setUploadError(json.error ?? 'Erro ao enviar imagens'); setUploading(false); return }
      evidenceUrls = json.urls
    } catch {
      setUploadError('Erro de conexão ao enviar imagens.')
      setUploading(false)
      return
    }
    setUploading(false)

    const categoryLabel = DISPUTE_CATEGORIES.find(c => c.value === category)?.label ?? category
    onConfirm(`[${categoryLabel}] ${reason.trim()}`, evidenceUrls)
  }

  const canSubmit = !!category && reason.trim().length > 0 && images.length > 0
  const isBusy = loading || uploading

  const selectClass = "w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/20 transition-all duration-150 appearance-none cursor-pointer"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

      <div className="relative w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Ícone */}
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Título */}
        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1A202C]">Abrir disputa</p>
          <p className="text-[13px] text-[#4A5568] mt-1 leading-relaxed">
            Preencha todos os campos. O Segura Pay irá mediar a situação.
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
            Tipo de problema <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={`${selectClass} pr-9 ${!category ? 'text-[#8890A4]' : ''}`}
            >
              <option value="" disabled>Selecione o tipo de problema</option>
              {DISPUTE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
            Descreva o problema <span className="text-[#EF4444]">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Descreva detalhadamente o que aconteceu..."
            className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/20 transition-all duration-150 resize-none"
          />
        </div>

        {/* Evidências */}
        <div>
          <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
            Evidências <span className="text-[#EF4444]">*</span>
            <span className="text-[#8890A4] font-normal ml-1">(mín. 1 · máx. 5 imagens)</span>
          </label>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#E4E8F0] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`evidência ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className={`flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-[8px] border border-dashed transition-colors ${images.length === 0 ? 'border-[#EF4444]/40 bg-[#FEF2F2]/50 hover:bg-[#FEF2F2]' : 'border-[#E4E8F0] hover:border-[#EF4444] hover:bg-[#FEF2F2]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[12px] text-[#8890A4]">
                {images.length === 0 ? 'Adicionar imagens (obrigatório)' : `Adicionar mais (${images.length}/5)`}
              </span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
            </label>
          )}

          {uploadError && <p className="text-[11px] text-[#EF4444] mt-1.5">{uploadError}</p>}
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
            disabled={isBusy}
            className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white hover:bg-[#F2F4F7] px-4 py-2.5 text-[14px] font-medium text-[#4A5568] transition-all duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy || !canSubmit}
            className="flex-1 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            {uploading ? 'Enviando...' : loading ? 'Abrindo...' : 'Abrir disputa'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CARRIER_LABEL: Record<string, string> = {
  correios: 'Correios',
  jadlog: 'Jadlog',
  total_express: 'Total Express',
  azul_cargo: 'Azul Cargo',
  outro: 'Outro',
}

export function AcoesTransacao({ transactionId, status, role, complaintDeadline, trackingDeadline, carrier, trackingCode }: AcoesTransacaoProps) {
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

  if (status === 'tracked') {
    const trackingCard = trackingCode && (
      <div className="rounded-[10px] border border-[#E4E8F0] overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F2F4F7] border-b border-[#E4E8F0]">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span className="text-[11px] font-medium text-[#4A5568] uppercase tracking-wide">rastreio</span>
        </div>
        <div className="px-3.5 py-3 flex flex-col gap-2">
          {carrier && (
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-[#8890A4]">Transportadora</span>
              <span className="text-[13px] font-medium text-[#1A202C]">{CARRIER_LABEL[carrier] ?? carrier}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3">
            <span className="text-[12px] text-[#8890A4] flex-shrink-0">Código</span>
            <span className="text-[13px] font-medium text-[#1A202C] font-mono tracking-wide break-all text-right">{trackingCode}</span>
          </div>
        </div>
      </div>
    )

    if (role === 'seller') {
      return (
        <div className="flex flex-col gap-3">
          {trackingCard}
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Produto enviado. Aguardando o comprador confirmar o recebimento para liberar o pagamento.</span>
          </div>
        </div>
      )
    }

    // role === 'buyer'
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
          {trackingCard}
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>O produto está a caminho. Confirme quando receber — você terá 24h para avaliar antes do pagamento ser liberado.</span>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading !== null}
            className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-60 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
          >
            Confirmar entrega
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
    if (status === 'delivered') {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>O comprador confirmou o recebimento do produto.</span>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#EFF6FF', borderLeft: '3px solid #1D4ED8', color: '#1D4ED8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>
              O comprador tem <strong>24 horas</strong> para contestar a entrega.
              {deadlineStr
                ? <> Se não houver disputa, o pagamento será liberado em <strong>{deadlineStr}</strong>.</>
                : <> Se não houver disputa, o pagamento será liberado automaticamente.</>}
            </span>
          </div>
        </div>
      )
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
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FFF8E6', borderLeft: '3px solid #D97706', color: '#92400E' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Aguardando o vendedor enviar o produto. Você será notificado assim que o código de rastreio for adicionado.</span>
        </div>
      )
    }

    if (status === 'delivered') {
      return (
        <>
          {showConfirm && (
            <LiberarPagamentoModal
              onConfirm={() => { setShowConfirm(false); action('release') }}
              onCancel={() => setShowConfirm(false)}
              loading={loading === 'release'}
            />
          )}
          {showDisputa && (
            <DisputaModal
              transactionId={transactionId}
              onConfirm={(reason, evidenceUrls) => { setShowDisputa(false); action('dispute', { reason, evidence_urls: evidenceUrls }) }}
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
