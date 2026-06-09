import { NextRequest, NextResponse } from 'next/server'
import { adminResolve } from '@/lib/admin'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_token')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const note = typeof body.note === 'string' ? body.note : 'Resolvido pelo admin'

  try {
    const transaction = await adminResolve(id, note)
    return NextResponse.json({ transaction })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 422 })
  }
}
