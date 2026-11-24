import type { Metadata } from 'next'
import AdminProfileClient from './_components/AdminProfileClient'

export const metadata: Metadata = {
  title: 'Hồ sơ quản trị viên | InterviewCoach',
  description:
    'Quản lý thông tin tài khoản và bảo mật của quản trị viên hệ thống InterviewCoach.',
}

export default function AdminProfilePage() {
  return <AdminProfileClient />
}
