'use client'

import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { useAuth } from '@/hooks/useAuth'

export default function LogoutAction({ className }: { className?: string }) {
  const router = useRouter()
  const { logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return <LogoutButton className={className} onClick={handleLogout} />
}

