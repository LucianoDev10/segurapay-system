import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTransactionAdmin } from '@/lib/admin'
import { StatusTimeline } from '@/components/StatusTimeline'
import { AdminAcoes } from '@/components/admin/AdminAcoes'
import type { EscrowEvent, TransactionStatus } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const tx = await getTransactionAdmin(id)
  if (!tx) return { title: 'Não encontrado — Admin' }
  return { title: `Admin: ${tx.product_name} — Segura Pay` }
}

const EVENT_LABEL: Record<string, string> = {
  created:           'Transação criada',
  paid:              'Pagamento confirmado',
  tracking_added:    'Rastreio adicionado',
  delivered:         'Recebimento confirmado',
  complaint_opened:  'Reclamação aberta',
  complaint_expired: 'Prazo de reclamação expirado',
  released:          'Pagamento liberado',
  disputed:          'Disputa aberta',
  resolved:          'Disputa resolvida',
}

export default async function AdminTransacaoPage({ params }: Props) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_token')?.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const { id } = await params
  const tx = await getTransactionAdmin(id)
  if (!tx) notFound()

  const valor = (tx.amount_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <main className="min-h-screen bg-[#F2F4F7] px-4 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[13px] text-[#8890A4] hover:text-[#4A5568] transition-colors">← Voltar</Link>
          <span className="text-[#E4E8F0]">|</span>
          <span className="text-[12px] font-mono text-[#8890A4]">{tx.id}</span>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <StatusTimeline status={tx.status as TransactionStatus} />
        </div>

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">Detalhes</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Detail label="produto" value={tx.product_name} />
            <Detail label="valor" value={valor} display />
            <Detail label="taxa" value={`R$ ${(tx.fee_cents / 100).toFixed(2)}`} />
            <Detail label="status" value={tx.status} />
            <Detail label="vendedor" value={tx.seller?.name ?? '—'} />
            <Detail label="tel. vendedor" value={tx.seller?.phone ?? '—'} />
            <Detail label="comprador" value={tx.buyer?.name ?? 'Aguardando'} />
            <Detail label="tel. comprador" value={tx.buyer?.phone ?? '—'} />
            {tx.tracking_code && <Detail label="rastreio" value={`${tx.carrier} · ${tx.tracking_code}`} />}
            {tx.dispute_reason && <Detail label="motivo disputa" value={tx.dispute_reason} full />}
            {tx.pix_copy_paste && <Detail label="chave pix usada" value={tx.pix_copy_paste} full />}
            <Detail label="criado em" value={new Date(tx.created_at).toLocaleString('pt-BR')} />
            {tx.paid_at && <Detail label="pago em" value={new Date(tx.paid_at).toLocaleString('pt-BR')} />}
            {tx.released_at && <Detail label="liberado em" value={new Date(tx.released_at).toLocaleString('pt-BR')} />}
          </dl>
        </div>

        {tx.status === 'disputed' && (
          <div className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F2F4F7] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <h2 className="text-[11px] font-medium text-[#EF4444] uppercase tracking-wide">Evidências da disputa</h2>
            </div>

            {/* Reclamação do comprador */}
            <div className="px-5 py-4 border-b border-[#F2F4F7]">
              <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-3">Comprador — {tx.buyer?.name ?? '—'}</p>
              {tx.dispute_reason && (
                <div className="p-3 rounded-[10px] bg-[#FEF2F2]/60 border border-[#FCA5A5]/30 mb-3">
                  <p className="text-[13px] text-[#7F1D1D] leading-relaxed">{tx.dispute_reason}</p>
                </div>
              )}
              {(tx.dispute_evidence_urls as string[] | null)?.length ? (
                <div className="flex flex-wrap gap-2">
                  {(tx.dispute_evidence_urls as string[]).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#E4E8F0] flex-shrink-0 hover:border-[#EF4444] transition-colors block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`evidência comprador ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                !tx.dispute_reason && <p className="text-[12px] text-[#8890A4]">Nenhuma evidência enviada.</p>
              )}
            </div>

            {/* Defesa do vendedor */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-3">Vendedor — {tx.seller?.name ?? '—'}</p>
              {tx.seller_dispute_note ? (
                <div className="p-3 rounded-[10px] bg-[#EEF2FF]/60 border border-[#C7D2FE]/40 mb-3">
                  <p className="text-[13px] text-[#1338CC] leading-relaxed">{tx.seller_dispute_note}</p>
                </div>
              ) : null}
              {(tx.seller_dispute_evidence_urls as string[] | null)?.length ? (
                <div className="flex flex-wrap gap-2">
                  {(tx.seller_dispute_evidence_urls as string[]).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#E4E8F0] flex-shrink-0 hover:border-[#1B4DFF] transition-colors block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`evidência vendedor ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                !tx.seller_dispute_note && <p className="text-[12px] text-[#8890A4]">Vendedor ainda não enviou defesa.</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
          <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">Ações</h2>
          <AdminAcoes transactionId={tx.id} status={tx.status as TransactionStatus} />
        </div>

        {tx.events.length > 0 && (
          <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5">
            <h2 className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">Histórico de eventos</h2>
            <div className="flex flex-col gap-3">
              {tx.events.map((ev: EscrowEvent) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4DFF]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] text-[#1A202C]">{EVENT_LABEL[ev.event_type] ?? ev.event_type}</p>
                      <p className="text-[12px] text-[#8890A4]">
                        {new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    {ev.actor_role && <p className="text-[12px] text-[#8890A4] mt-0.5">por {ev.actor_role}</p>}
                    {Object.keys(ev.metadata).length > 0 && (
                      <pre className="mt-1 text-[11px] bg-[#F2F4F7] rounded-[6px] px-2 py-1 text-[#4A5568] overflow-x-auto">
                        {JSON.stringify(ev.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function Detail({ label, value, display, full }: { label: string; value: string; display?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-[12px] text-[#8890A4]">{label}</dt>
      <dd className={`mt-0.5 break-words ${display ? 'text-[28px] font-medium text-[#1A202C]' : 'text-[14px] text-[#1A202C]'}`}>{value}</dd>
    </div>
  )
}
