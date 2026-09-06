import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNext, isProtectedPath } from '@/lib/auth-redirect'
import { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE } from '../config'

/**
 * Auth Guard — Session & login-page redirect.
 *
 * Rules:
 * 1. No auth cookie + protected route → redirect /unauthenticated?next=<original>
 * 2. Has access token + on /login → redirect to ?next param (safe-validated)
 *
 * Returns `null` if this guard does not handle the request (pass to next guard).
 */
export function authGuard(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl

  const hasAccessToken = Boolean(request.cookies.get(ACCESS_COOKIE)?.value)
  const hasAnyCookie = Boolean(
    hasAccessToken ||
    request.cookies.get(REFRESH_COOKIE)?.value ||
    request.cookies.get(LEGACY_COOKIE)?.value,
  )

  // ── Rule 1: Unauthenticated user tries to access a protected route ──────────
  if (!hasAnyCookie && isProtectedPath(pathname)) {
    const dest = request.nextUrl.clone()
    dest.pathname = '/unauthenticated'
    dest.search = ''
    dest.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(dest)
  }

  // ── Rule 2: Already authenticated user navigates to /login ─────────────────
  if (hasAccessToken && pathname === '/login') {
    const next = getSafeNext(request.nextUrl.searchParams.get('next'))
    return NextResponse.redirect(new URL(next, request.url))
  }

  return null
}
