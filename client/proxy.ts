import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNext, isProtectedPath } from './lib/auth-redirect'

const cookieName = process.env.AUTH_COOKIE_NAME ?? 'interviewcoach_auth'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSessionCookie = Boolean(request.cookies.get(cookieName)?.value)
  if (!hasSessionCookie && isProtectedPath(pathname)) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(login)
  }
  if (hasSessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL(getSafeNext(request.nextUrl.searchParams.get('next')), request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
