import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data } = await supabase.auth.getUser()
      const profileCompleted = (data.user?.user_metadata as { profile_completed?: boolean })?.profile_completed

      const redirectPath = profileCompleted ? '/sessions' : '/setup'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
