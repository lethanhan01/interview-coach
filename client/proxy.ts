import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNext, isProtectedPath } from './lib/auth-redirect'

const accessCookieName = process.env.AUTH_COOKIE_NAME ?? 'interviewcoach_access'
const refreshCookieName = process.env.REFRESH_COOKIE_NAME ?? 'interviewcoach_refresh'
const legacyCookieName = 'interviewcoach_auth'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasAccessToken = Boolean(request.cookies.get(accessCookieName)?.value)
  const hasAnyCookie = Boolean(
    hasAccessToken ||
    request.cookies.get(refreshCookieName)?.value ||
    request.cookies.get(legacyCookieName)?.value
  )
  if (!hasAnyCookie && isProtectedPath(pathname)) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(login)
  }
  if (hasAccessToken && pathname === '/login') {
    return NextResponse.redirect(
      new URL(
        getSafeNext(request.nextUrl.searchParams.get('next')),
        request.url
      )
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
