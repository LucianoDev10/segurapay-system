import { NextRequest, NextResponse } from 'next/server'
import { addTracking } from '@/lib/transactions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  const { carrier, tracking_code } = (body ?? {}) as Record<string, unknown>

  if (!carrier || typeof carrier !== 'string') {
    return NextResponse.json({ error: 'carrier é obrigatório' }, { status: 400 })
  }
  if (!tracking_code || typeof tracking_code !== 'string') {
    return NextResponse.json({ error: 'tracking_code é obrigatório' }, { status: 400 })
  }

  try {
    const transaction = await addTracking(id, carrier, tracking_code)
    return NextResponse.json({ transaction })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
