'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordStrength, passwordIsStrong } from '@/components/PasswordStrength'
import { maskPhone } from '@/lib/masks'

type Tab = 'login' | 'cadastro' | 'recuperar'

const inputClass = `
  w-full px-3.5 py-2.5 rounded-[10px]
  border border-[#E4E8F0] bg-white
  text-[14px] text-[#1A202C] placeholder:text-[#8890A4]
  outline-none focus:border-[#1B4DFF] focus:ring-1 focus:ring-[#1B4DFF]/20
  transition-all duration-150
`.trim()

const labelClass = 'block text-[13px] font-medium text-[#4A5568] mb-1'

function Alert({ type, message }: { type: 'error' | 'info' | 'success'; message: string }) {
  const styles = {
    error:   { bg: '#FEF2F2', border: '#EF4444', color: '#EF4444' },
    info:    { bg: '#EEF2FF', border: '#1B4DFF', color: '#1338CC' },
    success: { bg: '#ECFDF5', border: '#10B981', color: '#047857' },
  }
  const s = styles[type]
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-[10px] text-[13px]"
      style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, color: s.color }}>
      {message}
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/nova-transacao'

  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [recuperarEmail, setRecuperarEmail] = useState('')
  const [recuperarEnviado, setRecuperarEnviado] = useState(false)

  function switchTab(t: Tab) {
    setTab(t)
    setErro(null)
    setInfo(null)
    setPassword('')
    setConfirmPassword('')
    setPhone('')
    setEmailExists(false)
    setRecuperarEmail('')
    setRecuperarEnviado(false)
  }

  async function handleRecuperar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(recuperarEmail.trim(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/nova-senha`,
    })
    setLoading(false)
    // Sempre mostra sucesso — evita enumerar se o e-mail existe
    setRecuperarEnviado(true)
  }

  async function checkEmailExists(email: string) {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return
    setCheckingEmail(true)
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`)
      const { exists } = await res.json()
      setEmailExists(exists)
    } catch {
      // silently ignore — submit will catch it
    } finally {
      setCheckingEmail(false)
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setInfo(null)
    setLoading(true)

    const data = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.get('email') as string,
      password: data.get('password') as string,
    })

    setLoading(false)

    if (error) {
      setErro(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : 'Erro ao fazer login. Tente novamente.')
      return
    }

    // Hard navigation garante request HTTP fresco com o cookie de sessão já no header
    window.location.href = next
  }

  async function handleCadastro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setInfo(null)

    if (emailExists) {
      setErro('Este e-mail já possui uma conta. Faça login.')
      return
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErro('Informe um número de WhatsApp válido.')
      return
    }

    if (!passwordIsStrong(password)) {
      setErro('A senha não atende aos critérios mínimos de segurança.')
      return
    }

    if (password !== confirmPassword) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const data = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.get('email') as string,
      password,
      options: {
        data: {
          name: data.get('name') as string,
          phone: phone.trim() || null,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${next}`,
      },
    })

    setLoading(false)

    if (error) {
      setErro(error.message === 'User already registered'
        ? 'Este e-mail já possui uma conta. Faça login.'
        : 'Erro ao criar conta. Tente novamente.')
      return
    }

    setPassword('')
    setConfirmPassword('')
    setPhone('')
    switchTab('login')
    setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.')
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
          <h1 className="text-[20px] font-medium text-[#1A202C]">Segura Pay</h1>
          <p className="text-[13px] text-[#8890A4] mt-1">Compra e venda protegida via Pix</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-[#E4E8F0]">
            {([
              { key: 'login',     label: 'Entrar'         },
              { key: 'cadastro',  label: 'Criar conta'    },
              { key: 'recuperar', label: 'Esqueci a senha' },
            ] as { key: Tab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                  tab === t.key
                    ? 'text-[#1B4DFF] border-b-2 border-[#1B4DFF] -mb-px'
                    : 'text-[#8890A4] hover:text-[#4A5568]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 flex flex-col gap-4">
            {info && <Alert type="info" message={info} />}

            {tab === 'recuperar' ? (
              recuperarEnviado ? (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-[#1A202C]">E-mail enviado</p>
                    <p className="text-[13px] text-[#4A5568] mt-2 leading-relaxed">
                      Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve. Verifique também a caixa de spam.
                    </p>
                  </div>
                  <button
                    onClick={() => switchTab('login')}
                    className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] transition-colors mt-1"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecuperar} className="flex flex-col gap-4">
                  <p className="text-[13px] text-[#4A5568]">
                    Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                  </p>
                  <div>
                    <label className={labelClass}>e-mail</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={recuperarEmail}
                      onChange={e => setRecuperarEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {erro && <Alert type="error" message={erro} />}
                  <button
                    type="submit"
                    disabled={loading || !recuperarEmail.trim()}
                    className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 mt-1"
                  >
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="text-[13px] text-[#8890A4] hover:text-[#4A5568] transition-colors text-center"
                  >
                    Voltar ao login
                  </button>
                </form>
              )
            ) : tab === 'login' ? (

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>e-mail</label>
                  <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>senha</label>
                  <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => switchTab('recuperar')}
                      className="text-[12px] text-[#1B4DFF] hover:text-[#1338CC] transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </div>

                {erro && <Alert type="error" message={erro} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 mt-1"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>nome completo</label>
                  <input name="name" type="text" required autoComplete="name" placeholder="Seu nome" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    WhatsApp <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="flex rounded-[10px] border border-[#E4E8F0] overflow-hidden bg-white focus-within:border-[#1B4DFF] focus-within:ring-1 focus-within:ring-[#1B4DFF]/20 transition-all duration-150">
                    <span className="px-3.5 py-2.5 bg-[#F2F4F7] border-r border-[#E4E8F0] text-[13px] text-[#8890A4] select-none">
                      +55
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel-national"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={e => setPhone(maskPhone(e.target.value))}
                      className="flex-1 px-3.5 py-2.5 text-[14px] text-[#1A202C] placeholder:text-[#8890A4] bg-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>e-mail</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    onChange={() => setEmailExists(false)}
                    onBlur={e => checkEmailExists(e.target.value)}
                    className={`${inputClass} ${emailExists ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20' : ''}`}
                  />
                  {checkingEmail && (
                    <p className="text-[11px] text-[#8890A4] mt-1">Verificando e-mail...</p>
                  )}
                  {!checkingEmail && emailExists && (
                    <p className="text-[11px] text-[#EF4444] mt-1">
                      Este e-mail já possui uma conta.{' '}
                      <button type="button" onClick={() => switchTab('login')} className="underline font-medium">
                        Fazer login
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>senha</label>
                  <input
                    name="password"
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
                  <label className={labelClass}>confirmar senha</label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-[#EF4444] mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {erro && <Alert type="error" message={erro} />}

                <button
                  type="submit"
                  disabled={loading || !passwordIsStrong(password) || emailExists || checkingEmail || phone.replace(/\D/g, '').length < 10}
                  className="w-full bg-[#1B4DFF] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#1338CC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 mt-1"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-[11px] text-center text-[#8890A4] mt-5">
          Segura Pay · Escrow protegido · MVP v0.1
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
