import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNext, isProtectedPath } from './lib/auth-redirect'
import { getSupabaseConfig } from './lib/supabase-config'

function redirectWithCookies(destination: URL, source: NextResponse): NextResponse {
  const response = NextResponse.redirect(destination)
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}

export async function proxy(request: NextRequest) {
  const { url, key } = getSupabaseConfig()
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname, search } = request.nextUrl

  if (!user && isProtectedPath(pathname)) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', `${pathname}${search}`)
    return redirectWithCookies(login, response)
  }

  if (user && pathname === '/login') {
    const destination = new URL(getSafeNext(request.nextUrl.searchParams.get('next')), request.url)
    return redirectWithCookies(destination, response)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
