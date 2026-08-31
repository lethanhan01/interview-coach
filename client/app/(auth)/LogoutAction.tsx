'use client'

import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { authService } from '@/services'

export default function LogoutAction({ className }: { className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      router.replace('/login')
    }
  }

  return <LogoutButton className={className} onClick={handleLogout} />
}

