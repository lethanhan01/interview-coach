import type { Metadata } from 'next'
import { AdminDashboardClient } from '@/components/admin/dashboard/AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Tổng quan quản trị',
  description:
    'Giám sát tăng trưởng người dùng, trạng thái phân quyền và độ phủ kho tri thức O*NET / SFIA 9.',
}

export default function AdminDashboardPage() {
  return <AdminDashboardClient />
}
