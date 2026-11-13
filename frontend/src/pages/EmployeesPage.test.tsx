import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildEmployee, mockApi, reference, renderWithProviders } from '../test/utils'
import { EmployeesPage } from './EmployeesPage'

afterEach(() => vi.restoreAllMocks())

const page = (employees = [buildEmployee()], total = employees.length) => ({
  body: { data: employees, meta: { page: 1, per_page: 25, total, total_pages: Math.ceil(total / 25) } },
})

describe('EmployeesPage', () => {
  it('lists employees with local and USD pay', async () => {
    mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page() })

    renderWithProviders(<EmployeesPage />, { route: '/employees' })

    const row = (await screen.findByText('Asha Rao')).closest('tr')!
    expect(within(row).getByText('₹2,000,000')).toBeInTheDocument()
    expect(within(row).getByText('≈ $23,600')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–1 of 1')).toBeInTheDocument()
  })

  it('reads filters from the URL and sends them to the API', async () => {
    const calls = mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page() })

    renderWithProviders(<EmployeesPage />, { route: '/employees?q=rao&country=1,2&sort=salary_usd&direction=desc' })

    await screen.findByText('Asha Rao')
    const list = calls.find((c) => c.url.pathname === '/api/employees')!
    expect(Object.fromEntries(list.url.searchParams)).toMatchObject({
      q: 'rao', country_id: '1,2', sort: 'salary_usd', direction: 'desc', page: '1',
    })
  })

  it('sorts by a column when its header is clicked, then reverses it', async () => {
    const calls = mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page() })
    renderWithProviders(<EmployeesPage />, { route: '/employees' })
    await screen.findByText('Asha Rao')

    await userEvent.click(screen.getByRole('button', { name: /hired/i }))
    await waitFor(() => expect(calls.at(-1)!.url.searchParams.get('sort')).toBe('hire_date'))
    await userEvent.click(screen.getByRole('button', { name: /hired/i }))

    await waitFor(() => expect(calls.at(-1)!.url.searchParams.get('direction')).toBe('desc'))
  })

  it('searches after the user stops typing', async () => {
    const calls = mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page() })
    renderWithProviders(<EmployeesPage />, { route: '/employees' })
    await screen.findByText('Asha Rao')

    await userEvent.type(screen.getByLabelText('Search'), 'asha')

    await waitFor(() => expect(calls.at(-1)!.url.searchParams.get('q')).toBe('asha'))
    const searches = calls.filter((c) => c.url.pathname === '/api/employees' && c.url.searchParams.has('q'))
    expect(searches).toHaveLength(1)
  })

  it('exports exactly the filtered list', async () => {
    mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page() })

    renderWithProviders(<EmployeesPage />, { route: '/employees?department=2&page=3' })

    const link = await screen.findByRole('link', { name: /export csv/i })
    const href = new URL(link.getAttribute('href')!, 'http://localhost')
    expect(href.pathname).toBe('/api/employees.csv')
    expect(href.searchParams.get('department_id')).toBe('2')
    expect(href.searchParams.has('page')).toBe(false)
  })

  it('says so when nothing matches', async () => {
    mockApi({ 'GET /api/reference_data': () => ({ body: reference }), 'GET /api/employees': () => page([], 0) })

    renderWithProviders(<EmployeesPage />, { route: '/employees?q=nobody' })

    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument()
  })
})
