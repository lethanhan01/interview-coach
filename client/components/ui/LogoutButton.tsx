'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  function handleLogout() {
    router.push('/sessions')
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
