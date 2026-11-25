'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Center, Loader, Stack } from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import { useAuth } from '@/providers/AuthProvider'

export interface RoleGuardProps {
  children: ReactNode
  allowedRole: string
  fallbackRoute: string
}

export default function RoleGuard({
  children,
  allowedRole,
  fallbackRoute,
}: Readonly<RoleGuardProps>) {
  const { role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (role === null) {
        router.replace('/login?reason=session_expired')
      } else if (role !== allowedRole) {
        router.replace(fallbackRoute)
      }
    }
  }, [isLoading, role, router, allowedRole, fallbackRoute])

  if (isLoading || role !== allowedRole) {
    return (
      <Center
        mih="50dvh"
        role="status"
        aria-label="Đang kiểm tra quyền truy cập"
      >
        <Stack align="center" gap="sm">
          <BrandLogo variant="mark" size="md" decorative />
          <Loader color="brand" size="md" />
        </Stack>
      </Center>
    )
  }

  return <>{children}</>
}
