import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { authGuard } from '@/middleware/guards/auth.guard'

function createRequest(
  path: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const req = new NextRequest(`https://intervia.local${path}`)
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value)
  }
  return req
}

describe('authGuard', () => {
  const originalAccessEnv = process.env.AUTH_ACCESS_COOKIE_NAME
  const originalLegacyAccessEnv = process.env.AUTH_COOKIE_NAME
  const originalRefreshEnv = process.env.AUTH_REFRESH_COOKIE_NAME

  afterEach(() => {
    if (originalAccessEnv === undefined) {
      delete process.env.AUTH_ACCESS_COOKIE_NAME
    } else {
      process.env.AUTH_ACCESS_COOKIE_NAME = originalAccessEnv
    }
    if (originalLegacyAccessEnv === undefined) {
      delete process.env.AUTH_COOKIE_NAME
    } else {
      process.env.AUTH_COOKIE_NAME = originalLegacyAccessEnv
    }
    if (originalRefreshEnv === undefined) {
      delete process.env.AUTH_REFRESH_COOKIE_NAME
    } else {
      process.env.AUTH_REFRESH_COOKIE_NAME = originalRefreshEnv
    }
  })

  it('redirects unauthenticated requests on protected routes to /unauthenticated with next param', () => {
    const res = authGuard(createRequest('/sessions/123?tab=notes'))
    expect(res).not.toBeNull()
    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe(
      'https://intervia.local/unauthenticated?next=%2Fsessions%2F123%3Ftab%3Dnotes'
    )
  })

  it('allows protected routes when access, refresh, or legacy cookie is present', () => {
    expect(
      authGuard(createRequest('/sessions', { intervia_access: 'tok' }))
    ).toBeNull()
    expect(
      authGuard(createRequest('/profile', { intervia_refresh: 'ref' }))
    ).toBeNull()
    expect(
      authGuard(createRequest('/admin/profile', { intervia_auth: 'leg' }))
    ).toBeNull()
  })

  it('honors backend AUTH_ACCESS_COOKIE_NAME and AUTH_REFRESH_COOKIE_NAME env vars', () => {
    process.env.AUTH_ACCESS_COOKIE_NAME = 'custom_access'
    process.env.AUTH_REFRESH_COOKIE_NAME = 'custom_refresh'

    expect(
      authGuard(createRequest('/sessions', { custom_access: 'tok' }))
    ).toBeNull()
    expect(
      authGuard(createRequest('/sessions', { custom_refresh: 'ref' }))
    ).toBeNull()

    const redirected = authGuard(
      createRequest('/login?next=/profile', { custom_access: 'tok' })
    )
    expect(redirected?.headers.get('location')).toBe(
      'https://intervia.local/profile'
    )
  })

  it('redirects authenticated users away from /login and /register using safe next', () => {
    const fromLogin = authGuard(
      createRequest('/login?next=/setup?jdId=42', {
        intervia_access: 'tok',
      })
    )
    expect(fromLogin?.headers.get('location')).toBe(
      'https://intervia.local/setup?jdId=42'
    )

    const fromRegister = authGuard(
      createRequest('/register', { intervia_access: 'tok' })
    )
    expect(fromRegister?.headers.get('location')).toBe(
      'https://intervia.local/sessions'
    )

    const unsafeNext = authGuard(
      createRequest('/login?next=https://evil.com', {
        intervia_access: 'tok',
      })
    )
    expect(unsafeNext?.headers.get('location')).toBe(
      'https://intervia.local/sessions'
    )
  })

  it('prevents infinite redirect loops on /login when error or reason=session_expired is set', () => {
    expect(
      authGuard(
        createRequest('/login?error=account_inactive', {
          intervia_access: 'stale-token',
        })
      )
    ).toBeNull()

    expect(
      authGuard(
        createRequest('/login?reason=session_expired', {
          intervia_access: 'stale-token',
        })
      )
    ).toBeNull()
  })

  it('keeps /reset-password accessible even when access cookie exists', () => {
    expect(
      authGuard(createRequest('/reset-password', { intervia_access: 'tok' }))
    ).toBeNull()
  })
})
