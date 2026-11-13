import type { EmploymentType, RevisionReason } from '../api/types'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: string | number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(Number(amount))
}

// Large org totals read better as "$648.3M" than as a 12-digit number.
export function formatCompactUsd(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(Number(amount))
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  // Build the date from its parts so the time zone can never shift it by a day.
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
}

export const REASON_LABELS: Record<RevisionReason, string> = {
  hire: 'Starting salary',
  annual_review: 'Annual review',
  promotion: 'Promotion',
  market_adjustment: 'Market adjustment',
  correction: 'Correction',
}

export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
