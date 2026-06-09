import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTransaction } from '@/lib/transactions'
import { createAdminClient } from '@/lib/supabase/server'
import { PagamentoView } from '@/components/PagamentoView'
import { CompraView } from '@/components/CompraView'
import Sidebar from '@/components/Sidebar'
import type { TransactionStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const tx = await getTransaction(id)
  if (!tx) return { title: 'Transação não encontrada — Segura Pay' }
  return { title: `${tx.product_name} — Segura Pay` }
}

export default async function PagarPage({ params }: Props) {
  const { id } = await params
  const tx = await getTransaction(id)
  if (!tx) notFound()

  const sellerName = tx.seller?.name ?? 'Vendedor'
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  // Busca dados do comprador logado (se houver)
  let buyerName: string | null = null
  let buyerEmail: string | null = null
  if (userId) {
    const admin = createAdminClient()
    const { data } = await admin.from('users').select('name, email').eq('id', userId).single()
    buyerName = data?.name ?? null
    buyerEmail = data?.email ?? null
  }

  // Guard: vendedor não pode pagar a própria transação
  if (userId && userId === tx.seller_id) {
    return (
      <main className="min-h-screen bg-[#F2F4F7] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-[16px] border border-[#E4E8F0] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF8E6] flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="text-[15px] font-medium text-[#1A202C]">Você criou esta transação</p>
          <p className="text-[13px] text-[#8890A4] mt-2">Não é possível pagar uma transação que você mesmo gerou.</p>
        </div>
      </main>
    )
  }

  const payContent = tx.status === 'pending' && !tx.pix_copy_paste
    ? (
      <PagamentoView
        transactionId={tx.id}
        productName={tx.product_name}
        productDescription={tx.product_description}
        amountCents={tx.amount_cents}
        sellerName={sellerName}
        buyerName={buyerName}
        buyerEmail={buyerEmail}
      />
    )
    : (
      <CompraView
        transactionId={tx.id}
        productName={tx.product_name}
        productDescription={tx.product_description}
        amountCents={tx.amount_cents}
        sellerName={sellerName}
        initialStatus={tx.status as TransactionStatus}
        pixCopyPaste={tx.pix_copy_paste}
        pixQrCode={tx.pix_qr_code}
        carrier={tx.carrier}
        trackingCode={tx.tracking_code}
      />
    )

  // ── Comprador logado: layout completo com sidebar ─────────────────────────
  if (userId) {
    return (
      <div className="flex min-h-screen bg-[#F2F4F7]">
        <Sidebar />
        <main className="flex-1 ml-60 px-4 py-8 pb-16">
          <div className="max-w-lg mx-auto flex flex-col gap-4">
            <Link
              href="/minhas-transacoes"
              className="flex items-center gap-1.5 text-[13px] text-[#4A5568] hover:text-[#1A202C] transition-colors w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Minhas transações
            </Link>
            <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-6">
              {payContent}
            </div>
            <p className="text-[11px] text-center text-[#8890A4]">
              Segura Pay · Escrow protegido · Pix instantâneo
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ── Comprador sem conta: layout mínimo ────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F2F4F7] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-6 h-6 bg-[#1B4DFF] rounded-[6px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#1A202C]">Segura Pay</span>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-6">
          {payContent}
        </div>
        <p className="text-[11px] text-center text-[#8890A4] mt-4">
          Segura Pay · Escrow protegido · Pix instantâneo
        </p>
      </div>
    </main>
  )
}
