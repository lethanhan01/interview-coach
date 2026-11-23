import type { ReactNode } from 'react'
import RoleGuard from '@/components/auth/RoleGuard'
import AppLayout from '@/components/layout/AppLayout'

export default function CandidateLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <RoleGuard allowedRole="candidate" fallbackRoute="/admin/dashboard">
      <AppLayout role="candidate">{children}</AppLayout>
    </RoleGuard>
  )
}
