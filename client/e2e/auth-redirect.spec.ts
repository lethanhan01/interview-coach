import { expect, test } from '@playwright/test'
import {
  DEFAULT_AUTH_DESTINATION,
  getSafeNext,
  isProtectedPath,
} from '../lib/auth-redirect'

test.describe('auth redirect policy', () => {
  test('preserves a valid internal path and query string', () => {
    expect(getSafeNext('/setup?jdId=abc')).toBe('/setup?jdId=abc')
  })

  test('falls back for unsafe and auth-loop destinations', () => {
    for (const next of [
      null,
      '',
      'https://example.com',
      '//example.com',
      '/%2F%2Fevil',
      '/login',
      '/login/help',
      '/callback',
      '/callback/complete',
    ]) {
      expect(getSafeNext(next)).toBe(DEFAULT_AUTH_DESTINATION)
    }
  })

  test('recognizes only configured protected-route prefixes', () => {
    expect(isProtectedPath('/sessions/123')).toBeTruthy()
    expect(isProtectedPath('/setup')).toBeTruthy()
    expect(isProtectedPath('/login')).toBeFalsy()
  })
})
