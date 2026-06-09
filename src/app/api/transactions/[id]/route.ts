import { NextRequest, NextResponse } from 'next/server'
import { getTransaction } from '@/lib/transactions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const transaction = await getTransaction(id)

  if (!transaction) {
    return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  }

  // Não expõe dados internos do vendedor além do nome
  const { seller, buyer, ...tx } = transaction
  return NextResponse.json({
    ...tx,
    seller_name: seller?.name ?? null,
    buyer_name: buyer?.name ?? null,
  })
}
