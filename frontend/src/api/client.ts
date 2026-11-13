export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type Params = Record<string, string | number | undefined | null>

export function buildUrl(path: string, params: Params = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}

export async function request<T>(path: string, options: { method?: string; body?: unknown; params?: Params } = {}): Promise<T> {
  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? 'GET',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fieldErrors: FieldErrors = payload.errors ?? {}
    const message = payload.error ?? (Object.keys(fieldErrors).length ? 'Please fix the highlighted fields.' : `Request failed (${response.status})`)
    throw new ApiError(response.status, message, fieldErrors)
  }
  return payload as T
}
