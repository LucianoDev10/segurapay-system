'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const NO_SIDEBAR_PREFIXES = ['/admin', '/pagar', '/transacao', '/login', '/nova-senha']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!showSidebar) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      <Sidebar />
      <main className="flex-1 ml-60">{children}</main>
    </div>
  )
}
