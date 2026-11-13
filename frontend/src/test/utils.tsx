import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProviders } from '../AppProviders'
import type { Employee, ReferenceData } from '../api/types'
import { makeQueryClient } from '../lib/queryClient'

export function renderWithProviders(ui: ReactElement, { route = '/', path = '*' }: { route?: string; path?: string } = {}) {
  const queryClient = makeQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  return render(
    <AppProviders queryClient={queryClient} env="test">
      <MemoryRouter initialEntries={[route]}>
        <Routes><Route path={path} element={ui} /></Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

type Handler = (url: URL, init?: RequestInit) => { status?: number; body?: unknown }

// Routes fetch calls to handlers by "METHOD /path" and records every call for assertions.
export function mockApi(handlers: Record<string, Handler>) {
  const calls: { method: string; url: URL; body?: unknown }[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    const handler = handlers[`${method} ${url.pathname}`]
    if (!handler) return new Response(JSON.stringify({ error: 'not mocked' }), { status: 500 })
    const { status = 200, body = {} } = handler(url, init)
    return new Response(status === 204 ? null : JSON.stringify(body), { status })
  })
  return calls
}

export const reference: ReferenceData = {
  countries: [
    { id: 1, code: 'IN', name: 'India', currency_code: 'INR', usd_rate: '0.0118' },
    { id: 2, code: 'DE', name: 'Germany', currency_code: 'EUR', usd_rate: '1.09' },
  ],
  departments: [{ id: 1, name: 'Engineering' }, { id: 2, name: 'Sales' }],
  job_titles: [{ id: 1, name: 'Software Engineer' }],
  employment_types: ['full_time', 'part_time', 'contractor'],
  revision_reasons: ['annual_review', 'promotion', 'market_adjustment', 'correction'],
}

export function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 7, employee_code: 'ACME-00007', first_name: 'Asha', last_name: 'Rao', full_name: 'Asha Rao',
    email: 'asha.rao@acme.example', employment_type: 'full_time', hire_date: '2022-04-01',
    salary: '2000000.0', currency_code: 'INR', salary_usd: '23600.0',
    country: { id: 1, code: 'IN', name: 'India' }, department: { id: 1, name: 'Engineering' },
    job_title: { id: 1, name: 'Software Engineer' }, lock_version: 0,
    ...overrides,
  }
}
