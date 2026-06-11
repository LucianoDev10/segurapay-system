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

export interface CardCheckout {
  id: string
  url: string
  status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
}

export async function createCardCheckout(params: {
  transactionId: string
  productName: string
  amountCents: number
  buyerName: string
  buyerEmail: string
  buyerCpf: string
  buyerPhone: string
  completionUrl: string
  returnUrl: string
}): Promise<CardCheckout> {
  // 1. Cria produto para esta transação
  const productRes = await fetch(`${BASE_URL}/products/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      externalId: params.transactionId,
      name: params.productName,
      price: params.amountCents,
      currency: 'BRL',
    }),
  })
  const productJson = await productRes.json() as { success: boolean; data: { id: string }; error: string | null }
  if (!productJson.success) throw new Error(productJson.error ?? 'Erro ao criar produto para checkout')
  const productId = productJson.data.id

  // 2. Cria checkout com cartão
  const checkoutRes = await fetch(`${BASE_URL}/checkouts/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      methods: 'CARD',
      externalId: params.transactionId,
      completionUrl: params.completionUrl,
      returnUrl: params.returnUrl,
      customer: {
        name: params.buyerName,
        email: params.buyerEmail,
        taxId: params.buyerCpf.replace(/\D/g, ''),
        cellphone: params.buyerPhone.replace(/\D/g, ''),
      },
      items: [{ id: productId, quantity: 1 }],
    }),
  })
  const checkoutJson = await checkoutRes.json() as { success: boolean; data: CardCheckout; error: string | null }
  if (!checkoutJson.success) throw new Error(checkoutJson.error ?? 'Erro ao criar checkout de cartão')
  return checkoutJson.data
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
