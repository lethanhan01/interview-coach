import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNext } from '@/lib/auth-redirect'
import { getSupabaseConfig } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const { url, key } = getSupabaseConfig()
  if (!code) return NextResponse.redirect(new URL('/login?error=callback', request.url))
  const destination = new URL(getSafeNext(request.nextUrl.searchParams.get('next')), request.url)
  let response = NextResponse.redirect(destination)
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) response = NextResponse.redirect(new URL('/login?error=callback', request.url))
  return response
}
