import { NextRequest, NextResponse } from 'next/server'
import { confirmDelivery } from '@/lib/transactions'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const transaction = await confirmDelivery(id)
    return NextResponse.json({ transaction })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    const status = message === 'Transação não encontrada' ? 404 : 422
    return NextResponse.json({ error: message }, { status })
  }
}
