import type { Metadata } from 'next'
import { AdminUsersClient } from '@/components/admin/users/AdminUsersClient'

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
  description:
    'Quản lý tài khoản, phân quyền và trạng thái hoạt động trên toàn hệ thống Intervia.',
}

export default function AdminUsersPage() {
  return <AdminUsersClient />
}
