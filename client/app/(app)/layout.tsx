import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '../../lib/supabase-server'
import LogoutButton from '@/components/ui/LogoutButton'

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
    <div>
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/sessions" className="text-sm font-semibold text-gray-900">
              InterviewCoach
            </Link>
            <Link href="/setup" className="text-sm text-gray-600 hover:text-gray-900">
              Phỏng vấn mới
            </Link>
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Hồ sơ
            </Link>
          </div>
          <LogoutButton />
        </nav>
      </header>
      <div data-access-token={accessToken}>
        {children}
      </div>
    </div>
  )
}
