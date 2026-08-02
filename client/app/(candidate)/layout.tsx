import RoleGuard from '@/components/auth/RoleGuard'
import AppLayout from '@/components/layout/AppLayout'

import LogoutAction from '@/app/(auth)/LogoutAction'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="candidate" fallbackRoute="/admin-dashboard">
      <AppLayout role="candidate" logoutActionSlot={<LogoutAction className="w-full justify-start" />}>
        {children}
      </AppLayout>
    </RoleGuard>
  )
}
