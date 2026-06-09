import { NextRequest, NextResponse } from 'next/server'
import { listTransactions, getStats } from '@/lib/admin'
import { cookies } from 'next/headers'
import type { TransactionStatus } from '@/types/database'

function isAdminAuthed(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false
  return cookieHeader === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!isAdminAuthed(token)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') as TransactionStatus | null
  const search = searchParams.get('search') ?? undefined

  const [transactions, stats] = await Promise.all([
    listTransactions({ status: status ?? undefined, search }),
    getStats(),
  ])

  return NextResponse.json({ transactions, stats })
}
