import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePay, initiateCardPay } from '@/lib/transactions'

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

  const { buyer_name, buyer_email, buyer_cpf, buyer_phone, method } = body as Record<string, unknown>
  const paymentMethod = method === 'card' ? 'card' : 'pix'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guest sem dados → rejeita
  if (!user && (!buyer_name || typeof buyer_name !== 'string')) {
    return NextResponse.json({ error: 'buyer_name é obrigatório' }, { status: 400 })
  }
  if (!user && (!buyer_email || typeof buyer_email !== 'string')) {
    return NextResponse.json({ error: 'buyer_email é obrigatório' }, { status: 400 })
  }

  // Cartão exige CPF e telefone
  if (paymentMethod === 'card') {
    if (!buyer_cpf || typeof buyer_cpf !== 'string' || buyer_cpf.replace(/\D/g, '').length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }
    if (!buyer_phone || typeof buyer_phone !== 'string' || buyer_phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }
  }

  try {
    if (paymentMethod === 'card') {
      const result = await initiateCardPay({
        transaction_id: id,
        buyer_name: typeof buyer_name === 'string' ? buyer_name.trim() : undefined,
        buyer_email: typeof buyer_email === 'string' ? buyer_email.trim() : undefined,
        buyer_cpf: (buyer_cpf as string).trim(),
        buyer_phone: (buyer_phone as string).trim(),
        authenticated_buyer_id: user?.id,
      })
      return NextResponse.json(result, { status: 200 })
    }

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
