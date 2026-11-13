import { describe, expect, it } from 'vitest'
import { formatCompactUsd, formatDate, formatMoney, formatPercent } from './format'

describe('formatMoney', () => {
  it('formats in the given currency without decimals', () => {
    expect(formatMoney('2849000.00', 'INR')).toBe('₹2,849,000')
    expect(formatMoney('70000.5', 'EUR')).toBe('€70,001')
  })

  it('shows a dash for missing values', () => {
    expect(formatMoney(null, 'USD')).toBe('—')
  })
})

describe('formatCompactUsd', () => {
  it('shortens large totals', () => {
    expect(formatCompactUsd('648304193.00')).toBe('$648.3M')
  })
})

describe('formatPercent', () => {
  it('signs positive changes', () => {
    expect(formatPercent(10)).toBe('+10.0%')
    expect(formatPercent(-40)).toBe('-40.0%')
  })
})

describe('formatDate', () => {
  it('does not shift the day because of the time zone', () => {
    expect(formatDate('2025-01-01')).toBe('1 Jan 2025')
  })
})
