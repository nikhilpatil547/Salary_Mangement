import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, parseFilters, serializeFilters, toApiParams, toggleSort, updateFilters } from './employeeFilters'

describe('employee filters in the URL', () => {
  it('round-trips through the query string', () => {
    const filters = { ...DEFAULT_FILTERS, q: 'rao', countryIds: [1, 4], employmentType: 'part_time' as const, sort: 'salary_usd' as const, direction: 'desc' as const, page: 3 }

    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('keeps the URL empty for the default view', () => {
    expect(serializeFilters(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('ignores values it does not understand', () => {
    const parsed = parseFilters(new URLSearchParams('sort=drop&type=intern&page=-2&country=1,x,-3'))

    expect(parsed).toMatchObject({ sort: 'name', employmentType: null, page: 1, countryIds: [1] })
  })
})

describe('updateFilters', () => {
  it('goes back to page 1 when a filter changes', () => {
    const onPage4 = { ...DEFAULT_FILTERS, page: 4 }

    expect(updateFilters(onPage4, { q: 'lee' }).page).toBe(1)
    expect(updateFilters(onPage4, { page: 5 }).page).toBe(5)
  })
})

describe('toggleSort', () => {
  it('flips direction on the same column and resets on a new one', () => {
    const byName = toggleSort(DEFAULT_FILTERS, 'name')
    expect(byName).toMatchObject({ sort: 'name', direction: 'desc' })

    expect(toggleSort(byName, 'hire_date')).toMatchObject({ sort: 'hire_date', direction: 'asc' })
  })
})

describe('toApiParams', () => {
  it('sends ids as comma lists and leaves empty filters out', () => {
    const params = toApiParams({ ...DEFAULT_FILTERS, departmentIds: [2, 3] })

    expect(params).toMatchObject({ department_id: '2,3', country_id: undefined, per_page: 25 })
  })
})
