import type { ReactNode } from 'react'
import RoleGuard from '@/components/auth/RoleGuard'
import AppLayout from '@/components/layout/AppLayout'

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <RoleGuard allowedRole="admin" fallbackRoute="/sessions">
      <AppLayout role="admin">{children}</AppLayout>
    </RoleGuard>
  )
}
