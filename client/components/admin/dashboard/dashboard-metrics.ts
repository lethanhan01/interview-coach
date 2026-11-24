import { APP_TIME_ZONE } from '@/lib/date-time'
import type { AdminUser } from '@/types'

export type RegistrationRange = 'monthly' | 'last30d'

export interface RegistrationPoint {
  sortKey: string
  label: string
  count: number
}

export interface DashboardUserMetrics {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  adminCount: number
  candidateCount: number
  activePercent: number
  lockedPercent: number
  adminPercent: number
  recentUsers: AdminUser[]
}

const VN_DATE_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function extractVietnamParts(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const parts = VN_DATE_PARTS.formatToParts(date)
  const map = new Map(parts.map((part) => [part.type, part.value]))
  const year = map.get('year')
  const month = map.get('month')
  const day = map.get('day')

  if (!year || !month || !day) return null
  return { year, month, day, timestamp: date.getTime() }
}

export function getUserDisplayName(user: AdminUser): string {
  const fullName = [user.lastname, user.firstname]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim()
  return fullName || user.email
}

export function getUserInitials(user: AdminUser): string {
  const first = user.firstname?.trim()[0]
  const last = user.lastname?.trim()[0]
  if (last && first) return `${last}${first}`.toUpperCase()
  if (first) return first.toUpperCase()
  return (user.email.trim()[0] || 'U').toUpperCase()
}

export function computeUserMetrics(users: AdminUser[]): DashboardUserMetrics {
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === 'active').length
  const lockedUsers = users.filter((u) => u.status === 'locked').length
  const adminCount = users.filter((u) => u.role === 'admin').length
  const candidateCount = totalUsers - adminCount

  const pct = (value: number) =>
    totalUsers > 0 ? Math.round((value / totalUsers) * 100) : 0

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  return {
    totalUsers,
    activeUsers,
    lockedUsers,
    adminCount,
    candidateCount,
    activePercent: pct(activeUsers),
    lockedPercent: pct(lockedUsers),
    adminPercent: pct(adminCount),
    recentUsers,
  }
}

export function buildRegistrationSeries(
  users: AdminUser[],
  range: RegistrationRange,
  now: Date = new Date()
): RegistrationPoint[] {
  const buckets = new Map<string, RegistrationPoint>()
  const cutoffMs = now.getTime() - 30 * 86_400_000

  for (const user of users) {
    const parts = extractVietnamParts(user.createdAt)
    if (!parts) continue

    if (range === 'last30d' && parts.timestamp < cutoffMs) {
      continue
    }

    const sortKey =
      range === 'monthly'
        ? `${parts.year}-${parts.month}`
        : `${parts.year}-${parts.month}-${parts.day}`
    const label =
      range === 'monthly'
        ? `${parts.month}/${parts.year}`
        : `${parts.day}/${parts.month}`

    const existing = buckets.get(sortKey)
    if (existing) {
      existing.count += 1
    } else {
      buckets.set(sortKey, { sortKey, label, count: 1 })
    }
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  )
}
