import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useEmployeeFilters } from './useEmployeeFilters'

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/employees']}>{children}</MemoryRouter>

describe('useEmployeeFilters', () => {
  it('keeps both of two changes made before the page re-renders', () => {
    const { result } = renderHook(() => useEmployeeFilters(), { wrapper })

    act(() => {
      result.current.change({ countryIds: [1] })
      result.current.change({ jobTitleIds: [4] })
    })

    expect(result.current.filters).toMatchObject({ countryIds: [1], jobTitleIds: [4] })
  })
})
