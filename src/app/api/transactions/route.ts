import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createTransaction } from '@/lib/transactions'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('transactions')
    .select('*, seller:users!transactions_seller_id_fkey(id,name,phone), buyer:users!transactions_buyer_id_fkey(id,name,phone)')
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { product_name, product_description, amount_cents, seller_name, seller_phone } =
    body as Record<string, unknown>

  if (!product_name || typeof product_name !== 'string') {
    return NextResponse.json({ error: 'product_name é obrigatório' }, { status: 400 })
  }
  if (!amount_cents || typeof amount_cents !== 'number' || amount_cents <= 0) {
    return NextResponse.json({ error: 'amount_cents é obrigatório e deve ser maior que zero' }, { status: 400 })
  }

  // Detecta usuário autenticado — nome e telefone vêm do perfil, não do body
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usuário não autenticado ainda exige seller_name no body (fluxo guest legado)
  if (!user && (!seller_name || typeof seller_name !== 'string')) {
    return NextResponse.json({ error: 'seller_name é obrigatório' }, { status: 400 })
  }

  try {
    const result = await createTransaction({
      product_name,
      product_description: typeof product_description === 'string' ? product_description : undefined,
      amount_cents,
      seller_name: typeof seller_name === 'string' ? seller_name : '',
      seller_phone: typeof seller_phone === 'string' ? seller_phone : undefined,
      authenticated_seller_id: user?.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
