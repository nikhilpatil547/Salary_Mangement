import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { formErrorsFrom } from './serverErrors'

describe('formErrorsFrom', () => {
  it('puts each error on its field, matching association names to *_id fields', () => {
    const error = new ApiError(422, 'invalid', { email: ['Email is taken'], department: ['Department must exist'] })

    expect(formErrorsFrom(error, ['email', 'department_id'])).toEqual({
      fieldErrors: { email: 'Email is taken', department_id: 'Department must exist' }, message: null,
    })
  })

  it('surfaces errors for fields that are not on the form', () => {
    const error = new ApiError(422, 'invalid', { country: ["Country can't be changed after hiring"] })

    expect(formErrorsFrom(error, ['email']).message).toBe("Country can't be changed after hiring")
  })

  it('uses the general message for conflicts', () => {
    const error = new ApiError(409, 'This employee was changed by someone else.')

    expect(formErrorsFrom(error, ['email']).message).toBe('This employee was changed by someone else.')
  })
})
