import { NextRequest, NextResponse } from 'next/server'
import { cancelExpiredTransactions } from '@/lib/transactions'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const cancelled = await cancelExpiredTransactions()
    return NextResponse.json({ ok: true, cancelled })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
