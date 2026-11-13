import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildEmployee, mockApi, reference, renderWithProviders } from '../test/utils'
import { SalaryRevisionModal } from './SalaryRevisionModal'

afterEach(() => vi.restoreAllMocks())

function renderModal(onClose = vi.fn()) {
  renderWithProviders(
    <SalaryRevisionModal opened onClose={onClose} employee={buildEmployee()} reasons={reference.revision_reasons} />,
  )
  return onClose
}

describe('SalaryRevisionModal', () => {
  it('requires a salary and a reason before sending anything', async () => {
    const calls = mockApi({})
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: 'Save salary change' }))

    expect(screen.getByText('Enter the new annual salary')).toBeInTheDocument()
    expect(screen.getByText('Choose why the salary is changing')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('shows the change against the current salary while typing', async () => {
    mockApi({})
    renderModal()

    await userEvent.type(screen.getByLabelText(/new annual salary/i), '2200000')

    expect(screen.getByText(/\+10\.0% vs current/)).toBeInTheDocument()
  })

  it('saves the change with its reason and closes', async () => {
    const calls = mockApi({
      'POST /api/employees/7/salary_revisions': () => ({ status: 201, body: { revision: {}, employee: buildEmployee() } }),
    })
    const onClose = renderModal()

    await userEvent.type(screen.getByLabelText(/new annual salary/i), '2200000')
    await userEvent.click(screen.getByRole('textbox', { name: /reason/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Promotion' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save salary change' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(calls[0].body).toMatchObject({ salary_revision: { new_salary: '2200000', reason: 'promotion' } })
  })

  it('shows the server error on the field', async () => {
    mockApi({
      'POST /api/employees/7/salary_revisions': () => ({ status: 422, body: { errors: { salary: ['Salary must be less than 100000000000'] } } }),
    })
    renderModal()

    await userEvent.type(screen.getByLabelText(/new annual salary/i), '999999999999')
    await userEvent.click(screen.getByRole('textbox', { name: /reason/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Correction' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save salary change' }))

    expect(await screen.findByText('Salary must be less than 100000000000')).toBeInTheDocument()
  })
})
