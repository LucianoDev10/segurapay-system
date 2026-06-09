-- ============================================================
-- Segura Pay — Schema inicial
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('buyer', 'seller', 'admin');

create type transaction_status as enum (
  'pending',           -- link gerado, aguardando pagamento
  'paid',              -- Pix confirmado, escrow ativo
  'tracked',           -- vendedor adicionou código de rastreio
  'delivered',         -- comprador confirmou recebimento
  'complaint_period',  -- 24h para abrir disputa
  'disputed',          -- disputa aberta
  'released',          -- fundos liberados pro vendedor
  'resolved'           -- disputa encerrada (reembolso ou liberação manual)
);

create type escrow_event_type as enum (
  'created',
  'paid',
  'tracking_added',
  'delivered',
  'complaint_opened',
  'complaint_expired',
  'released',
  'disputed',
  'resolved'
);

-- ============================================================
-- TABELA: users
-- ============================================================

create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text not null,
  phone       text,                          -- WhatsApp (ex: +5511999999999)
  role        user_role not null default 'buyer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table users is 'Compradores, vendedores e administradores do Segura Pay';
comment on column users.phone is 'Número WhatsApp com DDI, ex: +5511999999999';

-- ============================================================
-- TABELA: transactions
-- ============================================================

create table transactions (
  id                  uuid primary key default gen_random_uuid(),

  -- Partes
  seller_id           uuid not null references users(id),
  buyer_id            uuid references users(id),          -- null até o comprador acessar o link

  -- Produto
  product_name        text not null,
  product_description text,
  amount_cents        integer not null check (amount_cents > 0),  -- valor em centavos (BRL)
  fee_cents           integer not null default 80,                -- R$ 0,80 Abacatepay + margem

  -- Status
  status              transaction_status not null default 'pending',

  -- Pagamento Pix (Abacatepay)
  payment_id          text,                              -- ID externo Abacatepay
  pix_qr_code         text,                              -- imagem base64 ou URL
  pix_copy_paste      text,                              -- código copia-e-cola
  paid_at             timestamptz,

  -- Rastreio
  carrier             text,
  tracking_code       text,
  tracked_at          timestamptz,

  -- Entrega
  delivered_at        timestamptz,

  -- Disputa
  complaint_deadline  timestamptz,                       -- delivered_at + 24h
  disputed_at         timestamptz,
  dispute_reason      text,
  resolved_at         timestamptz,

  -- Liberação
  released_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table transactions is 'Cada negociação escrow entre vendedor e comprador';
comment on column transactions.amount_cents is 'Valor do produto em centavos BRL';
comment on column transactions.fee_cents is 'Taxa Segura Pay em centavos (padrão: 80 = R$0,80)';
comment on column transactions.complaint_deadline is 'Prazo para o comprador abrir disputa (delivered_at + 24h)';

-- ============================================================
-- TABELA: escrow_events
-- ============================================================

create table escrow_events (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references transactions(id) on delete cascade,

  event_type      escrow_event_type not null,
  actor_id        uuid references users(id),   -- null = sistema
  actor_role      text,                         -- 'buyer' | 'seller' | 'admin' | 'system'

  metadata        jsonb default '{}',           -- dados extras (tracking code, nota de disputa, etc.)
  created_at      timestamptz not null default now()
);

comment on table escrow_events is 'Log imutável de todos os eventos de cada transação';
comment on column escrow_events.actor_id is 'Quem disparou o evento (null = ação automática do sistema)';
comment on column escrow_events.metadata is 'Dados extras: {tracking_code, reason, note, abacatepay_ref, ...}';

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_transactions_seller_id on transactions(seller_id);
create index idx_transactions_buyer_id  on transactions(buyer_id);
create index idx_transactions_status    on transactions(status);
create index idx_escrow_events_transaction_id on escrow_events(transaction_id);
create index idx_escrow_events_created_at     on escrow_events(created_at);

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger trg_transactions_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table users        enable row level security;
alter table transactions enable row level security;
alter table escrow_events enable row level security;

-- users: cada usuário lê e edita só o próprio registro; admin lê tudo
create policy "users: self read"
  on users for select
  using (auth.uid() = id);

create policy "users: self update"
  on users for update
  using (auth.uid() = id);

create policy "users: admin all"
  on users for all
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- transactions: vendedor e comprador da transação podem ler
create policy "transactions: parties read"
  on transactions for select
  using (
    auth.uid() = seller_id
    or auth.uid() = buyer_id
  );

-- transactions: apenas o vendedor cria
create policy "transactions: seller insert"
  on transactions for insert
  with check (auth.uid() = seller_id);

-- transactions: partes podem atualizar (estado é controlado pela API)
create policy "transactions: parties update"
  on transactions for update
  using (
    auth.uid() = seller_id
    or auth.uid() = buyer_id
  );

create policy "transactions: admin all"
  on transactions for all
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- escrow_events: partes da transação podem ler; inserção só via service role (API)
create policy "escrow_events: parties read"
  on escrow_events for select
  using (exists (
    select 1 from transactions t
    where t.id = escrow_events.transaction_id
      and (t.seller_id = auth.uid() or t.buyer_id = auth.uid())
  ));

create policy "escrow_events: admin all"
  on escrow_events for all
  using (exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'admin'
  ));
