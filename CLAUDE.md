# Segura Pay

Produto de escrow C2C via Pix + WhatsApp para compra e venda de eletrônicos usados no Brasil.
Único produto que combina WhatsApp + Pix + escrow independente de plataforma no Brasil.

## O que é
- Vendedor gera um link de pagamento pelo WhatsApp
- Comprador paga via Pix — dinheiro vai para o Segura Pay, não pro vendedor
- Vendedor entrega o produto
- Comprador confirma recebimento pelo WhatsApp
- Só então o dinheiro é liberado pro vendedor

## Problema que resolve
R$ 3,5 bilhões perdidos em fraudes C2C no Brasil em 2024 (OLX).
Script do golpista: contato na plataforma → migra pro WhatsApp → pede Pix → some.
Soluções atuais falham: OLX Garantia só funciona dentro do app, Mercado Pago é reembolso pós-fato.

---

## Benchmark — Trustap (principal referência global)

Trustap é o player mais similar globalmente. Escrow C2C em 100+ países, US$9M captado.
Não opera no Brasil, não usa Pix, não integra com WhatsApp.

### Fluxo completo do sistema Trustap (referência para o Segura Pay)

#### ① Cadastro — Guest User
- Vendedor e comprador são criados como "guest users" (email + nome + country_code)
- Registro completo (KYC) é adiado para o momento do saque — reduz fricção inicial
- API: POST /api/v1/guest_users

#### ② Criação da transação
- Vendedor cria a transação: produto, valor, foto, seller_id + buyer_id
- Sistema calcula a taxa (charge) antes de criar
- Transação criada com status: `joined`
- Comprador recebe link: /transactions/{id}/guest_pay
- API: POST /api/v1/me/transactions/create_with_guest_user

#### ③ Pagamento
- Comprador acessa link e paga (cartão / método local — no Segura Pay: Pix)
- Fundos retidos no escrow — não vão pro vendedor
- Status muda para: `paid`
- Vendedor é notificado

#### ④ Envio / Entrega
- Vendedor adiciona código de rastreio (carrier + tracking_code)
- Comprador acompanha status de entrega na tela
- Status muda para: `tracked`
- API: POST /api/v1/transactions/{id}/track_with_guest_seller

#### ⑤ Confirmação de entrega
- Comprador confirma que recebeu o produto
- Inicia o período de reclamação (24h)
- Status muda para: `delivered`
- API: POST /api/v1/transactions/{id}/confirm_delivery_with_guest_buyer

#### ⑥ Período de disputa (24h — complaints period)
- Comprador tem 24h para abrir reclamação
- Se abrir: payout pausado, suporte Trustap medeia
- Se não abrir: fluxo segue normalmente para liberação
- Status: `complaint_period`
- API: POST /api/v1/transactions/{id}/complain_with_guest_buyer

#### ⑦a Caminho sem disputa — KYC + claim
- Vendedor precisa virar "full user" com KYC (identidade + dados bancários) via OAuth
- Vendedor reivindica a transação (claim) — vincula à conta dele
- Status muda para: `claimed`
- API: POST /api/v1/transactions/{id}/claim_for_seller

#### ⑦b Caminho com disputa — mediação
- Suporte Trustap investiga com evidências de ambas as partes
- Comprador deve reportar problema imediatamente ao receber (antes de aceitar o item)
- Após aceitar o item, pode precisar devolver por conta própria antes do reembolso
- Se não seguir o processo no prazo: reclamação expira e fundos vão pro vendedor automaticamente
- IMPORTANTE: reembolso total só acontece se o comprador pagou "Buyer Protection fee" separada
- Sem essa taxa, disputas pós-entrega são resolvidas entre as partes — Trustap não intervém

#### ⑧ Liberação dos fundos
- Após complaint period sem disputa (ou resolução da disputa)
- Fundos liberados automaticamente para conta do vendedor
- Status final: `released`

### Gap do Trustap — onde o Segura Pay vence
- Não opera no Brasil
- Não usa Pix (usa cartão + Stripe)
- Não integra com WhatsApp
- Exige OAuth + KYC técnico do vendedor — barreira alta pro C2C informal
- Cobra taxa extra de "Buyer Protection" — no Segura Pay o escrow já É a proteção

### Diferencial de produto Segura Pay vs Trustap
- Link simples no WhatsApp (zero fricção pro vendedor)
- Pix como trilho de pagamento (instantâneo, sem cartão)
- Escrow já inclui proteção — sem taxa extra de "buyer protection"
- Política de disputa mais clara e simples

---

## Estados do escrow (Segura Pay)

pending → paid → tracked → delivered → [complaint_period] → released
                                                ↓
                                           disputed → resolved

## Telas do sistema (mapa completo)

| Tela | Quem usa | Equivalente Trustap |
|---|---|---|
| Geração de link | Vendedor | POST /transactions |
| Página de pagamento | Comprador | /guest_pay |
| Status da transação | Ambos | Dashboard da transação |
| Confirmação de entrega | Comprador | confirm_delivery |
| Abertura de disputa | Comprador | complaint |
| Painel admin | Operador Segura Pay | Mediação manual |

---

## Stack

- Frontend: Next.js 14+ (App Router), Tailwind CSS, TypeScript
- Auth + Banco: Supabase (Postgres com row-level security)
- API: Next.js API Routes
- Pagamento MVP: Abacatepay (Pix, R$ 0,80/transação)
- Hospedagem: Vercel

## Estrutura de dados principal

- users (compradores e vendedores, com role: buyer | seller | admin)
- transactions (cada negociação: valor, produto, partes, status)
- escrow_events (log de eventos: criado, pago, entregue, liberado, disputado)

## Regras de código

- Sempre TypeScript, nunca JavaScript puro
- App Router do Next.js (jamais Pages Router)
- Nunca commitar .env ou secrets
- Componentes em /components
- Lógica de negócio em /lib
- Rotas de API em /app/api
- Tipos compartilhados em /types

## Fase atual

MVP de validação — operação manual como intermediário.
Sem integração com Celcoin ainda. Foco em fluxo funcional end-to-end.
CNPJ + Abacatepay + planilha de controle por enquanto.
