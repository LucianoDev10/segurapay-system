import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { PerfilForm } from '@/components/PerfilForm'

export const metadata = { title: 'Meu perfil — Segura Pay' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/perfil')

  const admin = createAdminClient()
  let { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const name = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuário'
    const { data: created } = await admin
      .from('users')
      .upsert({ id: user.id, email: user.email!, name, role: 'buyer' }, { onConflict: 'id' })
      .select('*')
      .single()
    profile = created
  }

  if (!profile) redirect('/login?error=profile')

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[#F2F4F7] px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-medium text-[#1A202C]">Meu perfil</h1>
            <p className="text-[13px] text-[#8890A4] mt-1">Gerencie suas informações pessoais</p>
          </div>
          <PerfilForm user={profile} email={user.email ?? ''} />
        </div>
      </main>
    </>
  )
}
