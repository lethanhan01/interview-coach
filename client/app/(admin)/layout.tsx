import RoleGuard from '@/components/auth/RoleGuard'
import AppLayout from '@/components/layout/AppLayout'

import LogoutAction from '@/app/(auth)/LogoutAction'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRole="admin" fallbackRoute="/sessions">
      <AppLayout role="admin" logoutActionSlot={<LogoutAction className="w-full justify-start" />}>
        {children}
      </AppLayout>
    </RoleGuard>
  )
}
