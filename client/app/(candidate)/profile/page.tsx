import type { Metadata } from 'next'
import ProfileClient from '@/components/profile/ProfileClient'

export const metadata: Metadata = {
  title: 'Cài đặt tài khoản',
  description:
    'Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản ứng viên.',
}

export default function ProfilePage() {
  return <ProfileClient />
}
