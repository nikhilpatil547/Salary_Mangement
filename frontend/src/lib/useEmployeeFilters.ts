import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, serializeFilters, updateFilters, type EmployeeFilters } from './employeeFilters'

export function useEmployeeFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const setFilters = useCallback(
    (next: EmployeeFilters | ((current: EmployeeFilters) => EmployeeFilters)) =>
      setSearchParams((current) => {
        const resolved = typeof next === 'function' ? next(parseFilters(current)) : next
        return serializeFilters(resolved)
      }, { replace: true }),
    [setSearchParams],
  )

  const change = useCallback(
    (partial: Partial<EmployeeFilters>) => setFilters((current) => updateFilters(current, partial)),
    [setFilters],
  )

  return { filters, setFilters, change }
}
