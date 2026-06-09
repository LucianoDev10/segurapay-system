import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePay } from '@/lib/transactions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { buyer_name, buyer_email } = body as Record<string, unknown>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guest sem dados → rejeita
  if (!user && (!buyer_name || typeof buyer_name !== 'string')) {
    return NextResponse.json({ error: 'buyer_name é obrigatório' }, { status: 400 })
  }
  if (!user && (!buyer_email || typeof buyer_email !== 'string')) {
    return NextResponse.json({ error: 'buyer_email é obrigatório' }, { status: 400 })
  }

  try {
    const result = await initiatePay({
      transaction_id: id,
      buyer_name: typeof buyer_name === 'string' ? buyer_name.trim() : undefined,
      buyer_email: typeof buyer_email === 'string' ? buyer_email.trim() : undefined,
      authenticated_buyer_id: user?.id,
    })
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    const status = message === 'Transação não encontrada' ? 404
      : message === 'Transação não está disponível para pagamento' ? 409
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
