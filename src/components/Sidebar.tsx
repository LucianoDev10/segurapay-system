'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    label: 'Nova transação',
    href: '/nova-transacao',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Minhas transações',
    href: '/minhas-transacoes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Vault',
    href: '/vault',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <rect x="9" y="11" width="6" height="5" rx="1"/>
        <path d="M10 11V9a2 2 0 0 1 4 0v2"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [disputeCount, setDisputeCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      setUserEmail(user.email ?? null)
      const { data } = await supabase.from('users').select('name').eq('id', user.id).single()
      if (data?.name) setUserName(data.name)
      else setUserName(user.user_metadata?.name ?? user.email?.split('@')[0] ?? null)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'disputed')
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
      .then(({ count }) => setDisputeCount(count ?? 0))
  }, [userId])

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white border-r border-[#E4E8F0] flex flex-col z-40">
      <div className="px-5 py-5 border-b border-[#E4E8F0]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1B4DFF] rounded-[6px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-medium text-[#1A202C] text-[15px]">Segura Pay</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#1338CC]'
                  : 'text-[#4A5568] hover:bg-[#F2F4F7] hover:text-[#1A202C]'
              }`}
            >
              <span className={isActive ? 'text-[#1B4DFF]' : 'text-[#8890A4]'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}

        {/* Disputas — aparece sempre, badge vermelho se houver disputas ativas */}
        {(() => {
          const isActive = pathname === '/disputas'
          return (
            <Link
              href="/disputas"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#FEF2F2] text-[#EF4444]'
                  : 'text-[#4A5568] hover:bg-[#F2F4F7] hover:text-[#1A202C]'
              }`}
            >
              <span className={isActive ? 'text-[#EF4444]' : 'text-[#8890A4]'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <span className="flex-1">Disputas</span>
              {disputeCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-medium flex items-center justify-center">
                  {disputeCount}
                </span>
              )}
            </Link>
          )
        })()}
      </nav>

      <div className="px-3 py-4 border-t border-[#E4E8F0]">
        <Link
          href="/perfil"
          className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors ${
            pathname === '/perfil'
              ? 'bg-[#EEF2FF]'
              : 'hover:bg-[#F2F4F7]'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
            pathname === '/perfil' ? 'bg-[#1B4DFF] text-white' : 'bg-[#EEF2FF] text-[#1338CC]'
          }`}>
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className={`text-[13px] font-medium truncate ${pathname === '/perfil' ? 'text-[#1338CC]' : 'text-[#1A202C]'}`}>
              {userName ?? 'Meu perfil'}
            </p>
            <p className="text-[11px] text-[#8890A4] truncate">{userEmail ?? 'Configurações'}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
