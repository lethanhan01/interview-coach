import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { maintenanceGuard } from '@/middleware/guards/maintenance.guard'

function createRequest(path: string): NextRequest {
  return new NextRequest(`https://intervia.local${path}`)
}

describe('maintenanceGuard', () => {
  const originalFlag = process.env.NEXT_PUBLIC_MAINTENANCE_MODE

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE
    } else {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = originalFlag
    }
  })

  it('passes through when maintenance mode is disabled', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'false'
    expect(maintenanceGuard(createRequest('/'))).toBeNull()
    expect(maintenanceGuard(createRequest('/sessions'))).toBeNull()
  })

  it('redirects public and candidate routes to /maintenance when enabled', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

    for (const path of ['/', '/sessions', '/register', '/admin-fake']) {
      const res = maintenanceGuard(createRequest(path))
      expect(res?.status).toBe(307)
      expect(res?.headers.get('location')).toBe(
        'https://intervia.local/maintenance'
      )
    }
  })

  it('bypasses maintenance, admin, auth login/unauthenticated, _next, and favicon paths', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

    const bypassedPaths = [
      '/maintenance',
      '/admin',
      '/admin/dashboard',
      '/admin/profile',
      '/login',
      '/unauthenticated',
      '/_next/static/chunk.js',
      '/favicon.ico',
      '/favicon-32x32.png',
    ]

    for (const path of bypassedPaths) {
      expect(maintenanceGuard(createRequest(path))).toBeNull()
    }
  })
})
