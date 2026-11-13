import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildUrl, request } from './client'

afterEach(() => vi.restoreAllMocks())

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), { status }),
  )
}

describe('buildUrl', () => {
  it('drops empty params', () => {
    expect(buildUrl('/api/employees', { q: '', page: 2, country_id: undefined })).toBe('/api/employees?page=2')
  })
})

describe('request', () => {
  it('returns the parsed body', async () => {
    mockFetch(200, { ok: true })
    await expect(request('/api/x')).resolves.toEqual({ ok: true })
  })

  it('turns validation errors into an ApiError with field messages', async () => {
    mockFetch(422, { errors: { email: ['Email is invalid'] } })

    const error = await request('/api/x', { method: 'POST', body: {} }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toEqual({ email: ['Email is invalid'] })
  })

  it('uses the server message for other errors', async () => {
    mockFetch(409, { error: 'This employee was changed by someone else.' })

    await expect(request('/api/x')).rejects.toThrow('This employee was changed by someone else.')
  })
})
