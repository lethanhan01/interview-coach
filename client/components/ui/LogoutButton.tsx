'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/logout`, {
      method: 'POST', credentials: 'include',
    })
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
