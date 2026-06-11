'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EvidenciaVendedor({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  function addImages(files: FileList | null) {
    if (!files) return
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'))
    const merged = [...images, ...allowed].slice(0, 5)
    setImages(merged)
    setPreviews(merged.map(f => URL.createObjectURL(f)))
    setErro(null)
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i)
    setImages(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  async function handleSubmit() {
    setErro(null)
    let evidenceUrls: string[] = []

    if (images.length > 0) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('transactionId', transactionId)
        images.forEach(f => fd.append('files', f))
        const res = await fetch('/api/upload/dispute-evidence', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) { setErro(json.error ?? 'Erro ao enviar imagens'); setUploading(false); return }
        evidenceUrls = json.urls
      } catch {
        setErro('Erro de conexão ao enviar imagens.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/seller-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, evidence_urls: evidenceUrls }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao enviar evidências'); return }
      setEnviado(true)
      router.refresh()
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (enviado) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Evidências enviadas com sucesso. Nossa equipe irá analisar.</span>
      </div>
    )
  }

  const isBusy = uploading || submitting

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-[#1A202C]">Sua defesa</p>
      <p className="text-[12px] text-[#8890A4]">
        Adicione sua versão dos fatos e evidências (fotos do produto, conversas, etc.).
      </p>

      {/* Nota */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        placeholder="Descreva sua versão: o produto foi entregue conforme anunciado, fotos do envio, etc."
        className="w-full rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150 resize-none"
      />

      {/* Imagens */}
      <div>
        <p className="text-[12px] font-medium text-[#4A5568] mb-1.5">
          Evidências <span className="text-[#8890A4] font-normal">(até 5 imagens)</span>
        </p>

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
          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-[8px] border border-dashed border-[#E4E8F0] hover:border-[#1B4DFF] hover:bg-[#EEF2FF] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8890A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-[12px] text-[#8890A4]">
              {images.length === 0 ? 'Adicionar imagens' : `Adicionar mais (${images.length}/5)`}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
          </label>
        )}
      </div>

      {erro && <p className="text-[12px] text-[#EF4444]">{erro}</p>}

      <button
        onClick={handleSubmit}
        disabled={isBusy || (!note.trim() && images.length === 0)}
        className="w-full rounded-[10px] bg-[#1B4DFF] hover:bg-[#1338CC] disabled:opacity-50 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98]"
      >
        {uploading ? 'Enviando imagens...' : submitting ? 'Salvando...' : 'Enviar evidências'}
      </button>
    </div>
  )
}
