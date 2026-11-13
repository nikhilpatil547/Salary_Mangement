import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, serializeFilters, updateFilters, type EmployeeFilters } from './employeeFilters'

export function useEmployeeFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  // React Router's functional setSearchParams receives the params from the last render, not a queue of
  // pending updates. Two quick changes (pick a country, then a job title) would make the second one
  // overwrite the first. Tracking the latest value in a ref makes each change build on the previous one.
  const latest = useRef(filters)
  useLayoutEffect(() => {
    latest.current = filters
  }, [filters])

  const setFilters = useCallback(
    (next: EmployeeFilters | ((current: EmployeeFilters) => EmployeeFilters)) => {
      const resolved = typeof next === 'function' ? next(latest.current) : next
      latest.current = resolved
      setSearchParams(serializeFilters(resolved), { replace: true })
    },
    [setSearchParams],
  )

  const change = useCallback(
    (partial: Partial<EmployeeFilters>) => setFilters((current) => updateFilters(current, partial)),
    [setFilters],
  )

  return { filters, setFilters, change }
}
