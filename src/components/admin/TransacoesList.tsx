'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TransactionStatus } from '@/types/database'

interface TxRow {
  id: string
  product_name: string
  amount_cents: number
  status: TransactionStatus
  created_at: string
  seller: { name: string } | null
  buyer: { name: string } | null
}

interface Stats {
  counts: Record<TransactionStatus, number>
  totalEscrow: number
  total: number
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending:          'aguardando pagamento',
  paid:             'pago — em escrow',
  tracked:          'em transporte',
  delivered:        'entregue',
  complaint_period: 'período reclamação',
  disputed:         'em disputa',
  released:         'liberado',
  resolved:         'resolvido',
  cancelled:        'cancelada',
}

const STATUS_STYLE: Record<TransactionStatus, { bg: string; color: string }> = {
  pending:          { bg: '#FFF8E6', color: '#D97706' },
  paid:             { bg: '#EEF2FF', color: '#1338CC' },
  tracked:          { bg: '#EFF6FF', color: '#1D4ED8' },
  delivered:        { bg: '#ECFDF5', color: '#047857' },
  complaint_period: { bg: '#FFF8E6', color: '#D97706' },
  disputed:         { bg: '#FEF2F2', color: '#EF4444' },
  released:         { bg: '#1B4DFF', color: '#ffffff' },
  resolved:         { bg: '#F2F4F7', color: '#8890A4' },
  cancelled:        { bg: '#F2F4F7', color: '#4A5568' },
}

const FILTER_OPTIONS: { label: string; value: TransactionStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Pagas', value: 'paid' },
  { label: 'Em transporte', value: 'tracked' },
  { label: 'Entregues', value: 'delivered' },
  { label: 'Disputadas', value: 'disputed' },
  { label: 'Liberadas', value: 'released' },
]

export function TransacoesList() {
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/transactions?${params}`)
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.transactions)
      setStats(json.stats)
    }
    setLoading(false)
  }, [status, search])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchData, search])

  const totalEscrow = stats
    ? (stats.totalEscrow / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

  return (
    <div className="flex flex-col gap-6">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="total em escrow" value={totalEscrow} variant="primary" />
          <StatCard label="disputadas" value={String(stats.counts.disputed)} variant={stats.counts.disputed > 0 ? 'danger' : 'default'} />
          <StatCard label="aguardando pagto" value={String(stats.counts.pending)} variant="default" />
          <StatCard label="total transações" value={String(stats.total)} variant="default" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`rounded-[999px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                status === opt.value
                  ? 'bg-[#1B4DFF] text-white'
                  : 'bg-white border border-[#E4E8F0] text-[#4A5568] hover:bg-[#F2F4F7]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[13px] text-[#8890A4]">Carregando...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[#8890A4]">Nenhuma transação encontrada</div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[#E4E8F0]">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F2F4F7] border-b border-[#E4E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Produto</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Vendedor</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Comprador</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8F0] bg-white">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-[#F2F4F7] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A202C] max-w-[180px] truncate">{tx.product_name}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{tx.seller?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{tx.buyer?.name ?? <span className="text-[#8890A4]">Aguardando</span>}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A202C]">
                    {(tx.amount_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: STATUS_STYLE[tx.status].bg, color: STATUS_STYLE[tx.status].color }}
                    >
                      {STATUS_LABEL[tx.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8890A4] text-[12px] whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/transacao/${tx.id}`} className="text-[#1B4DFF] hover:text-[#1338CC] text-[12px] font-medium">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, variant }: { label: string; value: string; variant: 'primary' | 'danger' | 'default' }) {
  const styles = {
    primary: { bg: '#EEF2FF', border: '#C7D2FE', label: '#1338CC', value: '#1338CC' },
    danger:  { bg: '#FEF2F2', border: '#EF4444', label: '#EF4444', value: '#EF4444' },
    default: { bg: '#ffffff', border: '#E4E8F0', label: '#8890A4', value: '#1A202C' },
  }
  const s = styles[variant]
  return (
    <div className="rounded-[16px] border p-4" style={{ background: s.bg, borderColor: s.border }}>
      <p className="text-[12px] font-medium" style={{ color: s.label }}>{label}</p>
      <p className="text-[22px] font-medium mt-1" style={{ color: s.value }}>{value}</p>
    </div>
  )
}
