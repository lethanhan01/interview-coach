import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '../../lib/supabase-server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const accessToken = session?.access_token ?? ''

  return (
    <div data-access-token={accessToken}>
      {children}
    </div>
  )
}
