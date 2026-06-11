export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const n = parseInt(digits, 10)
  return (n / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseCurrencyCents(masked: string): number {
  const parsed = parseFloat(masked.replace(/\./g, '').replace(',', '.'))
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}
