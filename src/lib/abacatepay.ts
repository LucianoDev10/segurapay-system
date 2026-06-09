const BASE_URL = 'https://api.abacatepay.com/v2'

function authHeaders() {
  const key = process.env.ABACATEPAY_SECRET_KEY
  if (!key) throw new Error('ABACATEPAY_SECRET_KEY não configurada')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

export interface PixCharge {
  id: string
  brCode: string
  brCodeBase64: string
  amount: number
  status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
  expiresAt: string
  platformFee: number
  devMode: boolean
}

export interface PixStatus {
  status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
  expiresAt: string
}

export async function createPixCharge(params: {
  amount: number
  description?: string
  expiresIn?: number
}): Promise<PixCharge> {
  const res = await fetch(`${BASE_URL}/transparents/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      method: 'PIX',
      data: {
        amount: params.amount,
        description: params.description,
        expiresIn: params.expiresIn ?? 3600,
      },
    }),
  })

  const json = (await res.json()) as { success: boolean; data: PixCharge; error: string | null }
  if (!json.success) {
    const msg = json.error ?? ''
    if (msg.includes('object')) throw new Error('Valor inválido para cobrança Pix (mínimo R$ 1,00)')
    throw new Error(msg || 'Erro ao criar cobrança Pix')
  }
  return json.data
}

export async function getPixStatus(id: string): Promise<PixStatus> {
  const res = await fetch(`${BASE_URL}/transparents/check?id=${id}`, {
    headers: authHeaders(),
    next: { revalidate: 0 },
  })

  const json = (await res.json()) as { success: boolean; data: PixStatus; error: string | null }
  if (!json.success) throw new Error(json.error ?? 'Erro ao verificar status Pix')
  return json.data
}

// Apenas para ambiente de desenvolvimento — simula pagamento de um QR code
export async function simulatePixPayment(id: string): Promise<PixCharge> {
  const res = await fetch(`${BASE_URL}/transparents/simulate-payment?id=${id}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({}),
  })

  const json = (await res.json()) as { success: boolean; data: PixCharge; error: string | null }
  if (!json.success) throw new Error(json.error ?? 'Erro ao simular pagamento')
  return json.data
}
