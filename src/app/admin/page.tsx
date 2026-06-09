import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStats } from '@/lib/admin'
import { TransacoesList } from '@/components/admin/TransacoesList'
import { DisputasAdmin } from '@/components/admin/DisputasAdmin'
import { UsuariosAdmin } from '@/components/admin/UsuariosAdmin'

export const metadata = { title: 'Admin — Segura Pay' }

type Tab = 'transacoes' | 'disputas' | 'usuarios'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'transacoes',
    label: 'Transações',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    key: 'disputas',
    label: 'Disputas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'usuarios',
    label: 'Usuários',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

export default async function AdminPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_token')?.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const { tab } = await searchParams
  const activeTab: Tab =
    tab === 'disputas' ? 'disputas'
    : tab === 'usuarios' ? 'usuarios'
    : 'transacoes'

  const stats = await getStats()

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <main className="min-h-screen bg-[#F2F4F7]">

      {/* Header */}
      <header className="bg-white border-b border-[#E4E8F0] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1B4DFF] rounded-[6px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-medium text-[#1A202C] leading-none">Segura Pay</p>
              <p className="text-[11px] text-[#8890A4] mt-0.5">Painel Administrativo</p>
            </div>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="flex items-center gap-1.5 text-[13px] text-[#8890A4] hover:text-[#4A5568] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="em escrow agora"
              value={fmt(stats.totalEscrow)}
              sublabel={`${(stats.counts.paid ?? 0) + (stats.counts.tracked ?? 0) + (stats.counts.delivered ?? 0)} transações retidas`}
              variant="primary"
            />
            <StatCard
              label="disputas abertas"
              value={String(stats.counts.disputed ?? 0)}
              sublabel={stats.counts.disputed > 0 ? 'requerem atenção' : 'nenhuma pendente'}
              variant={stats.counts.disputed > 0 ? 'danger' : 'success'}
            />
            <StatCard
              label="aguardando pagto"
              value={String(stats.counts.pending ?? 0)}
              sublabel="links não pagos"
              variant="default"
            />
            <StatCard
              label="total transações"
              value={String(stats.total)}
              sublabel={`${stats.counts.released ?? 0} liberadas`}
              variant="default"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-0.5 bg-white rounded-[12px] border border-[#E4E8F0] p-1 w-fit">
            {TABS.map(t => {
              const isActive = activeTab === t.key
              const showBadge = t.key === 'disputas' && stats && stats.counts.disputed > 0
              return (
                <Link
                  key={t.key}
                  href={`/admin?tab=${t.key}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1B4DFF] text-white'
                      : 'text-[#4A5568] hover:bg-[#F2F4F7]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#8890A4]'}>{t.icon}</span>
                  {t.label}
                  {showBadge && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {stats.counts.disputed}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Conteúdo da aba */}
          {activeTab === 'transacoes' && <TransacoesList />}
          {activeTab === 'disputas'   && <DisputasAdmin />}
          {activeTab === 'usuarios'   && <UsuariosAdmin />}
        </div>

      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  variant,
}: {
  label: string
  value: string
  sublabel: string
  variant: 'primary' | 'danger' | 'success' | 'default'
}) {
  const styles = {
    primary: { bg: '#EEF2FF', border: '#C7D2FE', label: '#1338CC', value: '#1338CC', sub: '#4F72D9' },
    danger:  { bg: '#FEF2F2', border: '#FCA5A5', label: '#EF4444', value: '#EF4444', sub: '#DC2626' },
    success: { bg: '#ECFDF5', border: '#6EE7B7', label: '#047857', value: '#047857', sub: '#059669' },
    default: { bg: '#ffffff', border: '#E4E8F0', label: '#8890A4', value: '#1A202C', sub: '#8890A4'  },
  }
  const s = styles[variant]
  return (
    <div className="rounded-[16px] border p-4 flex flex-col gap-1" style={{ background: s.bg, borderColor: s.border }}>
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: s.label }}>{label}</p>
      <p className="text-[24px] font-medium leading-none" style={{ color: s.value }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: s.sub }}>{sublabel}</p>
    </div>
  )
}
