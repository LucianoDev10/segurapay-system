import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function AppHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initials = '?'
  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    const name = data?.name ?? user.email?.split('@')[0] ?? '?'
    initials = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
  }

  return (
    <header className="bg-white border-b border-[#E4E8F0] h-12 flex items-center px-4">
      <div className="max-w-lg mx-auto w-full flex items-center justify-between">
        <Link href="/nova-transacao" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#1B4DFF] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-[14px] font-medium text-[#1A202C]">Segura Pay</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/nova-transacao">Nova transação</NavLink>
          <NavLink href="/minhas-transacoes">Transações</NavLink>
        </nav>

        <Link href="/perfil" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[12px] font-medium text-[#1338CC] group-hover:bg-[#C7D2FE] transition-colors">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-[8px] text-[13px] text-[#4A5568] hover:bg-[#F2F4F7] hover:text-[#1A202C] transition-colors"
    >
      {children}
    </Link>
  )
}
