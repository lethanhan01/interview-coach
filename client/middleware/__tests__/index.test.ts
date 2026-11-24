import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { handleMiddleware } from '@/middleware'

function createRequest(
  path: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const req = new NextRequest(`https://interviewcoach.local${path}`)
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value)
  }
  return req
}

describe('handleMiddleware pipeline', () => {
  const originalFlag = process.env.NEXT_PUBLIC_MAINTENANCE_MODE

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE
    } else {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = originalFlag
    }
  })

  it('prioritizes maintenanceGuard before authGuard for candidate routes', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

    const res = handleMiddleware(createRequest('/sessions'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://interviewcoach.local/maintenance'
    )
  })

  it('still enforces authGuard on /admin during maintenance mode', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

    const res = handleMiddleware(createRequest('/admin/dashboard'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://interviewcoach.local/unauthenticated?next=%2Fadmin%2Fdashboard'
    )
  })

  it('continues with NextResponse.next() when all guards pass', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'false'

    const res = handleMiddleware(
      createRequest('/sessions', { interviewcoach_access: 'valid' })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })
})
