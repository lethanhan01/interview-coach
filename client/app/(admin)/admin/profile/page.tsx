import type { Metadata } from 'next'
import AdminProfileClient from '@/components/profile/AdminProfileClient'

export const metadata: Metadata = {
  title: 'Hồ sơ quản trị viên',
  description:
    'Quản lý thông tin tài khoản và bảo mật của quản trị viên hệ thống Intervia.',
}

export default function AdminProfilePage() {
  return <AdminProfileClient />
}
