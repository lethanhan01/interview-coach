import { NextResponse, type NextRequest } from 'next/server'
import {
  getSafeNext,
  isProtectedPath,
  matchesPathPrefix,
} from '@/lib/auth-redirect'
import {
  getAccessCookieName,
  getRefreshCookieName,
  GUEST_ONLY_AUTH_PATHS,
  LEGACY_COOKIE,
} from '../config'

function hasLoginRecoveryParams(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has('error') ||
    searchParams.get('reason') === 'session_expired'
  )
}

/**
 * Auth Guard — Session & guest-only auth route redirect.
 *
 * Rules:
 * 1. No auth cookie + protected route → redirect /unauthenticated?next=<original>
 * 2. Has access token + on /login or /register (without recovery params) → redirect to safe ?next
 *
 * Returns `null` if this guard does not handle the request (pass to next guard).
 */
export function authGuard(request: NextRequest): NextResponse | null {
  const { pathname, search, searchParams } = request.nextUrl

  const hasAccessToken = Boolean(
    request.cookies.get(getAccessCookieName())?.value
  )
  const hasAnyCookie = Boolean(
    hasAccessToken ||
    request.cookies.get(getRefreshCookieName())?.value ||
    request.cookies.get(LEGACY_COOKIE)?.value
  )

  if (!hasAnyCookie && isProtectedPath(pathname)) {
    const dest = request.nextUrl.clone()
    dest.pathname = '/unauthenticated'
    dest.search = ''
    dest.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(dest)
  }

  const isGuestOnlyAuthPath = GUEST_ONLY_AUTH_PATHS.some((prefix) =>
    matchesPathPrefix(pathname, prefix)
  )
  if (
    hasAccessToken &&
    isGuestOnlyAuthPath &&
    !hasLoginRecoveryParams(searchParams)
  ) {
    const next = getSafeNext(searchParams.get('next'))
    return NextResponse.redirect(new URL(next, request.url))
  }

  return null
}
