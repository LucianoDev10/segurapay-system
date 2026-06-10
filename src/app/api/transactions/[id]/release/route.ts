import { NextRequest, NextResponse } from 'next/server'
import { releasePayment } from '@/lib/transactions'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('buyer_id')
    .eq('id', id)
    .single()

  if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  if (tx.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Apenas o comprador pode liberar o pagamento' }, { status: 403 })
  }

  try {
    const transaction = await releasePayment(id)
    return NextResponse.json({ transaction })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
