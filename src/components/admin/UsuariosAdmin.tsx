'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserRow {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'buyer' | 'seller' | 'admin'
  created_at: string
}

const ROLE_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Compradores', value: 'buyer' },
  { label: 'Vendedores', value: 'seller' },
  { label: 'Admin', value: 'admin' },
]

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  buyer:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'comprador' },
  seller: { bg: '#ECFDF5', color: '#047857', label: 'vendedor'  },
  admin:  { bg: '#EEF2FF', color: '#1338CC', label: 'admin'     },
}

function formatPhone(raw: string | null) {
  if (!raw) return '—'
  return raw.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

export function UsuariosAdmin() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [search, role])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchData, search])

  return (
    <div className="flex flex-col gap-5">

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="flex-1 rounded-[10px] border border-[#E4E8F0] bg-white px-3.5 py-2 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20 transition-all duration-150"
        />
        <div className="flex gap-1.5">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRole(opt.value)}
              className={`rounded-[999px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                role === opt.value
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
        <div className="text-center py-16 text-[13px] text-[#8890A4]">Carregando usuários...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[#8890A4]">Nenhum usuário encontrado.</div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[#E4E8F0]">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F2F4F7] border-b border-[#E4E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">E-mail</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">WhatsApp</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Papel</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8890A4] uppercase tracking-wide">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8F0] bg-white">
              {users.map(u => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.buyer
                return (
                  <tr key={u.id} className="hover:bg-[#F2F4F7] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#1338CC] flex items-center justify-center text-[12px] font-medium flex-shrink-0">
                          {u.name ? u.name[0].toUpperCase() : '?'}
                        </div>
                        <span className="font-medium text-[#1A202C]">{u.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4A5568]">{u.email}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{formatPhone(u.phone)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8890A4] text-[12px] whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-[#F2F4F7] border-t border-[#E4E8F0] text-[12px] text-[#8890A4]">
            {users.length} usuário{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
