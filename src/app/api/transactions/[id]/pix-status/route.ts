import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: tx } = await admin
    .from('transactions')
    .select('status, paid_at, carrier, tracking_code')
    .eq('id', id)
    .single()

  if (!tx) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  return NextResponse.json({
    status: tx.status,
    paid_at: tx.paid_at,
    carrier: tx.carrier,
    tracking_code: tx.tracking_code,
  })
}
