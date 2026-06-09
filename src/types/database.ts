export type UserRole = 'buyer' | 'seller' | 'admin'

export type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'tracked'
  | 'delivered'
  | 'complaint_period'
  | 'disputed'
  | 'released'
  | 'resolved'
  | 'cancelled'

export type EscrowEventType =
  | 'created'
  | 'paid'
  | 'tracking_added'
  | 'delivered'
  | 'complaint_opened'
  | 'complaint_expired'
  | 'tracking_expired'
  | 'released'
  | 'disputed'
  | 'resolved'

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  seller_id: string
  buyer_id: string | null
  product_name: string
  product_description: string | null
  amount_cents: number
  fee_cents: number
  status: TransactionStatus
  payment_id: string | null
  pix_qr_code: string | null
  pix_copy_paste: string | null
  paid_at: string | null
  tracking_deadline: string | null
  carrier: string | null
  tracking_code: string | null
  tracked_at: string | null
  delivered_at: string | null
  complaint_deadline: string | null
  disputed_at: string | null
  dispute_reason: string | null
  resolved_at: string | null
  released_at: string | null
  created_at: string
  updated_at: string
}

export interface EscrowEvent {
  id: string
  transaction_id: string
  event_type: EscrowEventType
  actor_id: string | null
  actor_role: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Relações expandidas (para queries com joins)
export interface TransactionWithParties extends Transaction {
  seller: User
  buyer: User | null
  events?: EscrowEvent[]
}
