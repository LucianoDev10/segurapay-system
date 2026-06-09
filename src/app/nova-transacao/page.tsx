import { NovaTransacaoForm } from '@/components/NovaTransacaoForm'
import { AppHeader } from '@/components/AppHeader'

export const metadata = { title: 'Nova transação — Segura Pay' }

export default function NovaTransacaoPage() {
  return (
    <>
      <AppHeader />
    <main className="min-h-screen bg-[#F2F4F7] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-[20px] font-medium text-[#1A202C]">Nova transação</h1>
          <p className="text-[13px] text-[#8890A4] mt-1">Compre ou venda com segurança via Pix</p>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-6">
          <NovaTransacaoForm />
        </div>

        <p className="text-[11px] text-center text-[#8890A4] mt-5">
          Taxa: R$ 0,80 por transação · Pix instantâneo · Escrow protegido
        </p>
      </div>
    </main>
    </>
  )
}
