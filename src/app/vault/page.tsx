import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import type { TransactionStatus } from '@/types/database'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Vault — Segura Pay' }

// ── Types ─────────────────────────────────────────────────────────────────────

type TxRow = {
  id: string
  seller_id: string
  buyer_id: string | null
  product_name: string
  amount_cents: number
  fee_cents: number
  status: TransactionStatus
  paid_at: string | null
  tracked_at: string | null
  delivered_at: string | null
  released_at: string | null
  created_at: string
  seller: { name: string; email: string } | null
  buyer: { name: string; email: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} · ${hh}h${mi}`
}

const ACTIVE_STATUSES: TransactionStatus[] = ['paid', 'tracked', 'delivered', 'complaint_period', 'disputed']
const COMPLETED_STATUSES: TransactionStatus[] = ['released', 'resolved']

const STATUS_RANK: Record<string, number> = {
  pending: 0, paid: 1, tracked: 2, delivered: 3,
  complaint_period: 3, disputed: 3, released: 4, resolved: 4, cancelled: 0,
}

// ── Hero config ────────────────────────────────────────────────────────────────

interface HeroCfg { bg: string; accent: string; textPrimary: string; textMuted: string; label: string; subtitle: string }

function heroConfig(status: TransactionStatus, role: 'buyer' | 'seller'): HeroCfg {
  const map: Record<string, { buyer: HeroCfg; seller: HeroCfg }> = {
    pending: {
      buyer:  { bg: '#FFF8E6', accent: '#D97706', textPrimary: '#92400E', textMuted: '#B45309', label: 'aguardando pagamento', subtitle: 'realize o Pix para iniciar o escrow' },
      seller: { bg: '#FFF8E6', accent: '#D97706', textPrimary: '#92400E', textMuted: '#B45309', label: 'aguardando pagamento do comprador', subtitle: 'compartilhe o link de pagamento' },
    },
    paid: {
      buyer:  { bg: '#EEF2FF', accent: '#1338CC', textPrimary: '#1338CC', textMuted: '#3B5BF5', label: 'retido com segurança', subtitle: 'seu dinheiro não foi para o vendedor' },
      seller: { bg: '#ECFDF5', accent: '#047857', textPrimary: '#047857', textMuted: '#059669', label: 'pagamento recebido', subtitle: 'envie o produto com rastreio em até 96h' },
    },
    tracked: {
      buyer:  { bg: '#EEF2FF', accent: '#1338CC', textPrimary: '#1338CC', textMuted: '#3B5BF5', label: 'produto a caminho', subtitle: 'aguardando entrega para liberar o escrow' },
      seller: { bg: '#ECFDF5', accent: '#047857', textPrimary: '#047857', textMuted: '#059669', label: 'produto enviado', subtitle: 'aguardando confirmação do comprador' },
    },
    delivered: {
      buyer:  { bg: '#FFF8E6', accent: '#D97706', textPrimary: '#92400E', textMuted: '#B45309', label: 'entregue — confirme o recebimento', subtitle: 'você tem 24h para abrir disputa' },
      seller: { bg: '#ECFDF5', accent: '#047857', textPrimary: '#047857', textMuted: '#059669', label: 'produto entregue', subtitle: 'aguardando confirmação do comprador' },
    },
    complaint_period: {
      buyer:  { bg: '#FFF8E6', accent: '#D97706', textPrimary: '#92400E', textMuted: '#B45309', label: 'período de análise (24h)', subtitle: 'abra disputa se houver qualquer problema' },
      seller: { bg: '#FFF8E6', accent: '#D97706', textPrimary: '#92400E', textMuted: '#B45309', label: 'período de análise (24h)', subtitle: 'aguardando confirmação final do comprador' },
    },
    disputed: {
      buyer:  { bg: '#FEF2F2', accent: '#EF4444', textPrimary: '#DC2626', textMuted: '#EF4444', label: 'disputa em análise', subtitle: 'nossa equipe irá entrar em contato' },
      seller: { bg: '#FEF2F2', accent: '#EF4444', textPrimary: '#DC2626', textMuted: '#EF4444', label: 'disputa em análise', subtitle: 'nossa equipe irá entrar em contato' },
    },
    released: {
      buyer:  { bg: '#ECFDF5', accent: '#047857', textPrimary: '#047857', textMuted: '#059669', label: 'valor liberado ao vendedor', subtitle: 'transação concluída com sucesso' },
      seller: { bg: '#ECFDF5', accent: '#047857', textPrimary: '#047857', textMuted: '#059669', label: 'pix enviado com sucesso', subtitle: 'verifique sua conta em até 1 dia útil' },
    },
    cancelled: {
      buyer:  { bg: '#F2F4F7', accent: '#4A5568', textPrimary: '#4A5568', textMuted: '#8890A4', label: 'transação cancelada', subtitle: 'reembolso será processado' },
      seller: { bg: '#F2F4F7', accent: '#4A5568', textPrimary: '#4A5568', textMuted: '#8890A4', label: 'transação cancelada', subtitle: 'rastreio não adicionado no prazo' },
    },
  }
  return map[status]?.[role] ?? { bg: '#EEF2FF', accent: '#1338CC', textPrimary: '#1338CC', textMuted: '#3B5BF5', label: status, subtitle: '' }
}

// ── Info box ───────────────────────────────────────────────────────────────────

function infoBox(status: TransactionStatus, role: 'buyer' | 'seller'): { bg: string; border: string; color: string; text: string } {
  const palettes = {
    blue:  { bg: '#EEF2FF', border: '#1B4DFF', color: '#1338CC' },
    amber: { bg: '#FFF8E6', border: '#D97706', color: '#92400E' },
    green: { bg: '#ECFDF5', border: '#10B981', color: '#047857' },
    red:   { bg: '#FEF2F2', border: '#EF4444', color: '#DC2626' },
  }
  const map: Record<string, { buyer: string; seller: string; type: keyof typeof palettes }> = {
    pending:          { buyer: 'Realize o pagamento via Pix. Seu dinheiro ficará retido no Segura Pay até você confirmar o recebimento.', seller: 'Compartilhe o link de pagamento com o comprador para iniciar o escrow.', type: 'blue' },
    paid:             { buyer: 'O dinheiro está retido no Segura Pay. Aguarde o vendedor enviar o produto com código de rastreio.', seller: 'Você tem 96h para adicionar o código de rastreio. Após esse prazo, a transação é cancelada automaticamente.', type: 'blue' },
    tracked:          { buyer: 'Produto a caminho. Ao receber, acesse a transação para confirmar o recebimento ou abrir disputa.', seller: 'Produto enviado. O pagamento será liberado após o comprador confirmar o recebimento.', type: 'blue' },
    delivered:        { buyer: 'Produto entregue. Confirme o recebimento ou abra disputa em até 24h se houver qualquer problema.', seller: 'O comprador recebeu o produto. O pagamento será liberado após a confirmação ou expiração do prazo.', type: 'amber' },
    complaint_period: { buyer: 'Período de análise ativo. Você pode abrir uma disputa se houver qualquer problema com o produto recebido.', seller: 'Aguardando confirmação final. Após 24h sem disputa, o pagamento é liberado automaticamente para você.', type: 'amber' },
    disputed:         { buyer: 'Disputa aberta. Nosso time de mediação irá analisar as evidências e entrar em contato em breve.', seller: 'O comprador abriu uma disputa. Nosso time irá entrar em contato para mediar e resolver a situação.', type: 'red' },
    released:         { buyer: 'Pagamento liberado ao vendedor. Transação concluída com sucesso. Obrigado por usar o Segura Pay.', seller: 'O Pix foi enviado para sua conta cadastrada. Verifique em até 1 dia útil. Obrigado por usar o Segura Pay.', type: 'green' },
    cancelled:        { buyer: 'Transação cancelada. O vendedor não adicionou o rastreio no prazo. Reembolso processado em até 1 dia útil.', seller: 'Transação cancelada por falta de rastreio no prazo. O comprador será reembolsado integralmente.', type: 'red' },
  }
  const cfg = map[status] ?? { buyer: '', seller: '', type: 'blue' as keyof typeof palettes }
  return { ...palettes[cfg.type], text: cfg[role] }
}

// ── Progress bar ───────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { label: 'Pago', rank: 1 },
  { label: 'Enviado', rank: 2 },
  { label: 'Entregue', rank: 3 },
  { label: 'Liberado', rank: 4 },
]

function ProgressBar({ rank, disputed }: { rank: number; disputed: boolean }) {
  return (
    <div className="flex items-start">
      {PROGRESS_STEPS.map((step, i) => {
        const done = rank >= step.rank
        const isCurrent = rank === step.rank || (i === 0 && rank === 1)
        const dotColor = disputed && step.rank === 3 ? '#EF4444' : done ? '#1B4DFF' : undefined
        return (
          <div key={step.rank} className="flex-1 flex flex-col items-center">
            <div className="w-full flex items-center">
              {i > 0 && (
                <div
                  className="flex-1 h-0.5"
                  style={{ background: rank >= step.rank ? (disputed && step.rank === 3 ? '#EF4444' : '#1B4DFF') : '#E4E8F0' }}
                />
              )}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: done ? (dotColor ?? '#1B4DFF') : '#E4E8F0',
                  outline: isCurrent && !done ? '3px solid #C7D2FE' : undefined,
                }}
              />
              {i < PROGRESS_STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5"
                  style={{ background: rank > step.rank ? '#1B4DFF' : '#E4E8F0' }}
                />
              )}
            </div>
            <span
              className="text-[10px] mt-1.5 text-center leading-tight"
              style={{ color: done ? (disputed && step.rank === 3 ? '#EF4444' : '#1338CC') : '#8890A4', fontWeight: done ? 500 : 400 }}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Timeline ───────────────────────────────────────────────────────────────────

function Timeline({ tx, role }: { tx: TxRow; role: 'buyer' | 'seller' }) {
  const buyerLabels = ['Pagamento confirmado', 'Produto enviado', 'Entrega confirmada', 'Pix liberado ao vendedor']
  const sellerLabels = ['Comprador pagou', 'Rastreio adicionado', 'Comprador confirmou', 'Pix enviado para você']
  const labels = role === 'buyer' ? buyerLabels : sellerLabels
  const dates = [tx.paid_at, tx.tracked_at, tx.delivered_at, tx.released_at]
  const isDisputed = tx.status === 'disputed'

  const steps = labels.map((label, i) => {
    const date = dates[i]
    const prevDone = i === 0 || !!dates[i - 1]
    const state: 'done' | 'current' | 'pending' = date ? 'done' : prevDone ? 'current' : 'pending'
    return { label, date, state }
  })

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const dotColor =
          step.state === 'done' ? '#1B4DFF' :
          step.state === 'current' && isDisputed && i === 2 ? '#EF4444' :
          step.state === 'current' ? '#D97706' :
          '#E4E8F0'

        return (
          <div key={i} className="flex items-start gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: dotColor }}
              >
                {step.state === 'done' && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {step.state === 'current' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 mt-0.5 mb-0.5" style={{ minHeight: 20, background: step.state === 'done' ? '#C7D2FE' : '#E4E8F0' }} />
              )}
            </div>

            {/* Label + date */}
            <div className={`flex justify-between w-full min-w-0 ${isLast ? '' : 'pb-4'}`}>
              <span
                className="text-[13px] leading-tight"
                style={{
                  color: step.state === 'done' ? '#1A202C' : step.state === 'current' ? (isDisputed && i === 2 ? '#DC2626' : '#92400E') : '#8890A4',
                  fontWeight: step.state !== 'pending' ? 500 : 400,
                }}
              >
                {step.label}
                {step.state === 'current' && isDisputed && i === 2 && (
                  <span className="ml-2 text-[11px] font-medium text-[#EF4444] bg-[#FEF2F2] px-1.5 py-0.5 rounded-full">disputa</span>
                )}
              </span>
              <span className="text-[11px] text-[#8890A4] flex-shrink-0 ml-3 mt-0.5">
                {fmtDate(step.date)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Financial table ────────────────────────────────────────────────────────────

function FinancialTable({ tx, role }: { tx: TxRow; role: 'buyer' | 'seller' }) {
  const isReleased = tx.status === 'released' || tx.status === 'resolved'
  const netCents = tx.amount_cents - tx.fee_cents

  if (role === 'buyer') {
    return (
      <div className="flex flex-col gap-0 rounded-[10px] border border-[#E4E8F0] overflow-hidden">
        <div className="flex justify-between px-4 py-2.5 bg-[#F2F4F7]">
          <span className="text-[12px] text-[#4A5568]">Valor do produto</span>
          <span className="text-[12px] font-medium text-[#1A202C]">{fmt(tx.amount_cents)}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 border-t border-[#E4E8F0]">
          <span className="text-[12px] text-[#4A5568]">Taxa Segura Pay</span>
          <span className="text-[12px] text-[#8890A4]">{fmt(tx.fee_cents)}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 border-t border-[#E4E8F0] bg-[#F2F4F7]">
          <span className="text-[12px] font-medium text-[#1A202C]">Total pago</span>
          <span className="text-[12px] font-medium text-[#1A202C]">{fmt(tx.amount_cents + tx.fee_cents)}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 border-t border-[#E4E8F0]">
          <span className="text-[12px] text-[#4A5568]">Liberado ao vendedor</span>
          <span className="text-[12px] font-medium" style={{ color: isReleased ? '#047857' : '#8890A4' }}>
            {isReleased ? fmt(netCents) : 'R$ 0,00'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 rounded-[10px] border border-[#E4E8F0] overflow-hidden">
      <div className="flex justify-between px-4 py-2.5 bg-[#F2F4F7]">
        <span className="text-[12px] text-[#4A5568]">Valor do produto</span>
        <span className="text-[12px] font-medium text-[#1A202C]">{fmt(tx.amount_cents)}</span>
      </div>
      <div className="flex justify-between px-4 py-2.5 border-t border-[#E4E8F0]">
        <span className="text-[12px] text-[#4A5568]">Taxa Segura Pay</span>
        <span className="text-[12px] text-[#8890A4]">− {fmt(tx.fee_cents)}</span>
      </div>
      <div className="flex justify-between px-4 py-2.5 border-t border-[#E4E8F0] bg-[#F2F4F7]">
        <span className="text-[12px] font-medium text-[#1A202C]">Você recebe</span>
        <span className="text-[12px] font-medium" style={{ color: isReleased ? '#047857' : '#1A202C' }}>{fmt(netCents)}</span>
      </div>
    </div>
  )
}

// ── VaultCard ──────────────────────────────────────────────────────────────────

function VaultCard({ tx, userId }: { tx: TxRow; userId: string }) {
  const role: 'buyer' | 'seller' = tx.seller_id === userId ? 'seller' : 'buyer'
  const hero = heroConfig(tx.status, role)
  const info = infoBox(tx.status, role)
  const rank = STATUS_RANK[tx.status] ?? 0
  const isDisputed = tx.status === 'disputed'
  const counterpart = role === 'seller' ? tx.buyer : tx.seller
  const counterpartLabel = role === 'seller' ? 'Comprador' : 'Vendedor'

  return (
    <div className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">

      {/* ── Hero ── */}
      <div className="px-5 py-5" style={{ background: hero.bg }}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center" style={{ background: hero.accent + '22' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hero.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <rect x="9" y="11" width="6" height="5" rx="1"/>
              <path d="M10 11V9a2 2 0 0 1 4 0v2"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: hero.textMuted }}>{hero.label}</p>
            <p className="text-[28px] font-medium leading-tight mt-0.5" style={{ color: hero.textPrimary }}>{fmt(tx.amount_cents)}</p>
            <p className="text-[13px] mt-0.5 truncate" style={{ color: hero.textMuted }}>{tx.product_name}</p>
          </div>
          <Link
            href={`/transacao/${tx.id}`}
            className="text-[12px] font-medium flex-shrink-0 mt-1 px-2.5 py-1 rounded-[6px] transition-colors"
            style={{ color: hero.accent, background: hero.accent + '15' }}
          >
            Transação →
          </Link>
        </div>

        {/* Counterpart */}
        {counterpart && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${hero.accent}22` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0" style={{ background: hero.accent }}>
              {counterpart.name[0]?.toUpperCase()}
            </div>
            <span className="text-[12px]" style={{ color: hero.textMuted }}>
              {counterpartLabel}: <span style={{ fontWeight: 500 }}>{counterpart.name}</span>
            </span>
            <span className="ml-auto text-[11px]" style={{ color: hero.textMuted }}>
              #{tx.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="px-5 pt-4 pb-3 border-b border-[#F2F4F7]">
        <ProgressBar rank={rank} disputed={isDisputed} />
      </div>

      {/* ── Info box ── */}
      <div className="px-5 py-4 border-b border-[#F2F4F7]">
        <div
          className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]"
          style={{ background: info.bg, borderLeft: `3px solid ${info.border}`, color: info.color }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {info.text}
        </div>
      </div>

      {/* ── Financial ── */}
      <div className="px-5 py-4 border-b border-[#F2F4F7]">
        <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-3">financeiro</p>
        <FinancialTable tx={tx} role={role} />
      </div>

      {/* ── Timeline ── */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-4">histórico</p>
        <Timeline tx={tx} role={role} />
      </div>
    </div>
  )
}

// ── Compact card ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Partial<Record<TransactionStatus, { bg: string; color: string; label: string }>> = {
  paid:             { bg: '#EEF2FF', color: '#1338CC', label: 'Em escrow' },
  tracked:          { bg: '#EFF6FF', color: '#1D4ED8', label: 'A caminho' },
  delivered:        { bg: '#FFF8E6', color: '#D97706', label: 'Entregue' },
  complaint_period: { bg: '#FFF8E6', color: '#D97706', label: 'Análise' },
  disputed:         { bg: '#FEF2F2', color: '#EF4444', label: 'Disputa' },
  released:         { bg: '#ECFDF5', color: '#047857', label: 'Liberado' },
  resolved:         { bg: '#ECFDF5', color: '#047857', label: 'Resolvido' },
}

function CompactCard({ tx, userId }: { tx: TxRow; userId: string }) {
  const role: 'buyer' | 'seller' = tx.seller_id === userId ? 'seller' : 'buyer'
  const badge = STATUS_BADGE[tx.status] ?? { bg: '#F2F4F7', color: '#4A5568', label: tx.status }
  const counterpart = role === 'seller' ? tx.buyer : tx.seller
  const counterpartLabel = role === 'seller' ? 'Comprador' : 'Vendedor'

  return (
    <Link
      href={`/transacao/${tx.id}`}
      className="flex items-center gap-3 bg-white rounded-[12px] border border-[#E4E8F0] px-4 py-3 hover:border-[#C7D2FE] transition-colors"
    >
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: badge.bg }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#1A202C] truncate">{tx.product_name}</p>
        <p className="text-[11px] text-[#8890A4]">
          {counterpartLabel}: {counterpart?.name ?? '—'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[13px] font-medium text-[#1A202C]">{fmt(tx.amount_cents)}</span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>
    </Link>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <div className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden animate-pulse">
      <div className="h-28 bg-[#EEF2FF]" />
      <div className="px-5 py-4 border-b border-[#F2F4F7]">
        <div className="h-2 bg-[#E4E8F0] rounded-full" />
        <div className="flex justify-between mt-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-3 w-10 bg-[#E4E8F0] rounded" />)}
        </div>
      </div>
      <div className="px-5 py-4 border-b border-[#F2F4F7]">
        <div className="h-10 bg-[#F2F4F7] rounded-[10px]" />
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-32 bg-[#E4E8F0] rounded" />
              <div className="h-3 w-16 bg-[#E4E8F0] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/vault')

  const admin = createAdminClient()
  const { data: transactions } = await admin
    .from('transactions')
    .select('id,seller_id,buyer_id,product_name,amount_cents,fee_cents,status,paid_at,tracked_at,delivered_at,released_at,created_at,seller:users!transactions_seller_id_fkey(name,email),buyer:users!transactions_buyer_id_fkey(name,email)')
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const all = (transactions ?? []) as unknown as TxRow[]
  const active = all.filter(tx => ACTIVE_STATUSES.includes(tx.status))
  const completed = all.filter(tx => COMPLETED_STATUSES.includes(tx.status))
  const featured = active[0] ?? null
  const others = active.slice(1)

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[#F2F4F7] px-4 pt-8 pb-16">
        <div className="max-w-lg mx-auto flex flex-col gap-5">

          {/* Header */}
          <div>
            <h1 className="text-[20px] font-medium text-[#1A202C]">Vault</h1>
            <p className="text-[13px] text-[#8890A4] mt-1">Escrow ativo — seu dinheiro protegido</p>
          </div>

          {featured ? (
            <>
              <VaultCard tx={featured} userId={user.id} />

              {others.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-3">
                    outros escrows ativos ({others.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {others.map(tx => (
                      <CompactCard key={tx.id} tx={tx} userId={user.id} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1338CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <rect x="9" y="11" width="6" height="5" rx="1"/>
                  <path d="M10 11V9a2 2 0 0 1 4 0v2"/>
                </svg>
              </div>
              <p className="text-[15px] font-medium text-[#1A202C]">Nenhum escrow ativo</p>
              <p className="text-[13px] text-[#8890A4] mt-2 max-w-xs mx-auto">
                Quando você pagar ou receber por uma transação, o escrow aparecerá aqui.
              </p>
              <div className="flex flex-col gap-2 mt-6">
                <Link
                  href="/nova-transacao"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4DFF] text-white text-[13px] font-medium rounded-[10px] hover:bg-[#1338CC] transition-colors"
                >
                  Criar nova transação
                </Link>
                <Link
                  href="/minhas-transacoes"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[#4A5568] text-[13px] font-medium rounded-[10px] hover:bg-[#F2F4F7] transition-colors"
                >
                  Ver histórico
                </Link>
              </div>
            </div>
          )}

          {/* Concluídas */}
          {completed.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-[#8890A4] uppercase tracking-wide mb-3">
                concluídas ({completed.length})
              </p>
              <div className="flex flex-col gap-2">
                {completed.map(tx => (
                  <CompactCard key={tx.id} tx={tx} userId={user.id} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
