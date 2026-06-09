import type { TransactionStatus } from '@/types/database'

const STEPS: { status: TransactionStatus[]; label: string; desc: string }[] = [
  { status: ['pending'],   label: 'Link gerado',    desc: 'Aguardando pagamento do comprador' },
  { status: ['paid'],      label: 'Pago',           desc: 'Pix confirmado — escrow ativo' },
  { status: ['tracked'],   label: 'Em transporte',  desc: 'Código de rastreio adicionado' },
  { status: ['delivered'], label: 'Entregue',       desc: 'Comprador confirmou o recebimento' },
  { status: ['released'],  label: 'Liberado',       desc: 'Pagamento liberado ao vendedor' },
]

const DISPUTE_STATUSES: TransactionStatus[] = ['disputed', 'resolved']
const STATUS_ORDER: TransactionStatus[] = ['pending', 'paid', 'tracked', 'delivered', 'released']

function stepIndex(status: TransactionStatus): number {
  return STATUS_ORDER.indexOf(status)
}

const CANCELLED_STATUS: TransactionStatus = 'cancelled'

interface StatusTimelineProps {
  status: TransactionStatus
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const isDisputed = DISPUTE_STATUSES.includes(status)
  const isCancelled = status === CANCELLED_STATUS
  const currentIdx = isCancelled ? 1 : isDisputed ? 3 : stepIndex(status)

  return (
    <div className="w-full">
      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx
          const active = idx === currentIdx
          const last = idx === STEPS.length - 1

          return (
            <div key={idx} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div className={`h-0.5 flex-1 ${done || active ? 'bg-[#1B4DFF]' : 'bg-[#E4E8F0]'}`} />
                )}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium border-2 transition-colors
                  ${done
                    ? 'bg-[#1B4DFF] border-[#1B4DFF] text-white'
                    : active
                    ? 'bg-white border-[#1B4DFF] text-[#1B4DFF]'
                    : 'bg-white border-[#E4E8F0] text-[#8890A4]'}`}
                >
                  {done ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : idx + 1}
                </div>
                {!last && (
                  <div className={`h-0.5 flex-1 ${done ? 'bg-[#1B4DFF]' : 'bg-[#E4E8F0]'}`} />
                )}
              </div>
              <div className="mt-2 px-1 text-center">
                <p className={`text-[11px] font-medium leading-tight ${active ? 'text-[#1338CC]' : done ? 'text-[#4A5568]' : 'text-[#8890A4]'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`mt-4 rounded-[10px] px-4 py-3 text-[13px] text-center font-medium
        ${isCancelled
          ? 'bg-[#F2F4F7] border border-[#8890A4]/30 text-[#4A5568]'
          : isDisputed
          ? 'bg-[#FEF2F2] border border-[#EF4444]/30 text-[#EF4444]'
          : status === 'released'
          ? 'bg-[#ECFDF5] border border-[#10B981]/30 text-[#047857]'
          : 'bg-[#EEF2FF] border border-[#C7D2FE] text-[#1338CC]'}`}
      >
        {isCancelled
          ? 'Transação cancelada — rastreio não adicionado no prazo'
          : isDisputed
          ? status === 'disputed'
            ? 'Disputa aberta — nossa equipe irá entrar em contato'
            : 'Disputa resolvida'
          : STEPS.find(s => s.status.includes(status))?.desc ?? 'Processando...'}
      </div>
    </div>
  )
}
