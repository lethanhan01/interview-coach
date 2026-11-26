import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AUTH_DESTINATION,
  getSafeNext,
  isProtectedPath,
  matchesPathPrefix,
} from '@/lib/auth-redirect'

describe('auth-redirect helpers', () => {
  describe('matchesPathPrefix', () => {
    it('matches exact paths and nested subpaths without false positives', () => {
      expect(matchesPathPrefix('/admin', '/admin')).toBe(true)
      expect(matchesPathPrefix('/admin/dashboard', '/admin')).toBe(true)
      expect(matchesPathPrefix('/admin-fake', '/admin')).toBe(false)
      expect(matchesPathPrefix('/login', '/login')).toBe(true)
      expect(matchesPathPrefix('/login/help', '/login')).toBe(true)
      expect(matchesPathPrefix('/login-info', '/login')).toBe(false)
    })
  })

  describe('isProtectedPath', () => {
    it('identifies configured protected routes and excludes public/auth routes', () => {
      expect(isProtectedPath('/sessions')).toBe(true)
      expect(isProtectedPath('/sessions/abc-123/report')).toBe(true)
      expect(isProtectedPath('/setup')).toBe(true)
      expect(isProtectedPath('/profile')).toBe(true)
      expect(isProtectedPath('/admin/profile')).toBe(true)
      expect(isProtectedPath('/login')).toBe(false)
      expect(isProtectedPath('/register')).toBe(false)
      expect(isProtectedPath('/reset-password')).toBe(false)
      expect(isProtectedPath('/')).toBe(false)
    })
  })

  describe('getSafeNext', () => {
    it('preserves valid internal paths and query strings', () => {
      expect(getSafeNext('/setup?jdId=abc&new=1')).toBe('/setup?jdId=abc&new=1')
      expect(getSafeNext('/profile')).toBe('/profile')
      expect(getSafeNext('/admin/dashboard')).toBe('/admin/dashboard')
    })

    it('falls back to DEFAULT_AUTH_DESTINATION for unsafe URLs and auth routes', () => {
      const unsafeTargets = [
        null,
        undefined,
        '',
        'https://evil.example.com/sessions',
        '//evil.example.com',
        '/%2F%2Fevil.example.com',
        '/%5Cevil',
        '/login',
        '/login?next=/sessions',
        '/register',
        '/register/step-2',
        '/reset-password',
        '/callback',
        '/callback/complete',
      ]

      for (const target of unsafeTargets) {
        expect(getSafeNext(target)).toBe(DEFAULT_AUTH_DESTINATION)
      }
    })
  })
})
