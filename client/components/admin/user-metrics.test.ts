import { describe, expect, it } from 'vitest'
import {
  formatVietnamDate,
  formatVietnamDateTime,
  formatVietnamRelativeDate,
} from '@/lib/date-time'
import type { AdminUser } from '@/types'
import {
  buildRegistrationSeries,
  computeUserMetrics,
  getUserDisplayName,
  getUserInitials,
} from './user-metrics'

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u-1',
    email: 'user@example.com',
    firstname: 'An',
    lastname: 'Nguyễn',
    role: 'candidate',
    status: 'active',
    createdAt: '2026-10-15T10:00:00+07:00',
    ...overrides,
  }
}

describe('user-metrics', () => {
  it('returns zeroed metrics and empty series for 0 users', () => {
    const metrics = computeUserMetrics([])

    expect(metrics).toEqual({
      totalUsers: 0,
      activeUsers: 0,
      lockedUsers: 0,
      adminCount: 0,
      candidateCount: 0,
      activePercent: 0,
      lockedPercent: 0,
      adminPercent: 0,
      recentUsers: [],
    })
    expect(buildRegistrationSeries([], 'monthly')).toEqual([])
    expect(buildRegistrationSeries([], 'last30d')).toEqual([])
  })

  it('computes initials correctly including lastname-only users', () => {
    expect(getUserInitials(makeUser({ firstname: 'An', lastname: 'Lê' }))).toBe(
      'LA'
    )
    expect(
      getUserInitials(makeUser({ firstname: 'Bình', lastname: null }))
    ).toBe('B')
    expect(
      getUserInitials(makeUser({ firstname: null, lastname: 'Phạm' }))
    ).toBe('P')
    expect(
      getUserInitials(
        makeUser({ firstname: '  ', lastname: '  ', email: 'test@example.com' })
      )
    ).toBe('T')
    expect(
      getUserDisplayName(makeUser({ firstname: null, lastname: 'Phạm' }))
    ).toBe('Phạm')
  })

  it('keeps activePercent + lockedPercent equal to 100 for 1 active and 7 locked users', () => {
    const users: AdminUser[] = [
      makeUser({ id: 'active-1', status: 'active', role: 'admin' }),
      ...Array.from({ length: 7 }, (_, index) =>
        makeUser({
          id: `locked-${index + 1}`,
          status: 'locked',
          role: 'candidate',
        })
      ),
    ]

    const metrics = computeUserMetrics(users)

    expect(metrics.totalUsers).toBe(8)
    expect(metrics.activeUsers).toBe(1)
    expect(metrics.lockedUsers).toBe(7)
    expect(metrics.adminCount).toBe(1)
    expect(metrics.candidateCount).toBe(7)
    expect(metrics.activePercent).toBe(13)
    expect(metrics.lockedPercent).toBe(87)
    expect(metrics.activePercent + metrics.lockedPercent).toBe(100)
  })

  it('handles malformed createdAt safely in recentUsers sort, series, and date formatters', () => {
    const users: AdminUser[] = [
      makeUser({ id: 'bad', createdAt: 'invalid-date' }),
      makeUser({ id: 'older', createdAt: '2026-09-01T00:00:00Z' }),
      makeUser({ id: 'newer', createdAt: '2026-10-01T00:00:00Z' }),
    ]

    const metrics = computeUserMetrics(users)
    expect(metrics.recentUsers.map((u) => u.id)).toEqual([
      'newer',
      'older',
      'bad',
    ])

    const series = buildRegistrationSeries(users, 'monthly')
    expect(series.map((p) => p.sortKey)).toEqual(['2026-09', '2026-10'])

    expect(formatVietnamDateTime('invalid-date')).toBe('—')
    expect(formatVietnamDate('invalid-date')).toBe('—')
    expect(formatVietnamRelativeDate('invalid-date')).toBe('—')
  })

  it('aligns last30d cutoff to 00:00:00 Vietnam time (UTC+7) of day T-29', () => {
    const now = new Date('2026-10-30T00:30:00+07:00')
    const users: AdminUser[] = [
      makeUser({
        id: 'just-outside',
        createdAt: '2026-09-30T23:59:59+07:00',
      }),
      makeUser({
        id: 'on-boundary',
        createdAt: '2026-10-01T00:00:00+07:00',
      }),
      makeUser({
        id: 'today',
        createdAt: '2026-10-30T00:15:00+07:00',
      }),
    ]

    const series = buildRegistrationSeries(users, 'last30d', now)

    expect(series).toEqual([
      { sortKey: '2026-10-01', label: '01/10', count: 1 },
      { sortKey: '2026-10-30', label: '30/10', count: 1 },
    ])
  })
})
