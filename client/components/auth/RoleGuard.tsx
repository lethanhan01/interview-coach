'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function RoleGuard({
  children,
  allowedRole,
  fallbackRoute,
}: {
  children: React.ReactNode
  allowedRole: string
  fallbackRoute: string
}) {
  const { role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (role === null) {
        router.replace('/login')
      } else if (role !== allowedRole) {
        router.replace(fallbackRoute)
      }
    }
  }, [isLoading, role, router, allowedRole, fallbackRoute])

  if (isLoading || role !== allowedRole) return null

  return <>{children}</>
}
