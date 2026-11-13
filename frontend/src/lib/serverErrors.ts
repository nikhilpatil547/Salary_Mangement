import { ApiError } from '../api/client'

// Maps Rails field errors (e.g. "department" or "department_id") onto form field names.
export function formErrorsFrom(error: unknown, fields: string[]): { fieldErrors: Record<string, string>; message: string | null } {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, message: 'Something went wrong. Please try again.' }

  const fieldErrors: Record<string, string> = {}
  const unmatched: string[] = []
  for (const [key, messages] of Object.entries(error.fieldErrors)) {
    const field = fields.find((f) => f === key || f === `${key}_id`)
    if (field) fieldErrors[field] = messages[0]
    else unmatched.push(...messages)
  }
  // Errors for fields that are not on the form still have to reach the user.
  const message = unmatched.length ? unmatched.join(' ') : Object.keys(fieldErrors).length ? null : error.message
  return { fieldErrors, message }
}
