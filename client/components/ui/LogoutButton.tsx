'use client'

import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await getSupabaseBrowserClient()?.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm text-ink-muted hover:text-brand rounded-lg hover:bg-brand-50 transition-colors"
    >
      Đăng xuất
    </button>
  )
}
