import type { EmploymentType } from '../api/types'

// Directory filters live in the URL, so a filtered view can be bookmarked, shared and survives a reload.
export type SortKey = 'name' | 'employee_code' | 'hire_date' | 'salary_usd' | 'country' | 'department' | 'job_title'
export type Direction = 'asc' | 'desc'

export interface EmployeeFilters {
  q: string
  countryIds: number[]
  departmentIds: number[]
  jobTitleIds: number[]
  employmentType: EmploymentType | null
  sort: SortKey
  direction: Direction
  page: number
}

const SORT_KEYS: SortKey[] = ['name', 'employee_code', 'hire_date', 'salary_usd', 'country', 'department', 'job_title']
const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contractor']

export const DEFAULT_FILTERS: EmployeeFilters = {
  q: '', countryIds: [], departmentIds: [], jobTitleIds: [], employmentType: null, sort: 'name', direction: 'asc', page: 1,
}

export const PER_PAGE = 25

function ids(value: string | null): number[] {
  if (!value) return []
  return value.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
}

export function parseFilters(search: URLSearchParams): EmployeeFilters {
  const sort = search.get('sort') as SortKey
  const type = search.get('type') as EmploymentType
  const page = Number(search.get('page'))
  return {
    q: search.get('q') ?? '',
    countryIds: ids(search.get('country')),
    departmentIds: ids(search.get('department')),
    jobTitleIds: ids(search.get('job_title')),
    employmentType: EMPLOYMENT_TYPES.includes(type) ? type : null,
    sort: SORT_KEYS.includes(sort) ? sort : DEFAULT_FILTERS.sort,
    direction: search.get('direction') === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function serializeFilters(filters: EmployeeFilters): URLSearchParams {
  const search = new URLSearchParams()
  if (filters.q) search.set('q', filters.q)
  if (filters.countryIds.length) search.set('country', filters.countryIds.join(','))
  if (filters.departmentIds.length) search.set('department', filters.departmentIds.join(','))
  if (filters.jobTitleIds.length) search.set('job_title', filters.jobTitleIds.join(','))
  if (filters.employmentType) search.set('type', filters.employmentType)
  if (filters.sort !== DEFAULT_FILTERS.sort) search.set('sort', filters.sort)
  if (filters.direction !== DEFAULT_FILTERS.direction) search.set('direction', filters.direction)
  if (filters.page > 1) search.set('page', String(filters.page))
  return search
}

// Changing what is shown starts again from page 1; only paging itself keeps the page number.
export function updateFilters(current: EmployeeFilters, change: Partial<EmployeeFilters>): EmployeeFilters {
  const resetsPage = Object.keys(change).some((key) => key !== 'page')
  return { ...current, ...change, page: resetsPage ? 1 : (change.page ?? current.page) }
}

// Clicking the sorted column flips its direction; clicking another column sorts it ascending.
export function toggleSort(current: EmployeeFilters, key: SortKey): EmployeeFilters {
  const direction: Direction = current.sort === key && current.direction === 'asc' ? 'desc' : 'asc'
  return updateFilters(current, { sort: key, direction })
}

export function toApiParams(filters: EmployeeFilters): Record<string, string | number | undefined> {
  return {
    q: filters.q || undefined,
    country_id: filters.countryIds.join(',') || undefined,
    department_id: filters.departmentIds.join(',') || undefined,
    job_title_id: filters.jobTitleIds.join(',') || undefined,
    employment_type: filters.employmentType ?? undefined,
    sort: filters.sort,
    direction: filters.direction,
    page: filters.page,
    per_page: PER_PAGE,
  }
}

export function hasActiveFilters(filters: EmployeeFilters): boolean {
  return Boolean(filters.q || filters.countryIds.length || filters.departmentIds.length ||
    filters.jobTitleIds.length || filters.employmentType)
}
