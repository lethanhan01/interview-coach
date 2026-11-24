import { describe, expect, it } from 'vitest'
import { ApiClientError } from '@/lib/api-client'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'

describe('form-errors helpers', () => {
  describe('extractApiFieldErrors', () => {
    it('returns null for non-ApiClientError values', () => {
      expect(
        extractApiFieldErrors(new Error('boom'), {
          allowedFields: ['email'],
        })
      ).toBeNull()
      expect(
        extractApiFieldErrors('boom', {
          allowedFields: ['email'],
        })
      ).toBeNull()
    })

    it('maps field-level details filtered strictly by allowedFields', () => {
      const error = new ApiClientError(
        'Validation failed',
        400,
        'BAD_REQUEST',
        {
          email: ['Email không hợp lệ', 'Second error'],
          unknownField: ['Ignored'],
        }
      )

      expect(
        extractApiFieldErrors(error, {
          allowedFields: ['email', 'password'],
        })
      ).toEqual({
        email: 'Email không hợp lệ',
      })
    })

    it('falls back to codeToField when details are missing or non-field keyed', () => {
      const error = new ApiClientError(
        'Email này đã được sử dụng.',
        409,
        'EMAIL_ALREADY_EXISTS',
        { error: ['Duplicate email'] }
      )

      expect(
        extractApiFieldErrors(error, {
          allowedFields: ['email', 'password'],
          codeToField: { EMAIL_ALREADY_EXISTS: 'email' },
        })
      ).toEqual({
        email: 'Email này đã được sử dụng.',
      })
    })

    it('returns null when neither details nor codeToField match allowedFields', () => {
      const error = new ApiClientError('Server error', 500, 'INTERNAL_ERROR')
      expect(
        extractApiFieldErrors(error, {
          allowedFields: ['email'],
          codeToField: { EMAIL_ALREADY_EXISTS: 'email' },
        })
      ).toBeNull()
    })
  })

  describe('getErrorMessage', () => {
    it('returns non-empty Error message or fallback', () => {
      expect(getErrorMessage(new Error('Lỗi cụ thể'), 'Mặc định')).toBe(
        'Lỗi cụ thể'
      )
      expect(getErrorMessage(new Error('   '), 'Mặc định')).toBe('Mặc định')
      expect(getErrorMessage(null, 'Mặc định')).toBe('Mặc định')
    })
  })
})
