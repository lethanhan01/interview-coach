export const DEFAULT_AUTH_DESTINATION = '/sessions'

const BLOCKED_PREFIXES = ['/login', '/callback']

export const PROTECTED_ROUTE_PREFIXES = [
  '/sessions',
  '/setup',
  '/resume',
  '/profile',
  '/jd-library',
  '/admin',
] as const

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesPathPrefix(pathname, prefix)
  )
}

/** Returns an internal, non-auth destination or the safe default. */
export function getSafeNext(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    /%2f|%5c/i.test(next)
  ) {
    return DEFAULT_AUTH_DESTINATION
  }

  try {
    const target = new URL(next, 'https://interviewcoach.local')
    if (target.origin !== 'https://interviewcoach.local')
      return DEFAULT_AUTH_DESTINATION
    if (
      BLOCKED_PREFIXES.some((prefix) =>
        matchesPathPrefix(target.pathname, prefix)
      )
    ) {
      return DEFAULT_AUTH_DESTINATION
    }
    return `${target.pathname}${target.search}`
  } catch {
    return DEFAULT_AUTH_DESTINATION
  }
}
