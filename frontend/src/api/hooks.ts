import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type {
  CountryInsight, DepartmentInsight, Employee, EmployeeInput, JobTitleInsight, OutlierReport, Page,
  ReferenceData, SalaryRevision, SalaryRevisionInput, StatsScope, Summary,
} from './types'
import { toApiParams, type EmployeeFilters } from '../lib/employeeFilters'

export const queryKeys = {
  reference: ['reference'] as const,
  employees: ['employees'] as const,
  employee: (id: number) => ['employees', id] as const,
  revisions: (id: number) => ['employees', id, 'revisions'] as const,
  insights: ['insights'] as const,
}

export function useReferenceData() {
  return useQuery({
    queryKey: queryKeys.reference,
    queryFn: () => request<ReferenceData>('/api/reference_data'),
    staleTime: Infinity,
  })
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: [...queryKeys.employees, 'list', filters],
    queryFn: () => request<Page<Employee>>('/api/employees', { params: toApiParams(filters) }),
    // Keep showing the current page while the next one loads, so the table does not flash empty.
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: number) {
  return useQuery({ queryKey: queryKeys.employee(id), queryFn: () => request<Employee>(`/api/employees/${id}`) })
}

export function useSalaryRevisions(id: number) {
  return useQuery({
    queryKey: queryKeys.revisions(id),
    queryFn: () => request<{ data: SalaryRevision[] }>(`/api/employees/${id}/salary_revisions`).then((r) => r.data),
  })
}

// Any change to an employee can change the directory, their history and every insight.
function useInvalidateAfterChange() {
  const client = useQueryClient()
  return () => Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.employees }),
    client.invalidateQueries({ queryKey: queryKeys.insights }),
  ])
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: (input: EmployeeInput) => request<Employee>('/api/employees', { method: 'POST', body: { employee: input } }),
    onSuccess: invalidate,
  })
}

export function useUpdateEmployee(id: number) {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: (input: EmployeeInput) => request<Employee>(`/api/employees/${id}`, { method: 'PATCH', body: { employee: input } }),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Drop this employee's cached data first so nothing tries to refetch a deleted record.
      client.removeQueries({ queryKey: queryKeys.employee(id) })
      return Promise.all([
        client.invalidateQueries({ queryKey: [...queryKeys.employees, 'list'] }),
        client.invalidateQueries({ queryKey: queryKeys.insights }),
      ])
    },
  })
}

export function useReviseSalary(id: number) {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: (input: SalaryRevisionInput) =>
      request<{ revision: SalaryRevision; employee: Employee }>(`/api/employees/${id}/salary_revisions`, {
        method: 'POST', body: { salary_revision: input },
      }),
    onSuccess: invalidate,
  })
}

export function useSummary(scope: StatsScope) {
  return useQuery({
    queryKey: [...queryKeys.insights, 'summary', scope],
    queryFn: () => request<Summary>('/api/insights/summary', { params: { employment_type: scope } }),
  })
}

export function useCountryInsights(scope: StatsScope) {
  return useQuery({
    queryKey: [...queryKeys.insights, 'countries', scope],
    queryFn: () => request<{ data: CountryInsight[] }>('/api/insights/countries', { params: { employment_type: scope } }).then((r) => r.data),
  })
}

export function useJobTitleInsights(countryId: number | null, scope: StatsScope) {
  return useQuery({
    queryKey: [...queryKeys.insights, 'job_titles', countryId, scope],
    queryFn: () => request<{ data: JobTitleInsight[] }>('/api/insights/job_titles', {
      params: { country_id: countryId, employment_type: scope },
    }).then((r) => r.data),
    enabled: countryId !== null,
  })
}

export function useDepartmentInsights(scope: StatsScope) {
  return useQuery({
    queryKey: [...queryKeys.insights, 'departments', scope],
    queryFn: () => request<{ data: DepartmentInsight[] }>('/api/insights/departments', { params: { employment_type: scope } }).then((r) => r.data),
  })
}

export function useOutliers(threshold: number, countryId: number | null) {
  return useQuery({
    queryKey: [...queryKeys.insights, 'outliers', threshold, countryId],
    queryFn: () => request<OutlierReport>('/api/insights/outliers', { params: { threshold, country_id: countryId } }),
    placeholderData: keepPreviousData,
  })
}
