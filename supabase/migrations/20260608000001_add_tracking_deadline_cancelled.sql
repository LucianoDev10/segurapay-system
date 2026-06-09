-- Add tracking_deadline to transactions
alter table transactions add column if not exists tracking_deadline timestamptz;

-- Add 'cancelled' to transaction_status enum
alter type transaction_status add value if not exists 'cancelled';

-- Add 'tracking_expired' to escrow_event_type enum
alter type escrow_event_type add value if not exists 'tracking_expired';

comment on column transactions.tracking_deadline is 'Prazo para o vendedor inserir rastreio (paid_at + 96h). Se expirar, transação é cancelada.';
