'use client'

import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

export default function LogoutAction({ className }: { className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      router.replace('/login')
    }
  }

  return <LogoutButton className={className} onClick={handleLogout} />
}
