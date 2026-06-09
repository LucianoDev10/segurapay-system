'use client'

import { useState } from 'react'
import type { User } from '@/types/database'

interface PerfilFormProps {
  user: User
  email: string
}

const ROLE_LABEL: Record<string, string> = {
  buyer:  'comprador',
  seller: 'vendedor',
  admin:  'administrador',
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  buyer:  { bg: '#ECFDF5', color: '#047857' },
  seller: { bg: '#EEF2FF', color: '#1338CC' },
  admin:  { bg: '#FFF8E6', color: '#D97706' },
}

const inputClass = `
  w-full px-3.5 py-2.5 rounded-[10px]
  border border-[#E4E8F0] bg-white
  text-[14px] text-[#1A202C] placeholder:text-[#8890A4]
  outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20
  transition-all duration-150
`.trim()

const inputReadonlyClass = `
  w-full px-3.5 py-2.5 rounded-[10px]
  border border-[#E4E8F0] bg-[#F2F4F7]
  text-[14px] text-[#8890A4]
  outline-none cursor-not-allowed
`.trim()

export function PerfilForm({ user, email }: PerfilFormProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.buyer

  async function handleSave() {
    setLoading(true)
    setFeedback(null)

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json()
      setFeedback({ type: 'error', msg: json.error ?? 'Erro ao salvar' })
      return
    }

    setFeedback({ type: 'success', msg: 'Perfil atualizado com sucesso.' })
    setEditing(false)
  }

  function handleCancel() {
    setName(user.name)
    setPhone(user.phone ?? '')
    setEditing(false)
    setFeedback(null)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Avatar + identidade */}
      <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-medium flex-shrink-0"
          style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
        >
          {initials}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[15px] font-medium text-[#1A202C] truncate">{name}</p>
          <p className="text-[13px] text-[#8890A4] truncate">{email}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={roleStyle}
            >
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
            {email && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#047857]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                e-mail verificado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]"
          style={
            feedback.type === 'success'
              ? { background: '#ECFDF5', borderLeft: '3px solid #10B981', color: '#047857' }
              : { background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }
          }
        >
          {feedback.msg}
        </div>
      )}

      {/* Dados */}
      <div className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E8F0] flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#4A5568]">informações pessoais</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[13px] text-[#1B4DFF] hover:text-[#1338CC] font-medium transition-colors"
            >
              editar
            </button>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="block text-[13px] font-medium text-[#4A5568] mb-1">nome completo</label>
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                placeholder="Seu nome"
              />
            ) : (
              <p className="text-[14px] text-[#1A202C] px-3.5 py-2.5 rounded-[10px] border border-[#E4E8F0] bg-white">{name}</p>
            )}
          </div>

          {/* E-mail (read-only) */}
          <div>
            <label className="block text-[13px] font-medium text-[#4A5568] mb-1">e-mail</label>
            <input value={email} readOnly className={inputReadonlyClass} />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-[13px] font-medium text-[#4A5568] mb-1">whatsapp</label>
            {editing ? (
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+55 11 99999-9999"
                type="tel"
              />
            ) : (
              <p className={`text-[14px] px-3.5 py-2.5 rounded-[10px] border border-[#E4E8F0] bg-white ${phone ? 'text-[#1A202C]' : 'text-[#8890A4]'}`}>
                {phone || 'não informado'}
              </p>
            )}
          </div>

          {/* Membro desde */}
          <div>
            <label className="block text-[13px] font-medium text-[#4A5568] mb-1">membro desde</label>
            <input
              value={new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              readOnly
              className={inputReadonlyClass}
            />
          </div>

          {/* Botões de edição */}
          {editing && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCancel}
                className="flex-1 bg-transparent text-[#4A5568] border border-[#E4E8F0] px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#F2F4F7] transition-all duration-150"
              >
                cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !name.trim()}
                className="flex-1 bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
              >
                {loading ? 'salvando...' : 'salvar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="w-full bg-transparent text-[#EF4444] border border-[#E4E8F0] px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#FEF2F2] hover:border-[#EF4444]/30 transition-all duration-150"
        >
          sair da conta
        </button>
      </form>
    </div>
  )
}
