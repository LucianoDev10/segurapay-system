import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_FILES = 5
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB por arquivo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData = await req.formData()
  const transactionId = formData.get('transactionId')
  if (!transactionId || typeof transactionId !== 'string') {
    return NextResponse.json({ error: 'transactionId obrigatório' }, { status: 400 })
  }

  const files = formData.getAll('files') as File[]
  if (!files.length) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Máximo ${MAX_FILES} imagens` }, { status: 400 })

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Tipo não permitido: ${file.type}` }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `Arquivo muito grande: ${file.name}` }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${transactionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await admin.storage
      .from('dispute-evidence')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) {
      return NextResponse.json({ error: `Erro ao fazer upload: ${error.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from('dispute-evidence')
      .getPublicUrl(path)

    urls.push(publicUrl)
  }

  return NextResponse.json({ urls })
}
