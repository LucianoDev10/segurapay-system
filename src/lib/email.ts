import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Segura Pay <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://seguropay.com.br'

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[email] falha ao enviar para', to, err)
  }
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#1B4DFF;border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                <span style="font-size:22px;line-height:44px;">🔒</span>
              </td>
              <td style="padding-left:10px;font-size:18px;font-weight:600;color:#1A202C;">Segura Pay</td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E4E8F0;padding:32px 28px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:20px;font-size:11px;color:#8890A4;line-height:1.6;">
          Segura Pay · Escrow protegido para compra e venda via Pix<br/>
          Se você não reconhece esta mensagem, ignore este e-mail.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(href: string, label: string, color = '#1B4DFF') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;margin-top:20px;">${label}</a>`
}

function infoBox(text: string, color = '#EEF2FF', borderColor = '#1B4DFF', textColor = '#1338CC') {
  return `<div style="background:${color};border-left:3px solid ${borderColor};border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:${textColor};margin-top:16px;line-height:1.5;">${text}</div>`
}

// ─── Emails ──────────────────────────────────────────────────────────────────

export async function emailPagamentoConfirmado(opts: {
  vendedorEmail: string
  vendedorNome: string
  compradorEmail: string
  compradorNome: string
  produto: string
  valorCents: number
  transactionId: string
}) {
  const { vendedorEmail, vendedorNome, compradorEmail, compradorNome, produto, valorCents, transactionId } = opts
  const valor = formatCurrency(valorCents)
  const link = `${APP_URL}/transacao/${transactionId}`

  await send(
    vendedorEmail,
    `✅ Pagamento recebido — ${produto}`,
    base('Pagamento recebido', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Pagamento confirmado!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${vendedorNome}</strong>! O comprador <strong>${compradorNome}</strong> confirmou o pagamento de <strong>${valor}</strong> pelo produto <strong>"${produto}"</strong>.
      </p>
      <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">
        O dinheiro está <strong>protegido no escrow</strong> e será liberado após o comprador confirmar o recebimento.
      </p>
      ${infoBox('📦 Agora envie o produto e adicione o código de rastreio na plataforma.')}
      ${btn(link, 'Ver transação')}
    `),
  )

  await send(
    compradorEmail,
    `✅ Pagamento confirmado — ${produto}`,
    base('Pagamento confirmado', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Pagamento protegido!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${compradorNome}</strong>! Seu pagamento de <strong>${valor}</strong> pelo produto <strong>"${produto}"</strong> foi confirmado.
      </p>
      <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">
        O dinheiro está <strong>retido no escrow</strong> — só será liberado ao vendedor após você confirmar o recebimento.
      </p>
      ${infoBox('⏳ Aguardando o vendedor enviar o produto. Você será avisado quando o rastreio for adicionado.')}
      ${btn(link, 'Acompanhar pedido')}
    `),
  )
}

export async function emailRastreioAdicionado(opts: {
  compradorEmail: string
  compradorNome: string
  produto: string
  carrier: string
  trackingCode: string
  transactionId: string
}) {
  const { compradorEmail, compradorNome, produto, carrier, trackingCode, transactionId } = opts
  const link = `${APP_URL}/transacao/${transactionId}`

  await send(
    compradorEmail,
    `📦 Produto enviado — ${produto}`,
    base('Produto enviado', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Produto a caminho!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${compradorNome}</strong>! O vendedor enviou o produto <strong>"${produto}"</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;border-radius:10px;padding:14px 16px;margin-bottom:4px;">
        <tr>
          <td style="font-size:12px;color:#8890A4;">Transportadora</td>
          <td style="font-size:13px;font-weight:600;color:#1A202C;text-align:right;">${carrier}</td>
        </tr>
        <tr><td colspan="2" style="padding:4px 0;"></td></tr>
        <tr>
          <td style="font-size:12px;color:#8890A4;">Código de rastreio</td>
          <td style="font-size:13px;font-weight:600;color:#1A202C;text-align:right;font-family:monospace;">${trackingCode}</td>
        </tr>
      </table>
      ${infoBox('Quando receber o produto, confirme na plataforma. Você terá <strong>24 horas</strong> para avaliar antes do pagamento ser liberado ao vendedor.', '#ECFDF5', '#10B981', '#047857')}
      ${btn(link, 'Confirmar recebimento', '#10B981')}
    `),
  )
}

export async function emailEntregaConfirmada(opts: {
  vendedorEmail: string
  vendedorNome: string
  produto: string
  valorCents: number
  deadlineStr: string
  transactionId: string
}) {
  const { vendedorEmail, vendedorNome, produto, valorCents, deadlineStr, transactionId } = opts
  const valor = formatCurrency(valorCents)
  const link = `${APP_URL}/transacao/${transactionId}`

  await send(
    vendedorEmail,
    `✅ Entrega confirmada — ${produto}`,
    base('Entrega confirmada', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Comprador confirmou o recebimento!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${vendedorNome}</strong>! O comprador confirmou que recebeu o produto <strong>"${produto}"</strong>.
      </p>
      ${infoBox(`⏳ O comprador tem até <strong>${deadlineStr}</strong> para abrir uma disputa. Se não houver contestação, o pagamento de <strong>${valor}</strong> será liberado automaticamente.`)}
      ${btn(link, 'Ver transação')}
    `),
  )
}

export async function emailDisputaAberta(opts: {
  vendedorEmail: string
  vendedorNome: string
  produto: string
  valorCents: number
  motivo: string
  transactionId: string
}) {
  const { vendedorEmail, vendedorNome, produto, valorCents, motivo, transactionId } = opts
  const valor = formatCurrency(valorCents)
  const link = `${APP_URL}/transacao/${transactionId}`
  const adminEmail = process.env.ADMIN_EMAIL

  await send(
    vendedorEmail,
    `⚠️ Disputa aberta — ${produto}`,
    base('Disputa aberta', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">O comprador abriu uma disputa</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${vendedorNome}</strong>! O comprador contestou a entrega do produto <strong>"${produto}"</strong> (${valor}).
      </p>
      <div style="background:#FEF2F2;border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:#7F1D1D;margin-bottom:16px;line-height:1.5;">
        <strong>Motivo:</strong> ${motivo}
      </div>
      <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">
        Acesse a plataforma para enviar sua defesa (nota + evidências). Nossa equipe irá mediar.
      </p>
      ${btn(link, 'Enviar minha defesa', '#EF4444')}
    `),
  )

  if (adminEmail) {
    await send(
      adminEmail,
      `🚨 Nova disputa — ${produto} (${formatCurrency(valorCents)})`,
      base('Nova disputa', `
        <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Nova disputa aberta</h2>
        <p style="margin:0 0 4px;font-size:14px;color:#4A5568;"><strong>Produto:</strong> ${produto}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#4A5568;"><strong>Valor:</strong> ${valor}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#4A5568;"><strong>Vendedor:</strong> ${vendedorNome}</p>
        <p style="margin:0 0 16px;font-size:14px;color:#4A5568;"><strong>Motivo:</strong> ${motivo}</p>
        ${btn(`${APP_URL}/admin/transacao/${transactionId}`, 'Mediar disputa', '#EF4444')}
      `),
    )
  }
}

export async function emailPagamentoLiberado(opts: {
  vendedorEmail: string
  vendedorNome: string
  produto: string
  valorCents: number
  transactionId: string
}) {
  const { vendedorEmail, vendedorNome, produto, valorCents, transactionId } = opts
  const valor = formatCurrency(valorCents)
  const link = `${APP_URL}/transacao/${transactionId}`

  await send(
    vendedorEmail,
    `💰 Pagamento liberado — ${produto}`,
    base('Pagamento liberado', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Seu pagamento foi liberado!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${vendedorNome}</strong>! O pagamento de <strong>${valor}</strong> pelo produto <strong>"${produto}"</strong> foi liberado.
      </p>
      ${infoBox('✅ O valor será transferido para você em até <strong>1 dia útil</strong>.', '#ECFDF5', '#10B981', '#047857')}
      ${btn(link, 'Ver comprovante', '#10B981')}
    `),
  )
}

export async function emailDisputaResolvida(opts: {
  vendedorEmail: string
  vendedorNome: string
  compradorEmail: string
  compradorNome: string
  produto: string
  valorCents: number
  decision: 'release_to_seller' | 'refund_to_buyer'
  transactionId: string
}) {
  const { vendedorEmail, vendedorNome, compradorEmail, compradorNome, produto, valorCents, decision, transactionId } = opts
  const valor = formatCurrency(valorCents)
  const link = `${APP_URL}/transacao/${transactionId}`
  const isSeller = decision === 'release_to_seller'

  await send(
    vendedorEmail,
    `Disputa resolvida — ${produto}`,
    base('Disputa resolvida', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Disputa encerrada pelo Segura Pay</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${vendedorNome}</strong>! A disputa referente ao produto <strong>"${produto}"</strong> foi resolvida.
      </p>
      ${isSeller
        ? infoBox(`✅ Decisão <strong>favorável ao vendedor</strong>. O pagamento de <strong>${valor}</strong> foi liberado para você.`, '#ECFDF5', '#10B981', '#047857')
        : infoBox(`Decisão <strong>favorável ao comprador</strong>. O valor de <strong>${valor}</strong> será reembolsado ao comprador.`, '#FEF2F2', '#EF4444', '#7F1D1D')
      }
      ${btn(link, 'Ver detalhes')}
    `),
  )

  await send(
    compradorEmail,
    `Disputa resolvida — ${produto}`,
    base('Disputa resolvida', `
      <h2 style="margin:0 0 8px;font-size:20px;color:#1A202C;">Disputa encerrada pelo Segura Pay</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#4A5568;line-height:1.6;">
        Olá, <strong>${compradorNome}</strong>! A disputa referente ao produto <strong>"${produto}"</strong> foi resolvida.
      </p>
      ${isSeller
        ? infoBox(`Decisão <strong>favorável ao vendedor</strong>. O pagamento foi liberado ao vendedor.`, '#FFF8E6', '#D97706', '#92400E')
        : infoBox(`✅ Decisão <strong>favorável a você</strong>. O reembolso de <strong>${valor}</strong> será processado em breve.`, '#ECFDF5', '#10B981', '#047857')
      }
      ${btn(link, 'Ver detalhes')}
    `),
  )
}
