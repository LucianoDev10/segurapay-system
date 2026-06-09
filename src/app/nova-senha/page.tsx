'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordStrength, passwordIsStrong } from '@/components/PasswordStrength'

const inputClass = `
  w-full px-3.5 py-2.5 rounded-[10px]
  border border-[#E4E8F0] bg-white
  text-[14px] text-[#1A202C] placeholder:text-[#8890A4]
  outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20
  transition-all duration-150
`.trim()

const labelClass = 'block text-[13px] font-medium text-[#4A5568] mb-1'

export default function NovaSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  // Verifica se há sessão de recuperação ativa (vinda do link do e-mail)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)

    if (!passwordIsStrong(password)) {
      setErro('A senha não atende aos critérios mínimos de segurança.')
      return
    }
    if (password !== confirm) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setErro('Não foi possível redefinir a senha. O link pode ter expirado.')
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/nova-transacao'), 2500)
  }

  return (
    <main className="min-h-screen bg-[#F2F4F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-[#1B4DFF] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-[20px] font-medium text-[#1A202C]">Nova senha</h1>
          <p className="text-[13px] text-[#8890A4] mt-1">Segura Pay</p>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-6">

          {/* Sessão inválida */}
          {sessionReady === false && (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-11 h-11 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#1A202C]">Link inválido ou expirado</p>
                <p className="text-[13px] text-[#4A5568] mt-2">Solicite um novo link de recuperação na tela de login.</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] transition-colors"
              >
                Ir para o login
              </button>
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-[16px] font-medium text-[#1A202C]">Senha redefinida!</p>
                <p className="text-[13px] text-[#4A5568] mt-1">Redirecionando...</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          {sessionReady === true && !sucesso && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-[13px] text-[#4A5568]">Escolha uma nova senha para sua conta.</p>

              <div>
                <label className={labelClass}>nova senha</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputClass}
                />
                <PasswordStrength password={password} />
              </div>

              <div>
                <label className={labelClass}>confirmar nova senha</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="repita a senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={inputClass}
                />
                {confirm && confirm !== password && (
                  <p className="text-[11px] text-[#EF4444] mt-1">As senhas não coincidem</p>
                )}
              </div>

              {erro && (
                <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', color: '#EF4444' }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passwordIsStrong(password) || password !== confirm}
                className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 mt-1"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}

          {/* Loading da sessão */}
          {sessionReady === null && (
            <div className="py-8 text-center text-[13px] text-[#8890A4]">Verificando link...</div>
          )}

        </div>

        <p className="text-[11px] text-center text-[#8890A4] mt-5">
          Segura Pay · Escrow protegido · MVP v0.1
        </p>
      </div>
    </main>
  )
}
