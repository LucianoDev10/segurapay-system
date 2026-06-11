import { NextRequest, NextResponse } from 'next/server'
import { openDispute } from '@/lib/transactions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const reason = typeof body.reason === 'string' && body.reason.trim()
    ? body.reason.trim()
    : 'Sem descrição'
  const evidenceUrls = Array.isArray(body.evidence_urls)
    ? (body.evidence_urls as unknown[]).filter((u): u is string => typeof u === 'string')
    : []

  try {
    const transaction = await openDispute(id, reason, evidenceUrls)
    return NextResponse.json({ transaction })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    const status = message === 'Transação não encontrada' ? 404 : 422
    return NextResponse.json({ error: message }, { status })
  }
}
