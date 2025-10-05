export function formatBRL(value: number | null | undefined): string {
  const n = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export function parseBRL(input: string): number {
  if (!input) return 0
  // Remove any non-digit except comma and dot
  const raw = input.replace(/[^0-9.,-]/g, '')
  // If there are commas, replace the last comma with dot and remove others
  const parts = raw.split(',')
  let normalized = raw
  if (parts.length > 1) {
    const last = parts.pop() as string
    normalized = parts.join('') + '.' + last
  }
  // Remove thousand separators (.) left from pt-BR typing
  normalized = normalized.replace(/\.(?=\d{3}(\D|$))/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

export function maskPhoneBR(input: string): string {
  const digits = (input || '').replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskTimeHHmm(input: string): string {
  const digits = (input || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function formatDateTimeBR(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatDateBR(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}
